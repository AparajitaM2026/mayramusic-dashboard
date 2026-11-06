import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2 } from 'lucide-react';

export default function LogoUploadDialog({ open, onOpenChange, onSaved, partyId }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleClose = (next) => {
    if (saving) return;
    if (!next) setFile(null);
    onOpenChange(next);
  };

  const saveLogo = async (logoUrl) => {
    const res = await base44.functions.invoke('updatePartyLogo', { logo_url: logoUrl, party_id: partyId });
    if (res.data?.error) throw new Error(res.data.error);
    const savedUrl = res.data?.logo_url !== undefined ? res.data.logo_url : logoUrl;
    onSaved(savedUrl || '');
  };

  const handleUpload = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await saveLogo(file_url);
      setFile(null);
      toast({ title: 'Logo updated', description: 'Your dashboard now shows the new logo.' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Could not update the logo', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await saveLogo('');
      setFile(null);
      toast({ title: 'Logo reset', description: 'Showing the default OTTMConnect logo again.' });
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Could not reset the logo', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dashboard logo</DialogTitle>
          <DialogDescription>
            Upload the logo your dashboard and everyone under your account sees. PNG, JPG or SVG, ideally on a
            transparent background.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            type="file"
            accept="image/*"
            disabled={saving}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file && (
            <img
              src={URL.createObjectURL(file)}
              alt="Selected logo preview"
              className="h-16 w-auto max-w-full object-contain rounded border border-slate-200 bg-white p-2"
            />
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving} className="gap-2">
            <Trash2 className="w-4 h-4" /> Reset to default
          </Button>
          <Button onClick={handleUpload} disabled={!file || saving} className="gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save logo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}