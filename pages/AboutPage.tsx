import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Section: React.FC<{ title: string, subtitle?: string, children: React.ReactNode, className?: string }> = ({ title, subtitle, children, className = '' }) => (
  <section className={`py-8 md:py-12 border-b border-light-border dark:border-dark-border last:border-b-0 ${className}`}>
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white mb-2">{title}</h2>
      {subtitle && <p className="text-light-text-secondary dark:text-gray-400 mb-8">{subtitle}</p>}
      <div className="space-y-4 text-light-text-secondary dark:text-gray-300">
        {children}
      </div>
    </div>
  </section>
);


const AboutPage: React.FC = () => {
  const { translations, language } = useLanguage();
  const t = translations.about_page;

  const quickLinks = [
        { to: '/', text: translations.nav.home },
        { to: '/publications', text: translations.nav.journal },
        { to: '/events', text: translations.nav.activities },
        { to: '/submit', text: translations.nav.submit },
    ];

  return (
    <div className="animate-slide-in-up">
      {/* Hero Section */}
      <div className="text-center py-16 md:py-24 bg-light-card dark:bg-navy-dark border-b border-light-border dark:border-dark-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-poppins font-bold text-light-text dark:text-off-white mb-4">{t.section1_title}</h1>
              <p className="text-lg text-light-text-secondary dark:text-gray-300 max-w-3xl mx-auto">{t.section1_content}</p>
          </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Structure Section */}
        <Section title={t.section2_title} subtitle={t.section2_subtitle}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="bg-light-bg dark:bg-navy/50 p-6 rounded-lg border border-light-border dark:border-dark-border shadow-md">
                    <h3 className="text-xl font-poppins font-semibold text-light-accent dark:text-teal mb-2">{t.structure.students}</h3>
                    <p className="text-sm">{t.structure.students_desc}</p>
                </div>
                <div className="bg-light-bg dark:bg-navy/50 p-6 rounded-lg border border-light-border dark:border-dark-border shadow-md">
                    <h3 className="text-xl font-poppins font-semibold text-light-accent dark:text-teal mb-2">{t.structure.professors}</h3>
                    <p className="text-sm">{t.structure.professors_desc}</p>
                </div>
                <div className="bg-light-bg dark:bg-navy/50 p-6 rounded-lg border border-light-border dark:border-dark-border shadow-md">
                    <h3 className="text-xl font-poppins font-semibold text-light-accent dark:text-teal mb-2">{t.structure.partners}</h3>
                    <p className="text-sm">{t.structure.partners_desc}</p>
                </div>
            </div>
        </Section>
        
        {/* Projects Section */}
        <Section title={t.section3_title}>
            <div className="grid md:grid-cols-2 gap-8">
                 <div className="bg-light-card dark:bg-navy-dark p-6 rounded-lg">
                    <h3 className="text-xl font-poppins font-semibold text-light-text dark:text-off-white mb-2">{t.projects.journal_title}</h3>
                    <p>{t.projects.journal_desc}</p>
                </div>
                 <div className="bg-light-card dark:bg-navy-dark p-6 rounded-lg">
                    <h3 className="text-xl font-poppins font-semibold text-light-text dark:text-off-white mb-2">{t.projects.fair_title}</h3>
                    <p>{t.projects.fair_desc}</p>
                </div>
            </div>
        </Section>
        
        {/* History Section */}
        <Section title={t.section4_title}>
            <div className="relative border-l-2 border-light-accent/30 dark:border-teal/30 pl-8 space-y-12">
                {t.timeline.map((item, index) => (
                     <div key={index} className="relative">
                        <div className="absolute -left-[42px] top-1 w-4 h-4 bg-light-accent dark:bg-teal rounded-full border-4 border-light-card dark:border-navy-dark"></div>
                        <p className="text-light-accent dark:text-teal font-bold">{item.year}</p>
                        <h3 className="font-poppins text-xl font-semibold text-light-text dark:text-off-white mt-1">{item.event}</h3>
                        <p className="mt-1">{item.desc}</p>
                    </div>
                ))}
            </div>
        </Section>
        
        {/* Team Section */}
        <Section title={t.section5_title} subtitle={t.section5_subtitle}>
            <div className="space-y-6">
                {Object.entries(t.team).map(([key, value]) => {
                    if (key.endsWith('_desc')) return null;
                    const nameRole = value.split(',');
                    const name = nameRole[0];
                    const role = nameRole.slice(1).join(',');
                    const descKey = `${key}_desc` as keyof typeof t.team;

                    return (
                        <div key={key} className="p-4 bg-light-bg dark:bg-navy/50 rounded-lg border border-light-border dark:border-dark-border">
                            <h4 className="font-poppins font-semibold text-light-text dark:text-off-white">{name}<span className="text-light-accent dark:text-teal font-normal">{role}</span></h4>
                            <p className="text-sm mt-1">{t.team[descKey]}</p>
                        </div>
                    );
                })}
            </div>
        </Section>

        {/* Mission & Values Section */}
        <Section title={t.section6_title} subtitle={t.section6_subtitle}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                 {Object.values(t.values).map((value, index) => (
                    <div key={index} className="bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal font-semibold p-3 rounded-md">
                        {value}
                    </div>
                 ))}
            </div>
        </Section>

        {/* Contact Section */}
        <Section title={t.section7_title}>
            <div className="bg-light-card dark:bg-navy-dark p-8 rounded-lg grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-2">
                    <p><strong>{t.contact_address}</strong></p>
                    <p>
                        <strong>Email:</strong> <a href={`mailto:${t.contact_email}`} className="hover:underline">{t.contact_email}</a>
                    </p>
                    <p>
                        <strong>{language === 'fr' ? 'Téléphone' : 'Phone'}:</strong> <a href={`tel:${t.contact_phone.replace(/\s/g, '')}`} className="hover:underline">{t.contact_phone}</a>
                    </p>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2 text-light-text dark:text-off-white">{t.useful_links}</h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {quickLinks.map(link => (
                            <NavLink key={link.to} to={link.to} className="text-light-accent dark:text-teal hover:underline">{link.text}</NavLink>
                        ))}
                    </div>
                </div>
            </div>
        </Section>
      </div>
    </div>
  );
};

export default AboutPage;