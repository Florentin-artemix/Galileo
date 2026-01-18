import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';
import NotificationCenter from './NotificationCenter';

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const MenuIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Header: React.FC = () => {
  const { language, toggleLanguage, translations } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: '/', text: translations.nav.home },
    { to: '/about', text: translations.nav.about },
    { to: '/events', text: translations.nav.activities },
    { to: '/publications', text: translations.nav.journal },
    { to: '/resources', text: translations.nav.resources },
    { to: '/team', text: translations.nav.team },
    { to: '/contact', text: translations.nav.contact },
  ];

  const roleLink =
    role === 'ADMIN'
      ? { to: '/dashboard/admin', text: 'Dashboard' }
      : role === 'STAFF'
        ? { to: '/dashboard/staff', text: 'Dashboard' }
        : role === 'STUDENT'
          ? { to: '/dashboard/student', text: 'Mon espace' }
          : null;

  const activeLinkClass = 'text-teal dark:text-teal font-semibold';
  const inactiveLinkClass = 'text-gray-600 dark:text-gray-300 hover:text-teal dark:hover:text-teal transition-colors duration-200';

  return (
    <header className="bg-white dark:bg-[#0a192f] sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Ligne principale avec logo et actions */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="text-2xl font-bold text-gray-900 dark:text-white flex-shrink-0">
            GALILEO
          </NavLink>

          {/* Barre de recherche centrale - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <SearchBar className="w-full" />
          </div>

          {/* Actions de droite */}
          <div className="flex items-center gap-2">
            {/* Notifications - pour utilisateurs connectés */}
            {isAuthenticated && <NotificationCenter />}

            {/* Thème */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Langue */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 text-sm font-medium border border-teal text-teal rounded-lg hover:bg-teal hover:text-white dark:hover:text-[#0a192f] transition-colors"
            >
              {language === 'fr' ? 'EN' : 'FR'}
            </button>

            {/* Boutons Auth - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {roleLink && (
                    <NavLink
                      to={roleLink.to}
                      className="px-4 py-2 border border-teal text-teal rounded-lg hover:bg-teal/10 transition-colors"
                    >
                      {roleLink.text}
                    </NavLink>
                  )}
                  {(role === 'STUDENT' || role === 'STAFF' || role === 'ADMIN') && (
                    <NavLink
                      to="/submit"
                      className="px-4 py-2 bg-teal text-white dark:text-[#0a192f] font-semibold rounded-lg hover:bg-teal/90 transition-colors"
                    >
                      {translations.nav.submit}
                    </NavLink>
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[150px] truncate">
                    {user?.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    {translations.auth_page?.logout_button || 'Déconnexion'}
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/auth"
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-teal transition-colors"
                  >
                    {translations.auth_page?.login_button || 'Connexion'}
                  </NavLink>
                </>
              )}
            </div>

            {/* Menu mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6 py-2 border-t border-gray-100 dark:border-gray-800">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => 
                `text-sm ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              {link.text}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Menu mobile déroulant */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#0a192f] border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Barre de recherche mobile */}
            <SearchBar className="w-full" />

            {/* Navigation mobile */}
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm ${
                      isActive
                        ? 'bg-teal/10 text-teal font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  {link.text}
                </NavLink>
              ))}
              {roleLink && (
                <NavLink
                  key={roleLink.to}
                  to={roleLink.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm ${
                      isActive
                        ? 'bg-teal/10 text-teal font-semibold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  {roleLink.text}
                </NavLink>
              )}
            </nav>

            {/* Boutons Auth mobile */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    {user?.email}
                  </div>
                  {roleLink && (
                    <NavLink
                      to={roleLink.to}
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full px-4 py-2 text-center border border-teal text-teal rounded-lg"
                    >
                      {roleLink.text}
                    </NavLink>
                  )}
                  {(role === 'STUDENT' || role === 'STAFF' || role === 'ADMIN') && (
                    <NavLink
                      to="/submit"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full px-4 py-2 text-center bg-teal text-white dark:text-[#0a192f] font-semibold rounded-lg"
                    >
                      {translations.nav.submit}
                    </NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-center text-red-500 border border-red-500 rounded-lg"
                  >
                    {translations.auth_page?.logout_button || 'Déconnexion'}
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-4 py-2 text-center border border-teal text-teal rounded-lg"
                  >
                    {translations.auth_page?.login_button || 'Connexion'}
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
