import React, { useState, useEffect } from 'react';

interface TeamLogoProps {
  name: string;
  logoUrl?: string;
  className?: string;
}

export function TeamLogo({ name, logoUrl, className = 'w-full h-full' }: TeamLogoProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when logoUrl changes
  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  // Design beautiful brand-color fallbacks for each La Liga team
  const teamConfigMap: Record<string, { bg: string; text: string; initials: string; border: string }> = {
    'barcelona': { bg: 'from-blue-600 to-red-600', border: 'border-blue-400/30', text: 'text-white', initials: 'FCB' },
    'ბარსელონა': { bg: 'from-blue-600 to-red-600', border: 'border-blue-400/30', text: 'text-white', initials: 'FCB' },
    'real madrid': { bg: 'from-zinc-100 to-amber-100', border: 'border-zinc-300/40', text: 'text-amber-955 font-black', initials: 'RMA' },
    'რეალ მადრიდი': { bg: 'from-zinc-100 to-amber-100', border: 'border-zinc-300/40', text: 'text-amber-955 font-black', initials: 'RMA' },
    'villarreal': { bg: 'from-yellow-400 to-yellow-600', border: 'border-yellow-300/30', text: 'text-yellow-950', initials: 'VIL' },
    'ვილიარეალი': { bg: 'from-yellow-400 to-yellow-600', border: 'border-yellow-300/30', text: 'text-yellow-950', initials: 'VIL' },
    'atlético madrid': { bg: 'from-red-600 to-zinc-100', border: 'border-red-400/30', text: 'text-zinc-900', initials: 'ATM' },
    'ატლეტიკო მადრიდი': { bg: 'from-red-600 to-zinc-100', border: 'border-red-400/30', text: 'text-zinc-900', initials: 'ATM' },
    'atletico madrid': { bg: 'from-red-600 to-zinc-100', border: 'border-red-400/30', text: 'text-zinc-900', initials: 'ATM' },
    'real betis': { bg: 'from-green-600 to-zinc-100', border: 'border-green-400/30', text: 'text-zinc-900', initials: 'BET' },
    'რეალ ბეტისი': { bg: 'from-green-600 to-zinc-100', border: 'border-green-400/30', text: 'text-zinc-900', initials: 'BET' },
    'celta': { bg: 'from-sky-300 to-sky-500', border: 'border-sky-400/30', text: 'text-sky-955', initials: 'CEL' },
    'სელტა': { bg: 'from-sky-300 to-sky-500', border: 'border-sky-400/30', text: 'text-sky-955', initials: 'CEL' },
    'celta vigo': { bg: 'from-sky-300 to-sky-500', border: 'border-sky-400/30', text: 'text-sky-955', initials: 'CEL' },
    'getafe': { bg: 'from-blue-600 to-blue-800', border: 'border-blue-500/30', text: 'text-white', initials: 'GET' },
    'ხეტაფე': { bg: 'from-blue-600 to-blue-800', border: 'border-blue-500/30', text: 'text-white', initials: 'GET' },
    'real sociedad': { bg: 'from-blue-500 to-zinc-100', border: 'border-blue-400/30', text: 'text-blue-955', initials: 'RSO' },
    'რეალ სოსიედადი': { bg: 'from-blue-500 to-zinc-100', border: 'border-blue-400/30', text: 'text-blue-955', initials: 'RSO' },
    'athletic club': { bg: 'from-red-600 to-zinc-100', border: 'border-red-400/30', text: 'text-red-955', initials: 'ATH' },
    'ატლეტიკ კლუბი': { bg: 'from-red-600 to-zinc-100', border: 'border-red-400/30', text: 'text-red-955', initials: 'ATH' },
    'rayo vallecano': { bg: 'from-zinc-100 to-red-600', border: 'border-red-400/30', text: 'text-zinc-900', initials: 'RAY' },
    'რაიო ვალეკანო': { bg: 'from-zinc-100 to-red-600', border: 'border-red-400/30', text: 'text-zinc-900', initials: 'RAY' },
    'valencia': { bg: 'from-orange-500 to-zinc-950', border: 'border-orange-400/30', text: 'text-white', initials: 'VAL' },
    'ვალენსია': { bg: 'from-orange-500 to-zinc-950', border: 'border-orange-400/30', text: 'text-white', initials: 'VAL' },
    'sevilla': { bg: 'from-red-500 to-zinc-100', border: 'border-red-400/30', text: 'text-red-955', initials: 'SEV' },
    'სევილია': { bg: 'from-red-500 to-zinc-100', border: 'border-red-400/30', text: 'text-red-955', initials: 'SEV' },
    'osasuna': { bg: 'from-red-700 to-blue-950', border: 'border-red-500/30', text: 'text-white', initials: 'OSA' },
    'ოსასუნა': { bg: 'from-red-700 to-blue-950', border: 'border-red-500/30', text: 'text-white', initials: 'OSA' },
    'espanyol': { bg: 'from-blue-500 to-zinc-100', border: 'border-blue-400/30', text: 'text-blue-955', initials: 'ESP' },
    'ესპანიოლი': { bg: 'from-blue-500 to-zinc-100', border: 'border-blue-400/30', text: 'text-blue-955', initials: 'ESP' },
    'girona': { bg: 'from-red-600 to-zinc-100', border: 'border-red-400/30', text: 'text-red-955', initials: 'GIR' },
    'ჟირონა': { bg: 'from-red-600 to-zinc-100', border: 'border-red-400/30', text: 'text-red-955', initials: 'GIR' },
    'alavés': { bg: 'from-blue-600 to-zinc-100', border: 'border-blue-450/30', text: 'text-blue-955', initials: 'ALA' },
    'ალავესი': { bg: 'from-blue-600 to-zinc-100', border: 'border-blue-450/30', text: 'text-blue-955', initials: 'ALA' },
    'alaves': { bg: 'from-blue-600 to-zinc-100', border: 'border-blue-450/30', text: 'text-blue-955', initials: 'ALA' },
    'elche': { bg: 'from-green-700 to-zinc-100', border: 'border-green-500/30', text: 'text-green-955', initials: 'ELC' },
    'ელჩე': { bg: 'from-green-700 to-zinc-100', border: 'border-green-500/30', text: 'text-green-955', initials: 'ELC' },
    'mallorca': { bg: 'from-red-600 to-zinc-900', border: 'border-red-500/30', text: 'text-white', initials: 'MAL' },
    'მალიორკა': { bg: 'from-red-600 to-zinc-900', border: 'border-red-500/30', text: 'text-white', initials: 'MAL' },
    'levante': { bg: 'from-blue-700 to-red-600', border: 'border-blue-500/30', text: 'text-white', initials: 'LEV' },
    'ლევანტე': { bg: 'from-blue-700 to-red-600', border: 'border-blue-500/30', text: 'text-white', initials: 'LEV' },
    'real oviedo': { bg: 'from-blue-800 to-zinc-100', border: 'border-blue-600/30', text: 'text-blue-955', initials: 'OVI' },
    'რეალ ოვიედო': { bg: 'from-blue-800 to-zinc-100', border: 'border-blue-600/30', text: 'text-blue-955', initials: 'OVI' }
  };

  const nameKey = name.toLowerCase().trim();
  const config = teamConfigMap[nameKey] || {
    bg: 'from-zinc-700 to-zinc-900',
    border: 'border-zinc-650',
    text: 'text-zinc-200',
    initials: name.substring(0, 3).toUpperCase()
  };

  if (hasError || !logoUrl) {
    return (
      <div className={`w-full h-full rounded bg-gradient-to-br ${config.bg} border ${config.border} flex items-center justify-center select-none shadow-inner p-0.5`}>
        <span className={`text-[7px] leading-tight font-black uppercase tracking-tighter ${config.text}`}>
          {config.initials}
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={name}
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
      onError={() => {
        // Prevent infinite error recursion if default logs error
        setHasError(true);
      }}
    />
  );
}
