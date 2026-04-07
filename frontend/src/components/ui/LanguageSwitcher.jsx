import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggle = () => {
    i18n.changeLanguage(isAr ? 'en' : 'ar');
  };

  return (
    <button
      onClick={toggle}
      className={`px-2 py-1 rounded-lg text-xs font-semibold text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] transition-colors ${className}`}
      title={isAr ? 'English' : 'العربية'}
    >
      {isAr ? 'EN' : 'ع'}
    </button>
  );
}
