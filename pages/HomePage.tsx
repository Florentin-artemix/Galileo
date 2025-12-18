
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePublications } from '../contexts/PublicationsContext';
import { eventService, EventData } from '../src/services/eventService';
import type { Publication } from '../types';

// Type Event compatible avec l'API
type Event = EventData;


const HERO_IMAGE_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAHgA8ADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD82KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKK-KACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKK-KACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKK-KACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKK-KACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKK-KACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAP/Z';


const ArgumentCard: React.FC<{title: string; description: string; icon: React.ReactNode}> = ({ title, description, icon }) => (
    <div className="bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg p-6 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-lg animate-slide-in-up" style={{animationDelay: '100ms', animationFillMode: 'backwards'}}>
        <div className="flex justify-center mb-4 text-light-accent dark:text-teal">{icon}</div>
        <h3 className="text-xl font-poppins font-bold text-light-text dark:text-off-white mb-2">{title}</h3>
        <p className="text-light-text-secondary dark:text-gray-300 text-sm">{description}</p>
    </div>
);

const DomainCard: React.FC<{title: string; description: string; link: string}> = ({ title, description, link }) => (
    <NavLink to={link} className="block bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg p-6 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-lg animate-slide-in-up group">
        <h3 className="text-xl font-poppins font-bold text-light-text dark:text-off-white mb-2 group-hover:text-light-accent dark:group-hover:text-teal transition-colors">{title}</h3>
        <p className="text-light-text-secondary dark:text-gray-300 text-sm">{description}</p>
    </NavLink>
);

const PublicationTeaserCard: React.FC<{ pub: Publication }> = ({ pub }) => {
    const { language, translations } = useLanguage();
    return (
        <div className="bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg p-4 shadow-sm hover:shadow-lg flex flex-col h-full animate-slide-in-up transition-shadow duration-300">
            <img loading="lazy" src={pub.imageUrl} alt={pub.title[language]} className="w-full h-32 object-cover rounded-md mb-4"/>
            <h3 className="font-poppins text-lg font-bold text-light-text dark:text-off-white mb-2 flex-grow line-clamp-2">{pub.title[language]}</h3>
            <p className="text-sm text-light-accent dark:text-teal mb-2">{pub.authors.join(', ')} - {new Date(pub.date).getFullYear()}</p>
            <p className="text-light-text-secondary dark:text-gray-300 text-sm mb-4 line-clamp-2 h-10">{pub.summary[language]}</p>
             <div className="flex flex-wrap gap-1 text-xs mb-4">
                {pub.tags.slice(0, 3).map(tag => <span key={tag} className="bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal px-2 py-0.5 rounded-full">{tag}</span>)}
            </div>
            <div className="mt-auto grid grid-cols-3 gap-2 text-xs">
                <NavLink to={`/publication/${pub.id}`} className="text-center bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal font-semibold py-2 px-2 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300">
                    {translations.home_page.read_article}
                </NavLink>
                {pub.pdfUrl &&
                    <a href={pub.pdfUrl} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${pub.title[language]}`} className="text-center bg-light-card dark:bg-navy-dark border border-light-border dark:border-dark-border text-light-text-secondary dark:text-gray-300 font-semibold py-2 px-2 rounded-full hover:bg-gray-200 dark:hover:bg-navy transition-colors duration-300">
                        {translations.home_page.preview_article}
                    </a>
                }
                {pub.pdfUrl &&
                    <a href={pub.pdfUrl} download aria-label={`Download ${pub.title[language]}`} className="text-center bg-light-card dark:bg-navy-dark border border-light-border dark:border-dark-border text-light-text-secondary dark:text-gray-300 font-semibold py-2 px-2 rounded-full hover:bg-gray-200 dark:hover:bg-navy transition-colors duration-300">
                        {translations.home_page.download_article}
                    </a>
                }
            </div>
        </div>
    );
};

const EventTeaserCard: React.FC<{ event: Event }> = ({ event }) => {
    const { language, translations } = useLanguage();
    return (
         <div className="bg-light-card dark:bg-navy/50 p-4 rounded-lg border border-light-border dark:border-dark-border flex items-center gap-4 animate-slide-in-up shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal p-2 rounded-md">
                <p className="font-poppins font-bold text-2xl">{new Date(event.date).getDate()}</p>
                <p className="text-xs uppercase">{new Date(event.date).toLocaleDateString(language, { month: 'short' })}</p>
            </div>
            <div className="flex-grow">
                 <h4 className="font-poppins font-bold text-light-text dark:text-off-white text-base leading-tight">{event.title?.[language] || event.title?.fr || ''}</h4>
                 <p className="text-xs text-light-text-secondary dark:text-gray-400 line-clamp-1">{event.summary?.[language] || event.summary?.fr || ''}</p>
            </div>
            <NavLink to={`/events`} className="text-sm text-light-accent dark:text-teal font-bold hover:underline whitespace-nowrap">{translations.home_page.event_details} →</NavLink>
         </div>
    );
};

const NewsletterForm: React.FC = () => {
    const { translations } = useLanguage();
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };
    return (
        <div className="text-center">
            <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white mb-2">{translations.home_page.cta_title}</h2>
            <p className="text-light-text-secondary dark:text-gray-300 mb-6">{translations.home_page.cta_subtitle}</p>
            {submitted ? (
                <p className="text-center text-light-accent dark:text-teal">{translations.home_page.newsletter_success}</p>
            ) : (
                 <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto" aria-label="Newsletter subscription form">
                    <input type="email" required placeholder={translations.home_page.newsletter_placeholder} className="flex-grow bg-light-bg dark:bg-navy border border-light-border dark:border-gray-600 rounded-full shadow-sm py-3 px-5 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal" aria-label="Email for newsletter"/>
                    <button type="submit" className="bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-8 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300">{translations.home_page.newsletter_button}</button>
                </form>
            )}
        </div>
    )
}

const HomePage: React.FC = () => {
  const { translations } = useLanguage();
  const { publications } = usePublications();
  const [events, setEvents] = useState<Event[]>([]);

  // Charger les événements depuis l'API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAllEventsNoPagination();
        setEvents(data);
      } catch (err) {
        console.error('Erreur chargement événements:', err);
      }
    };
    fetchEvents();
  }, []);

  const recentPublications = publications.slice(0, 3);
  const recentEvents = events.slice(0, 3);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE_BASE64})` }}>
           <div className="absolute inset-0 bg-navy bg-opacity-60"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-light-bg dark:from-navy via-transparent to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl text-center md:text-left animate-slide-in-up">
                <h1 className="text-4xl md:text-6xl font-poppins font-extrabold text-white mb-4 drop-shadow-lg">
                    {translations.hero.title}
                </h1>
                <p className="text-lg text-gray-200 mb-8 drop-shadow-md">
                    {translations.hero.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                    <NavLink to="/publications" className="bg-teal text-navy font-bold py-3 px-8 rounded-full hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto shadow-lg" aria-label="Discover our journal publications">
                        {translations.hero.discover}
                    </NavLink>
                    <NavLink to="/contact" className="border-2 border-teal bg-teal/10 text-white font-bold py-3 px-8 rounded-full hover:bg-teal hover:text-navy transition-all duration-300 w-full sm:w-auto backdrop-blur-sm" aria-label="Become a member">
                        {translations.hero.become_member}
                    </NavLink>
                </div>
            </div>
        </div>
      </section>

      {/* Arguments Section */}
      <section className="py-16 md:py-24 bg-light-bg dark:bg-navy">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
             <ArgumentCard 
                title={translations.home_page.arguments.title1} 
                description={translations.home_page.arguments.desc1}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
            />
            <ArgumentCard 
                title={translations.home_page.arguments.title2} 
                description={translations.home_page.arguments.desc2}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>}
            />
            <ArgumentCard 
                title={translations.home_page.arguments.title3} 
                description={translations.home_page.arguments.desc3}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}
            />
          </div>
        </div>
      </section>
      
       {/* Domains Section */}
      <section className="py-16 md:py-24 bg-light-card dark:bg-navy-dark">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white text-center mb-12">{translations.home_page.domains_title}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             <DomainCard title={translations.home_page.domains.electricity} description={translations.home_page.domains.electricity_desc} link="/publications?domain=Électricité" />
             <DomainCard title={translations.home_page.domains.mechanics} description={translations.home_page.domains.mechanics_desc} link="/publications?domain=Mécanique" />
             <DomainCard title={translations.home_page.domains.cs} description={translations.home_page.domains.cs_desc} link="/publications?domain=Informatique" />
             <DomainCard title={translations.home_page.domains.geology} description={translations.home_page.domains.geology_desc} link="/publications?domain=Mines%20%26%20G%C3%A9ologie" />
          </div>
        </div>
      </section>

       {/* Recent Publications Section */}
      <section className="py-16 md:py-24 bg-light-bg dark:bg-navy">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
             <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white mb-4">{translations.home_page.publications_title}</h2>
             <p className="text-light-text-secondary dark:text-gray-300 mb-12">{translations.home_page.publications_intro}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {recentPublications.map((pub, index) => (
                <div key={pub.id} className="animate-slide-in-up" style={{animationDelay: `${index * 100}ms`, animationFillMode: 'backwards'}}>
                    <PublicationTeaserCard pub={pub} />
                </div>
            ))}
          </div>
        </div>
      </section>

       {/* Events & Team Section */}
       <section className="py-16 md:py-24 bg-light-card dark:bg-navy-dark">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white mb-8">{translations.home_page.events_title}</h2>
                    <div className="space-y-4">
                        {recentEvents.map(event => <EventTeaserCard key={event.id} event={event} />)}
                    </div>
                </div>
                 <div className="text-center bg-light-bg dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg p-12 shadow-lg animate-slide-in-up">
                    <h2 className="text-3xl font-poppins font-bold text-light-text dark:text-off-white mb-2">{translations.home_page.team_teaser_title}</h2>
                     <p className="text-light-text-secondary dark:text-gray-300 mb-6 max-w-sm mx-auto">{translations.home_page.team_teaser_subtitle}</p>
                     <NavLink to="/team" className="bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-3 px-8 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300 transform hover:scale-105 inline-block">
                        {translations.home_page.team_teaser_button}
                    </NavLink>
                </div>
            </div>
       </section>
      
       {/* Newsletter Section */}
       <section className="py-16 md:py-24 bg-light-bg dark:bg-navy">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <NewsletterForm />
            </div>
       </section>

    </div>
  );
};

export default HomePage;
