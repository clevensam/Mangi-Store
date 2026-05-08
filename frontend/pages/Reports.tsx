import React from 'react';
import { translations, type Language } from '../lib/i18n';

export default function ReportsPage({ lang }: { lang: Language }) {
  const t = translations[lang];
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t.reports}</h1>
      <p className="text-slate-500">Business reports coming soon.</p>
    </div>
  );
}
