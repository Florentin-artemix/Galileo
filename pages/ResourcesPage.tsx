import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { resourcesData } from '../data/resources';
import type { ResourceCategory, ResourceItem } from '../types';

const ResourceCard: React.FC<{ item: ResourceItem }> = ({ item }) => {
    const { language, translations } = useLanguage();
    const isExternal = item.format === 'Externe';
    const isWebLink = item.format === 'Lien Web';

    const CardContent = () => (
        <>
            <div className="flex-grow">
                <p className="text-xs font-semibold uppercase tracking-wider text-light-accent dark:text-teal">{item.format}</p>
                <h3 className="font-poppins text-lg font-bold my-2 text-light-text dark:text-off-white group-hover:text-light-accent dark:group-hover:text-teal transition-colors duration-300">{item.name[language]}</h3>
                <p className="text-sm text-light-text-secondary dark:text-gray-400 line-clamp-3 overflow-hidden break-words">{item.description[language]}</p>
            </div>
            {!isWebLink && (
                 <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                    <span className="text-sm font-bold text-light-accent dark:text-teal">{isExternal ? "Visiter" : translations.resources_page.download_button} &rarr;</span>
                </div>
            )}
        </>
    );

    if (isExternal || isWebLink) {
        return (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-light-card dark:bg-navy/50 p-6 rounded-lg border border-light-border dark:border-dark-border shadow-lg hover:shadow-xl dark:hover:shadow-teal/20 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300 group flex flex-col h-full">
                <CardContent />
            </a>
        );
    }

    return (
        <a href={item.url} download className="block bg-light-card dark:bg-navy/50 p-6 rounded-lg border border-light-border dark:border-dark-border shadow-lg hover:shadow-xl dark:hover:shadow-teal/20 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300 group flex flex-col h-full">
            <CardContent />
        </a>
    );
};

const ResourcesPage: React.FC = () => {
    const { translations, language } = useLanguage();
    const t = translations.resources_page;

    const categories: ResourceCategory[] = resourcesData.map(category => ({
        title: category.title,
        description: category.description,
        items: category.items,
    }));

    return (
        <div className="animate-slide-in-up">
            <section className="text-center py-16 md:py-24 bg-light-card dark:bg-navy-dark border-b border-light-border dark:border-dark-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-poppins font-bold text-light-text dark:text-off-white mb-4">{t.title}</h1>
                    <p className="text-lg text-light-text-secondary dark:text-gray-300 max-w-3xl mx-auto">{t.subtitle}</p>
                </div>
            </section>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                {categories.map((category, index) => (
                    <section key={index} className="mb-16">
                        <div className="max-w-2xl mb-8">
                            <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white">{category.title[language]}</h2>
                            <p className="text-light-text-secondary dark:text-gray-400 mt-2">{category.description[language]}</p>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {category.items.map((item, itemIndex) => (
                                <ResourceCard key={itemIndex} item={item} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default ResourcesPage;