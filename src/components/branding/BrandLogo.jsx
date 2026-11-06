import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shows the dashboard logo: Mayra Music branded lockup by default,
// or a custom uploaded logo if configured.
export default function BrandLogo({ logoUrl, canEdit, onClick, variant = 'dark', className }) {
  const isDark = variant === 'dark';
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  return (
    <div className={cn('flex items-center gap-3 min-w-0', className)}>
      <a 
        href="https://mayramusic.in" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
        title="Visit Mayra Music Website (mayramusic.in)"
      >
        <img
          src={(!imgError && logoUrl) ? logoUrl : "/mayra-logo.png"}
          alt="Mayra Music Logo"
          onError={() => setImgError(true)}
          className="h-9 w-9 object-contain shrink-0 rounded-md"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-display font-bold text-base tracking-tight text-foreground leading-none group-hover:text-primary transition-colors">
            MAYRA
          </span>
          <span className="text-[0.62rem] font-medium tracking-[0.28em] text-primary uppercase leading-none mt-1">
            MUSIC
          </span>
        </div>
      </a>

      {canEdit && (
        <button
          type="button"
          onClick={onClick}
          title="Change logo"
          aria-label="Change logo"
          className={cn(
            'shrink-0 rounded-md p-1.5 border transition ms-1',
            isDark
              ? 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
          )}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
