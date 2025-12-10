import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

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


const Header: React.FC = () => {
  const { language, toggleLanguage, translations } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', text: translations.nav.home },
    { to: '/about', text: translations.nav.about },
    { to: '/events', text: translations.nav.activities },
    { to: '/publications', text: translations.nav.journal },
    { to: '/resources', text: translations.nav.resources },
    { to: '/team', text: translations.nav.team },
    { to: '/contact', text: translations.nav.contact },
  ];

  const activeLinkClass = 'text-light-accent dark:text-teal font-semibold';
  const inactiveLinkClass = 'text-light-text-secondary dark:text-gray-300 hover:text-light-accent dark:hover:text-teal transition-colors duration-300';

  return (
    <header className="bg-white/80 dark:bg-navy/80 backdrop-blur-sm sticky top-0 z-50 border-b border-light-border dark:border-dark-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <NavLink to="/" className="text-2xl font-poppins font-bold text-light-text dark:text-off-white">
              GALILEO
            </NavLink>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to + link.text}
                to={link.to}
                className={({ isActive }) => (isActive ? activeLinkClass : inactiveLinkClass)}
              >
                {link.text}
              </NavLink>
            ))}
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-light-text-secondary dark:text-gray-300 hover:bg-light-card dark:hover:bg-navy-dark transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 border border-light-accent dark:border-teal rounded-full text-sm text-light-accent dark:text-teal hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300"
              aria-label="Toggle language"
            >
              {language === 'fr' ? 'EN' : 'FR'}
            </button>
            <NavLink
              to="/submit"
              className="bg-light-accent text-white font-bold py-2 px-4 rounded-full hover:bg-light-accent-hover transition-all duration-300 transform hover:scale-105"
            >
              {translations.nav.submit}
            </NavLink>
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-light-text-secondary dark:text-gray-300 hover:text-light-accent dark:hover:text-teal focus:outline-none"
              aria-label="Open menu"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-light-bg dark:bg-navy">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium ${isActive ? 'text-light-accent dark:text-teal bg-light-accent/10 dark:bg-teal/10' : 'text-light-text-secondary dark:text-gray-300'}`}
              >
                {link.text}
              </NavLink>
            ))}
            <NavLink
              to="/submit"
              onClick={() => setIsMenuOpen(false)}
              className="block bg-light-accent text-white font-bold py-2 px-4 rounded-full mt-4"
            >
              {translations.nav.submit}
            </NavLink>
             <div className="flex items-center gap-4 mt-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-light-text-secondary dark:text-gray-300"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
              <button
                onClick={() => { toggleLanguage(); setIsMenuOpen(false); }}
                className="px-3 py-1 border border-light-accent dark:border-teal text-light-accent dark:text-teal rounded-full text-sm"
                aria-label="Toggle language"
              >
                {language === 'fr' ? 'EN' : 'FR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;