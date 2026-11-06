import React from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative">
      <div className="absolute top-4 start-4 z-10">
        <a
          href="https://mayramusic.in"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors bg-card/60 backdrop-blur-sm border border-border/80 px-3 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to mayramusic.in</span>
        </a>
      </div>
      <div className="absolute top-4 end-4 z-10">
        <LanguageSwitcher variant="light" placement="down" />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="https://mayramusic.in" className="inline-flex items-center gap-3 mb-4 group">
            <img
              src="/mayra-logo.png"
              alt="Mayra Music Logo"
              className="w-12 h-12 object-contain rounded-xl drop-shadow group-hover:scale-105 transition-transform"
            />
            <div className="text-start">
              <span className="block font-display font-bold text-xl tracking-tight text-foreground leading-none">
                MAYRA
              </span>
              <span className="block text-[0.68rem] font-medium tracking-[0.3em] text-primary uppercase leading-none mt-1">
                MUSIC
              </span>
            </div>
          </a>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-1.5">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-xl border border-border/80 p-8 backdrop-blur-sm">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
