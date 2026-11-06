import { useState, useEffect } from 'react';
import { Disc3, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shows the dashboard logo of the current tenant: the uploaded company logo
// when one is set, otherwise the default OTTMConnect lockup.
export default function BrandLogo({ logoUrl, canEdit, onClick, variant = 'dark', className }) {
  const isDark = variant === 'dark';
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      {logoUrl && !imgError ? (
        <img
          src={logoUrl}
          alt="Dashboard logo"
          onError={() => setImgError(true)}
          className="h-9 max-w-[140px] object-contain shrink-0"
        />
      ) : (
        <>
          <Disc3 className="w-7 h-7 text-indigo-400 shrink-0" />
          <span
            className={cn(
              'font-semibold text-lg tracking-tight truncate',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            OTTMConnect
          </span>
        </>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={onClick}
          title="Change logo"
          aria-label="Change logo"
          className={cn(
            'shrink-0 rounded-md p-1.5 border transition',
            isDark
              ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
              : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400'
          )}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
