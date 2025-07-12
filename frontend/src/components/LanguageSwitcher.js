import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="lang-switcher">
  <select
    value={i18n.language}
    onChange={e => i18n.changeLanguage(e.target.value)}
    className="lang-select"
  >
    <option value="en">EN</option>
    <option value="fr">FR</option>
  </select>
</div>

  );
}
