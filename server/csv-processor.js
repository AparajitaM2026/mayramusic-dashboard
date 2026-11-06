import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { db } from './pg-db.js';
import { sendEmail } from './email-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOUSE_IMPRINTS = ['HOUSE CATALOG', 'OTT HOUSE', 'HOUSE', 'HOUSE ACCOUNT', 'OTT HOUSE CATALOG'];

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function processCsvUpload(jobId) {
  try {
    const job = await db.get('CsvUploadJob', jobId);
    if (!job) return;

    await db.update('CsvUploadJob', jobId, { status: 'processing' });

    let filePath = '';
    if (job.file_url) {
      if (job.file_url.startsWith('/uploads/')) {
        filePath = path.join(__dirname, '..', job.file_url);
      } else if (job.file_url.startsWith('http://') || job.file_url.startsWith('https://')) {
        // remote URL download
        const res = await fetch(job.file_url);
        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          filePath = path.join(__dirname, '../uploads', `downloaded_${Date.now()}.csv`);
          fs.writeFileSync(filePath, buffer);
        }
      } else {
        filePath = path.join(__dirname, '../uploads', path.basename(job.file_url));
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      await db.update('CsvUploadJob', jobId, {
        status: 'failed',
        error: `Upload file not found at ${job.file_url || 'empty path'}`
      });
      return;
    }

    const fileSize = fs.statSync(filePath).size;
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    // Load mappings and accounts from DB
    const labelMappings = await db.list('LabelMapping', '-created_date', 500, 0);
    const clientAccounts = await db.list('ClientAccount', '-created_date', 500, 0);

    const mappingMap = new Map();
    for (const lm of labelMappings) {
      if (lm.imprint_name && lm.client_account_id) {
        mappingMap.set(lm.imprint_name.trim().toUpperCase(), lm.client_account_id);
      }
    }
    const clientMap = new Map();
    for (const ca of clientAccounts) {
      clientMap.set(ca.id, ca.client_name);
    }

    let headers = null;
    let colIndices = {};
    let total = 0;
    let house = 0;
    let client = 0;
    let unmapped = 0;
    const unmappedImprints = new Set();

    const revenueRows = [];

    for await (const rawLine of rl) {
      const line = rawLine.trim();
      if (!line) continue;

      if (!headers) {
        headers = parseCsvLine(line).map(h => h.trim().toUpperCase().replace(/[\s/_-]+/g, ''));
        headers.forEach((h, idx) => {
          if (h.includes('TRACK') || h.includes('TITLE') || h.includes('SONG')) colIndices.track = colIndices.track ?? idx;
          if (h.includes('ARTIST')) colIndices.artist = colIndices.artist ?? idx;
          if (h.includes('ISRC')) colIndices.isrc = colIndices.isrc ?? idx;
          if (h.includes('LABEL') || h.includes('IMPRINT')) colIndices.label = colIndices.label ?? idx;
          if (h.includes('STORE') || h.includes('DSP') || h.includes('SERVICE') || h.includes('PARTNER')) colIndices.store = colIndices.store ?? idx;
          if (h.includes('GROSS') || h.includes('TOTAL') || h.includes('NET') || h.includes('ROYALTY') || h.includes('AMOUNT')) colIndices.gross = colIndices.gross ?? idx;
          if (h.includes('UNITS') || h.includes('QUANTITY') || h.includes('STREAMS') || h.includes('QTY')) colIndices.units = colIndices.units ?? idx;
          if (h.includes('COUNTRY') || h.includes('TERRITORY')) colIndices.country = colIndices.country ?? idx;
        });
        continue;
      }

      const cols = parseCsvLine(line);
      const track_title = cols[colIndices.track] || 'Unknown Track';
      const artist_name = cols[colIndices.artist] || 'Unknown Artist';
      const isrc = cols[colIndices.isrc] || '';
      const label_imprint = cols[colIndices.label] || '';
      const store_dsp = cols[colIndices.store] || 'Other';
      const gross_revenue = parseFloat(cols[colIndices.gross]) || 0;
      const units = parseInt(cols[colIndices.units], 10) || 1;
      const country = cols[colIndices.country] || 'World';

      total++;

      const normalizedLabel = label_imprint.trim().toUpperCase();
      let client_account_id = null;
      let client_name = null;
      let is_house_label = false;
      let is_unmapped = false;

      if (HOUSE_IMPRINTS.includes(normalizedLabel)) {
        is_house_label = true;
        house++;
      } else if (mappingMap.has(normalizedLabel)) {
        client_account_id = mappingMap.get(normalizedLabel);
        client_name = clientMap.get(client_account_id) || 'Client Label';
        client++;
      } else {
        is_unmapped = true;
        unmapped++;
        if (label_imprint) unmappedImprints.add(label_imprint);
      }

      revenueRows.push({
        track_title,
        artist_name,
        isrc,
        label_imprint,
        store_dsp,
        gross_revenue,
        units,
        country,
        report_month: job.report_month,
        vendor_name: job.vendor_name || 'Orchard',
        client_account_id,
        client_name,
        is_house_label,
        is_unmapped
      });

      // Insert in chunks of 250
      if (revenueRows.length >= 250) {
        for (const row of revenueRows) {
          await db.create('RevenueRow', row);
        }
        revenueRows.length = 0;
      }
    }

    // Flush remainder
    for (const row of revenueRows) {
      await db.create('RevenueRow', row);
    }

    const unmappedList = Array.from(unmappedImprints).slice(0, 50);

    // Update job status
    await db.update('CsvUploadJob', jobId, {
      status: 'completed',
      total,
      house,
      client,
      unmapped,
      unmapped_imprints: unmappedList,
      rows_processed: total,
      bytes_processed: fileSize,
      bytes_total: fileSize,
      completed_at: new Date().toISOString()
    });

    // Send email notification to admins
    await sendEmail({
      to: 'amit@ottsol.com',
      subject: `CSV Upload Ingested: ${job.vendor_name || 'Royalty File'} (${job.report_month})`,
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>CSV Ingestion Completed Successfully</h2>
          <p><strong>Month:</strong> ${job.report_month}</p>
          <p><strong>Vendor:</strong> ${job.vendor_name || 'Orchard'}</p>
          <p><strong>Total Rows:</strong> ${total.toLocaleString()}</p>
          <ul>
            <li>Client Rows: ${client.toLocaleString()}</li>
            <li>House Catalog Rows: ${house.toLocaleString()}</li>
            <li>Unmapped Rows: ${unmapped.toLocaleString()}</li>
          </ul>
          ${unmappedList.length > 0 ? `<p><strong>Unmapped Labels:</strong> ${unmappedList.join(', ')}</p>` : ''}
          <hr>
          <p style="color:#777;font-size:12px;">Processed automatically by OTTM Connect.</p>
        </div>
      `
    });

  } catch (err) {
    console.error(`[CsvProcessor] Error processing job ${jobId}:`, err);
    try {
      await db.update('CsvUploadJob', jobId, { status: 'failed', error: err.message });
    } catch {}
  }
}

export async function processCatalogSearch(jobId) {
  try {
    const job = await db.get('CatalogSearchJob', jobId);
    if (!job || !job.query) return;

    await db.update('CatalogSearchJob', jobId, { status: 'processing' });

    const q = job.query.toLowerCase().trim();
    const rows = await db.filter('RevenueRow', {}, '-created_date', 5000, 0);

    const matchingTracks = [];
    const imprintsSet = new Set();
    const seenTracks = new Map();

    for (const r of rows) {
      const match =
        (r.track_title && r.track_title.toLowerCase().includes(q)) ||
        (r.artist_name && r.artist_name.toLowerCase().includes(q)) ||
        (r.isrc && r.isrc.toLowerCase().includes(q)) ||
        (r.label_imprint && r.label_imprint.toLowerCase().includes(q));

      if (match) {
        if (r.label_imprint) imprintsSet.add(r.label_imprint);
        const key = `${r.isrc || ''}|${r.track_title || ''}`;
        const ex = seenTracks.get(key);
        if (ex) {
          ex.gross += Number(r.gross_revenue) || 0;
          ex.units += Number(r.units) || 0;
          ex.rows += 1;
        } else {
          seenTracks.set(key, {
            track_title: r.track_title || '',
            artist: r.artist_name || '',
            isrc: r.isrc || '',
            label_imprint: r.label_imprint || '',
            gross: Number(r.gross_revenue) || 0,
            units: Number(r.units) || 0,
            rows: 1
          });
        }
      }
    }

    const results = Array.from(seenTracks.values()).sort((a, b) => b.gross - a.gross);
    const imprints = Array.from(imprintsSet).map(key => ({ key, rows: 1 }));

    await db.update('CatalogSearchJob', jobId, {
      status: 'completed',
      results: JSON.stringify(results),
      imprints: JSON.stringify(imprints),
      track_count: results.length,
      imprint_count: imprints.length,
      scanned: rows.length
    });
  } catch (err) {
    console.error(`[CatalogSearchProcessor] Error processing job ${jobId}:`, err);
    try {
      await db.update('CatalogSearchJob', jobId, { status: 'failed', error: err.message });
    } catch {}
  }
}
