import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import SearchBarWithAutocomplete from './SearchBarWithAutocomplete';
import NotificationCenter from './NotificationCenter';

const Header: React.FC = () => {
  const { language, toggleLanguage, translations } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navLinks = [
    { to: '/', text: translations.nav.home },
    { to: '/publications', text: translations.nav.journal },
    { to: '/ai-assistant', text: 'Assistant IA' },
    { to: '/learning-paths', text: 'Parcours' },
    { to: '/quiz', text: 'Quiz' },
    { to: '/resources', text: translations.nav.resources },
    { to: '/events', text: translations.nav.activities },
    { to: '/about', text: translations.nav.about },
  ];

  const roleLink = role === 'ADMIN'
    ? { to: '/dashboard/admin', text: 'Dashboard' }
    : role === 'STAFF'
      ? { to: '/dashboard/staff', text: 'Dashboard' }
      : role === 'STUDENT'
        ? { to: '/dashboard/student', text: 'Mon espace' }
        : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const openCatalogSearch = (query: string) => {
    setIsSearchOpen(false);
    setIsMenuOpen(false);
    navigate(`/publications${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap text-[12px] transition-colors ${isActive ? 'font-semibold text-[#00838f]' : 'text-[#575e69] hover:text-[#00838f]'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#e9ecef] bg-white dark:border-gray-700 dark:bg-[#0a192f]">
      <div className="relative mx-auto flex h-[74px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
        <NavLink to="/" className="flex shrink-0 items-center gap-[10px]" aria-label="Galileo, accueil">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#0b1e38] font-poppins text-[20px] font-bold text-white">G</span>
          <span className="font-poppins text-[19px] font-bold text-[#0b1e38] dark:text-white">Galileo</span>
        </NavLink>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 xl:flex 2xl:gap-[19px]" aria-label="Navigation principale">
          {navLinks.map(link => <NavLink key={link.to} to={link.to} className={linkClass}>{link.text}</NavLink>)}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsSearchOpen(open => !open)}
            aria-label="Rechercher une publication"
            aria-expanded={isSearchOpen}
            aria-controls="header-catalog-search"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#e9ecef] text-[#575e69] hover:bg-[#f5f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00838f]"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" strokeWidth="1.8" />
              <path d="m16 16 4.2 4.2" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={language === 'fr' ? 'Switch language to English' : 'Passer la langue en français'}
            className="hidden h-[32px] min-w-[42px] items-center justify-center rounded-[8px] border border-[#e9ecef] bg-[#f5f8fa] px-2 text-[11px] font-semibold text-[#575e69] sm:flex"
          >
            {language === 'fr' ? 'FR' : 'EN'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#e9ecef] text-[#575e69] hover:bg-[#f5f8fa]"
          >
            {theme === 'dark' ? (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4" strokeWidth="1.7" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" strokeWidth="1.7" strokeLinecap="round" /></svg>
            ) : (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20.35 15.35A9 9 0 0 1 8.65 3.65 9 9 0 1 0 20.35 15.35Z" strokeWidth="1.7" strokeLinejoin="round" /></svg>
            )}
          </button>
          {isAuthenticated && <NotificationCenter />}

          <div className="hidden items-center gap-2 xl:flex">
            {isAuthenticated ? (
              <>
                {roleLink && <NavLink to={roleLink.to} className="rounded-[8px] border border-[#e9ecef] px-3 py-2 text-[11px] font-semibold text-[#575e69] hover:bg-[#f5f8fa]">{roleLink.text}</NavLink>}
                {(role === 'STUDENT' || role === 'STAFF' || role === 'ADMIN') && <NavLink to="/submit" className="whitespace-nowrap rounded-[9px] bg-[#00838f] px-4 py-[13px] text-[11px] font-semibold text-white hover:bg-[#006e78]">{translations.nav.submit}</NavLink>}
                <button type="button" onClick={handleLogout} className="whitespace-nowrap px-2 py-2 text-[11px] text-red-600 hover:text-red-700">{translations.auth_page?.logout_button || 'Déconnexion'}</button>
              </>
            ) : (
              <NavLink to="/auth" className="whitespace-nowrap rounded-[9px] bg-[#00838f] px-4 py-[13px] text-[11px] font-semibold text-white hover:bg-[#006e78]">{translations.auth_page?.login_button || 'Connexion'}</NavLink>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(open => !open)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMenuOpen}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-[8px] border border-[#e9ecef] text-[#575e69] xl:hidden"
          >
            {isMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" /></svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" /></svg>
            )}
          </button>
        </div>

        {isSearchOpen && (
          <div id="header-catalog-search" className="absolute right-4 top-[66px] z-50 w-[min(440px,calc(100vw-2rem))] rounded-[8px] border border-[#e3e8ed] bg-white p-3 shadow-lg dark:bg-gray-800">
            <SearchBarWithAutocomplete placeholder="Rechercher une publication ou un auteur…" onSearch={openCatalogSearch} className="header-search" />
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className="border-t border-[#e9ecef] bg-white px-4 pb-5 pt-3 dark:border-gray-700 dark:bg-[#0a192f] xl:hidden">
          <div className="mb-3 flex gap-2 sm:hidden">
            <button type="button" onClick={toggleLanguage} className="rounded-[8px] border border-[#e9ecef] px-3 py-2 text-sm">{language === 'fr' ? 'FR' : 'EN'}</button>
            {isAuthenticated && <span className="self-center truncate text-sm text-gray-500">{user?.email}</span>}
          </div>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3" aria-label="Navigation mobile">
            {navLinks.map(link => <NavLink key={link.to} to={link.to} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `rounded-[6px] px-3 py-2.5 text-sm ${isActive ? 'bg-[#e3f5f5] font-semibold text-[#00838f]' : 'text-[#575e69] hover:bg-[#f5f8fa]'}`}>{link.text}</NavLink>)}
            {roleLink && <NavLink to={roleLink.to} onClick={() => setIsMenuOpen(false)} className="rounded-[6px] px-3 py-2.5 text-sm text-[#575e69] hover:bg-[#f5f8fa]">{roleLink.text}</NavLink>}
          </nav>
          <div className="mt-3 border-t border-[#e9ecef] pt-3 xl:hidden">
            {isAuthenticated ? (
              <div className="flex flex-wrap gap-2">
                {(role === 'STUDENT' || role === 'STAFF' || role === 'ADMIN') && <NavLink to="/submit" onClick={() => setIsMenuOpen(false)} className="rounded-[8px] bg-[#00838f] px-4 py-2.5 text-sm font-semibold text-white">{translations.nav.submit}</NavLink>}
                <button type="button" onClick={handleLogout} className="rounded-[8px] border border-red-200 px-4 py-2.5 text-sm text-red-600">{translations.auth_page?.logout_button || 'Déconnexion'}</button>
              </div>
            ) : <NavLink to="/auth" onClick={() => setIsMenuOpen(false)} className="inline-flex rounded-[8px] bg-[#00838f] px-4 py-2.5 text-sm font-semibold text-white">{translations.auth_page?.login_button || 'Connexion'}</NavLink>}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
