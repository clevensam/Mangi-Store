import React from 'react';
import { translations, type Language } from '../lib/i18n';

export default function SettingsPage({ lang }: { lang: Language }) {
  const t = translations[lang];
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t.settings}</h1>
      <p className="text-slate-500">System settings coming soon.</p>
    </div>
  );
}
