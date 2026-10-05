import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
    const { translations } = useLanguage();
    const [submitted, setSubmitted] = useState(false);

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Newsletter form submitted.");
        setSubmitted(true);
    };

    const quickLinks = [
        { to: '/', text: translations.nav.home },
        { to: '/about', text: translations.nav.about },
        { to: '/events', text: translations.nav.activities },
        { to: '/publications', text: translations.nav.journal },
        { to: '/resources', text: translations.nav.resources },
        { to: '/team', text: translations.nav.team },
        { to: '/contact', text: translations.nav.contact },
    ];

    const linkClasses = "text-light-text-secondary dark:text-gray-300 hover:text-light-accent dark:hover:text-teal transition-colors duration-300";

    return (
        <footer className="bg-light-card dark:bg-navy-dark border-t border-light-border dark:border-dark-border text-light-text-secondary dark:text-gray-300 font-inter">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Column 1: Institutional & Contacts */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-poppins font-bold text-light-text dark:text-off-white">{translations.footer.institutional_title}</h3>
                            <p className="text-sm text-light-accent dark:text-teal">{translations.footer.institutional_subtitle}</p>
                            <p className="text-sm text-light-text-secondary dark:text-gray-400 mt-2">
                                {translations.footer.institutional_desc}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-md font-poppins font-semibold mb-2 text-light-text dark:text-off-white">{translations.footer.contacts_title}</h4>
                             <div className="space-y-1 text-sm">
                                <p>
                                    <a href={`mailto:${translations.footer.email}`} className={linkClasses}>
                                        Email: {translations.footer.email}
                                    </a>
                                </p>
                                <p>
                                    <a href={`tel:${translations.footer.phone.replace(/\s/g, '')}`} className={linkClasses}>
                                        Téléphone: {translations.footer.phone}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="text-md font-poppins font-semibold mb-4 text-light-text dark:text-off-white">{translations.footer.quick_links_title}</h3>
                        <ul className="space-y-2 text-sm">
                            {quickLinks.map(link => (
                                <li key={link.to + link.text}>
                                    <NavLink to={link.to} className={linkClasses}>
                                        {link.text}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Location */}
                    <div>
                         <h3 className="text-md font-poppins font-semibold mb-4 text-light-text dark:text-off-white">{translations.footer.location_title}</h3>
                         <address className="not-italic text-sm space-y-1">
                            <p>{translations.footer.location_l1}</p>
                            <p>{translations.footer.location_l2}</p>
                            <p>{translations.footer.location_l3}</p>
                            <p>{translations.footer.location_l4}</p>
                            <p>{translations.footer.location_l5}</p>
                         </address>
                         <a href="https://maps.app.goo.gl/8QWnB7D7YktaqJv26" target="_blank" rel="noopener noreferrer" aria-label={translations.footer.location_button} className="inline-block mt-4 bg-transparent border border-light-accent dark:border-teal/50 text-light-accent dark:text-teal text-xs font-bold py-2 px-4 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300">
                            {translations.footer.location_button}
                         </a>
                    </div>

                    {/* Column 4: Newsletter */}
                    <div>
                        <h3 className="text-md font-poppins font-semibold mb-2 text-light-text dark:text-off-white">{translations.footer.newsletter_title}</h3>
                        <p className="text-sm dark:text-gray-400 mb-4">{translations.footer.newsletter_subtitle}</p>
                        {submitted ? (
                            <p className="text-light-accent dark:text-teal text-sm">{translations.footer.newsletter_success}</p>
                        ) : (
                            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2" aria-label="Newsletter subscription">
                                <input type="email" required placeholder={translations.footer.newsletter_placeholder} className="flex-grow bg-light-bg dark:bg-navy/70 border border-light-border dark:border-gray-600 rounded-full shadow-sm py-2 px-4 text-sm text-light-text dark:text-off-white focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-teal" aria-label="Email for newsletter"/>
                                <button type="submit" className="bg-light-accent text-white font-bold py-2 px-5 rounded-full text-sm hover:bg-light-accent-hover transition-opacity duration-300">
                                    {translations.footer.newsletter_button}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-light-border dark:border-dark-border text-center text-xs text-light-text-secondary dark:text-gray-500">
                    <p>{translations.footer.credits}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;