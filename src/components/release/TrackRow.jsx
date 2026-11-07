import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Upload, Loader2, FileAudio, Plus } from 'lucide-react';
import { uploadPublicFileWithProgress } from '@/lib/uploadWithProgress';

export default function TrackRow({ index, track, onChange, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const update = (field, value) => {
    onChange(index, { ...track, [field]: value });
  };

  const updateArtist = (ai, field, value) => {
    const artists = [...(track.artists || [])];
    const updates = { [field]: value };
    if (field === 'spotify_mode' && value === 'none') updates.spotify_artist_url = '';
    artists[ai] = { ...artists[ai], ...updates };
    onChange(index, { ...track, artists });
  };

  const addArtist = () => {
    const artists = [...(track.artists || []), { name: '', spotify_mode: '', spotify_artist_url: '', artist_facebook: '', artist_instagram: '' }];
    onChange(index, { ...track, artists });
  };

  const removeArtist = (ai) => {
    const artists = (track.artists || []).filter((_, i) => i !== ai);
    onChange(index, { ...track, artists });
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await uploadPublicFileWithProgress(file, setUploadProgress);
      onChange(index, { ...track, audio_url: res.file_url, audio_filename: file.name });
    } catch (err) {
      alert('Audio upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">Track {index + 1}</span>
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="h-7 w-7 text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Track Title *</Label>
          <Input value={track.title || ''} onChange={(e) => update('title', e.target.value)} className="h-8 text-sm" placeholder="Track title" />
        </div>
        <div>
          <Label className="text-xs">Version</Label>
          <Input value={track.version || ''} onChange={(e) => update('version', e.target.value)} className="h-8 text-sm" placeholder="e.g. Radio Edit, Remix" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">ISRC</Label>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => update('isrc_mode', 'own')}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition text-left ${track.isrc_mode === 'own' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
              >
                I have My Own ISRC
              </button>
              <button
                type="button"
                onClick={() => onChange(index, { ...track, isrc_mode: 'none', isrc: '' })}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition text-left ${track.isrc_mode === 'none' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
              >
                I don't have ISRC
              </button>
            </div>
            {track.isrc_mode === 'own' && (
              <Input value={track.isrc || ''} onChange={(e) => update('isrc', e.target.value)} className="h-8 text-sm font-mono" placeholder="Enter your ISRC" />
            )}
            {track.isrc_mode === 'none' && (
              <p className="text-xs text-slate-500 italic">Mayra Music will assign an ISRC on your behalf.</p>
            )}
          </div>
        </div>
        <div className="md:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Primary Artist(s) *</Label>
            <Button variant="ghost" size="sm" onClick={addArtist} className="h-7 text-xs text-indigo-600 hover:text-indigo-700">
              <Plus className="w-3.5 h-3.5" /> Add Artist
            </Button>
          </div>
          {(track.artists || []).map((artist, ai) => (
            <div key={ai} className="rounded-md border border-slate-200 p-3 space-y-2 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Artist {ai + 1}</span>
                {(track.artists || []).length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeArtist(ai)} className="h-6 w-6 text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-xs">Artist Name *</Label>
                <Input value={artist.name || ''} onChange={(e) => updateArtist(ai, 'name', e.target.value)} className="h-8 text-sm" placeholder="Artist name" />
              </div>
              <div>
                <Label className="text-xs">Spotify Artist Profile</Label>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateArtist(ai, 'spotify_mode', 'have')}
                      className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition text-left ${artist.spotify_mode === 'have' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                    >
                      I have a Spotify Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => updateArtist(ai, 'spotify_mode', 'none')}
                      className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition text-left ${artist.spotify_mode === 'none' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                    >
                      I don't have a Spotify Profile
                    </button>
                  </div>
                  {artist.spotify_mode === 'have' && (
                    <Input value={artist.spotify_artist_url || ''} onChange={(e) => updateArtist(ai, 'spotify_artist_url', e.target.value)} className="h-8 text-sm" placeholder="https://open.spotify.com/artist/..." />
                  )}
                  {artist.spotify_mode === 'none' && (
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Facebook URL *</Label>
                          <Input value={artist.artist_facebook || ''} onChange={(e) => updateArtist(ai, 'artist_facebook', e.target.value)} className="h-8 text-sm" placeholder="facebook.com/artistname" />
                        </div>
                        <div>
                          <Label className="text-xs">Instagram URL *</Label>
                          <Input value={artist.artist_instagram || ''} onChange={(e) => updateArtist(ai, 'artist_instagram', e.target.value)} className="h-8 text-sm" placeholder="instagram.com/artistname" />
                        </div>
                      </div>
                      {(!artist.artist_facebook?.trim() || !artist.artist_instagram?.trim()) && (
                        <p className="text-xs text-amber-600">Both links are required when there is no Spotify profile.</p>
                      )}
                    </div>
                  )}
                  {!artist.spotify_mode && (
                    <p className="text-xs text-amber-600">Choose a Spotify option so the admin can verify this artist's profile.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 pb-1">
          <Checkbox id={`explicit-${index}`} checked={!!track.explicit} onCheckedChange={(v) => update('explicit', v)} />
          <Label htmlFor={`explicit-${index}`} className="text-xs cursor-pointer">Explicit Content</Label>
        </div>
        <div>
          <Label className="text-xs">Composers</Label>
          <Input value={track.composers || ''} onChange={(e) => update('composers', e.target.value)} className="h-8 text-sm" placeholder="Composer names" />
        </div>
        <div>
          <Label className="text-xs">Lyricists</Label>
          <Input value={track.lyricists || ''} onChange={(e) => update('lyricists', e.target.value)} className="h-8 text-sm" placeholder="Lyricist names" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Audio File (WAV/FLAC)</Label>
        <div className="flex items-center gap-2 mt-1">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 text-sm">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{track.audio_url ? 'Replace Audio' : 'Upload Audio'}</span>
            <input type="file" accept=".wav,.flac,.mp3,.aac" className="hidden" onChange={handleAudioUpload} disabled={uploading} />
          </label>
          {track.audio_filename && !uploading && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <FileAudio className="w-3.5 h-3.5" /> {track.audio_filename}
            </span>
          )}
        </div>
        {uploading && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-xs">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="text-xs text-slate-500 tabular-nums">{uploadProgress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
