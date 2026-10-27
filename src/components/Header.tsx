import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import SearchBarWithAutocomplete from './SearchBarWithAutocomplete';
import NotificationCenter from './NotificationCenter';
import './Header.css';

const Header: React.FC = () => {
  const { language, toggleLanguage, translations } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAssistantRoute = pathname === '/ai-assistant';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const primaryNavLinks = [
    { to: '/', text: language === 'fr' ? 'Découvrir' : 'Discover' },
    { to: '/publications', text: translations.nav.journal },
    { to: '/#domains', text: language === 'fr' ? 'Domaines' : 'Domains' },
    { to: '/library', text: language === 'fr' ? 'Ma bibliothèque' : 'My library' },
  ];

  const assistantNavLinks = [
    { to: '/', text: language === 'fr' ? 'Accueil' : 'Home' },
    { to: '/publications', text: translations.nav.journal },
    { to: '/ai-assistant', text: 'Assistant IA' },
    { to: '/learning-paths', text: language === 'fr' ? 'Parcours' : 'Learning' },
    { to: '/quiz', text: 'Quiz' },
    { to: '/resources', text: translations.nav.resources },
    { to: '/events', text: translations.nav.activities },
  ];
  const desktopNavLinks = isAssistantRoute ? assistantNavLinks : primaryNavLinks;
  const canSubmit = role === 'STUDENT' || role === 'RESEARCHER' || role === 'TEACHER' || role === 'STAFF' || role === 'ADMIN';

  const navLinks = [
    ...primaryNavLinks,
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
      <div className="relative mx-auto flex h-[60px] max-w-[1440px] items-center justify-between gap-2 px-3 sm:h-[74px] sm:gap-4 sm:px-6 lg:px-9">
        <NavLink to="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-[10px]" aria-label="Galileo, accueil">
          <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[10px] bg-[#0b1e38] font-poppins text-[18px] font-bold text-white sm:h-[38px] sm:w-[38px] sm:text-[20px]">G</span>
          <span className=" truncate font-poppins text-[17px] font-bold text-[#0b1e38] dark:text-white sm:text-[19px]">Galileo</span>
        </NavLink>

        <nav className={`hidden min-w-0 flex-1 items-center justify-center xl:flex ${isAssistantRoute ? 'gap-4' : 'gap-3 2xl:gap-5'}`} aria-label="Navigation principale">
          {desktopNavLinks.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>{link.text}</NavLink>)}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {!isAssistantRoute && <SearchBarWithAutocomplete
              placeholder={language === 'fr' ? 'Rechercher un sujet, auteur, DOI…' : 'Search topic, author, DOI…'}
              onSearch={openCatalogSearch}
              className="galileo-header-search hidden w-[min(320px,24vw)] xl:block"
            />}
          <button
            type="button"
            onClick={() => setIsSearchOpen(open => !open)}
            aria-label="Rechercher une publication"
            aria-expanded={isSearchOpen}
            aria-controls="header-catalog-search"
            className="flex h-[40px] w-[40px] items-center justify-center rounded-[9px] border border-[#e9ecef] text-[#575e69] hover:bg-[#f5f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00838f] xl:hidden"
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
            className="hidden h-[36px] min-w-[42px] items-center justify-center rounded-[8px] border border-[#e9ecef] bg-[#f5f8fa] px-2 text-[11px] font-semibold text-[#575e69] sm:flex"
          >
            {language === 'fr' ? 'FR' : 'EN'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
            className="flex h-[40px] w-[40px] items-center justify-center rounded-[9px] border border-[#e9ecef] text-[#575e69] hover:bg-[#f5f8fa]"
          >
            {isAssistantRoute ? (
              <img src="/assets/figma-ai-theme.svg" alt="" aria-hidden="true" className="h-[18px] w-[18px]" />
            ) : theme === 'dark' ? (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4" strokeWidth="1.7" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" strokeWidth="1.7" strokeLinecap="round" /></svg>
            ) : (
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20.35 15.35A9 9 0 0 1 8.65 3.65 9 9 0 1 0 20.35 15.35Z" strokeWidth="1.7" strokeLinejoin="round" /></svg>
            )}
          </button>
          {isAuthenticated && <NotificationCenter designVariant={isAssistantRoute} />}

          <div className="hidden items-center gap-2 xl:flex">
            {isAuthenticated ? (
              <>
                {!isAssistantRoute && roleLink && <NavLink to={roleLink.to} className="rounded-[8px] border border-[#e9ecef] px-3 py-2 text-[11px] font-semibold text-[#575e69] hover:bg-[#f5f8fa]">{roleLink.text}</NavLink>}
                {canSubmit && <NavLink to="/submit" className={`whitespace-nowrap rounded-[9px] px-4 py-[13px] text-[11px] font-semibold text-white hover:bg-[#006b74] ${isAssistantRoute ? 'bg-[#00838f]' : 'bg-[#1a2945] hover:bg-[#253b61]'}`}>{isAssistantRoute ? (language === 'fr' ? 'Déposer un travail' : 'Submit a paper') : (language === 'fr' ? 'Importer un PDF' : 'Import a PDF')}</NavLink>}
                {isAssistantRoute && <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#f5f8fa] text-[13px] font-bold text-[#00838f]" aria-label={user?.email || 'Profil'}>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>}
                {!isAssistantRoute && <button type="button" onClick={handleLogout} className="whitespace-nowrap px-2 py-2 text-[11px] text-red-600 hover:text-red-700">{translations.auth_page?.logout_button || 'Déconnexion'}</button>}
              </>
            ) : (
              <NavLink to="/auth" className="whitespace-nowrap rounded-[9px] bg-[#1a2945] px-4 py-[13px] text-[11px] font-semibold text-white hover:bg-[#253b61]">{language === 'fr' ? 'Importer un PDF' : 'Import a PDF'}</NavLink>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen(open => !open)}
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isMenuOpen}
            className="flex h-[40px] w-[40px] items-center justify-center rounded-[8px] border border-[#e9ecef] text-[#575e69] xl:hidden"
          >
            {isMenuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeWidth="2" strokeLinecap="round" /></svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" strokeLinecap="round" /></svg>
            )}
          </button>
        </div>

        {isSearchOpen && (
          <div id="header-catalog-search" className="absolute left-3 right-3 top-[58px] z-50 rounded-[8px] border border-[#e3e8ed] bg-white p-3 shadow-lg dark:bg-gray-800 sm:left-auto sm:right-4 sm:top-[66px] sm:w-[min(440px,calc(100vw-2rem))]">
            <SearchBarWithAutocomplete placeholder="Rechercher une publication ou un auteur…" onSearch={openCatalogSearch} className="header-search" />
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className="max-h-[calc(100vh-60px)] overflow-y-auto border-t border-[#e9ecef] bg-white px-3 pb-5 pt-3 dark:border-gray-700 dark:bg-[#0a192f] sm:px-4 xl:hidden">
          <div className="mb-3 flex items-center justify-between gap-2 sm:hidden">
            <button type="button" onClick={toggleLanguage} className="min-h-[40px] min-w-[48px] rounded-[8px] border border-[#e9ecef] px-3 py-2 text-xs font-semibold">{language === 'fr' ? 'Langue : FR' : 'Language: EN'}</button>
            {isAuthenticated && <span className="min-w-0 truncate text-xs text-gray-500">{user?.email}</span>}
          </div>
          <nav className="grid grid-cols-1 gap-1 min-[360px]:grid-cols-2 sm:grid-cols-3" aria-label="Navigation mobile">
            {navLinks.map(link => <NavLink key={link.to} to={link.to} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `flex min-h-[44px] items-center rounded-[6px] px-3 py-2 text-sm ${isActive ? 'bg-[#e3f5f5] font-semibold text-[#00838f]' : 'text-[#575e69] hover:bg-[#f5f8fa] dark:text-gray-200'}`}>{link.text}</NavLink>)}
            {roleLink && <NavLink to={roleLink.to} onClick={() => setIsMenuOpen(false)} className="flex min-h-[44px] items-center rounded-[6px] px-3 py-2 text-sm text-[#575e69] hover:bg-[#f5f8fa] dark:text-gray-200">{roleLink.text}</NavLink>}
          </nav>
          <div className="mt-3 border-t border-[#e9ecef] pt-3 xl:hidden">
            {isAuthenticated ? (
              <div className="grid grid-cols-1 gap-2 min-[380px]:flex min-[380px]:flex-wrap">
                {canSubmit && <NavLink to="/submit" onClick={() => setIsMenuOpen(false)} className="flex min-h-[44px] items-center justify-center rounded-[8px] bg-[#00838f] px-4 py-2.5 text-center text-sm font-semibold text-white">{translations.nav.submit}</NavLink>}
                <button type="button" onClick={handleLogout} className="flex min-h-[44px] items-center justify-center rounded-[8px] border border-red-200 px-4 py-2.5 text-sm text-red-600">{translations.auth_page?.logout_button || 'Déconnexion'}</button>
              </div>
            ) : <NavLink to="/auth" onClick={() => setIsMenuOpen(false)} className="flex min-h-[44px] w-full items-center justify-center rounded-[8px] bg-[#00838f] px-4 py-2.5 text-sm font-semibold text-white sm:w-auto sm:inline-flex">{translations.auth_page?.login_button || 'Connexion'}</NavLink>}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
