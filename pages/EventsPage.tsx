import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { eventService, EventData } from '../src/services/eventService';
import Modal from '../components/Modal';
import Lightbox from '../components/Lightbox';

const HERO_IMAGE_URL = 'https://picsum.photos/seed/events_hero/1600/600';

// Type adapté pour le frontend (compatible avec l'API)
type Event = EventData;

const EventCard: React.FC<{ 
    event: Event; 
    onDetails: (event: Event) => void;
}> = ({ event, onDetails }) => {
    const { language, translations } = useLanguage();
    return (
        <div className="bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg flex flex-col shadow-lg hover:shadow-xl dark:hover:shadow-teal/20 backdrop-blur-sm transform hover:-translate-y-2 transition-transform duration-300 animate-slide-in-up" style={{animationDelay: `${(event.id % 6) * 50}ms`, animationFillMode: 'backwards'}}>
            <img src={event.imageUrl} alt={event.title[language]} className="w-full h-48 object-cover rounded-t-lg" />
            <div className="p-4 flex flex-col flex-grow">
                 <span className="inline-block bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal text-xs font-semibold px-2 py-1 rounded-full mb-2 self-start">{event.type[language]}</span>
                <h3 className="font-poppins text-lg font-bold mb-2 flex-grow text-light-text dark:text-off-white">{event.title[language]}</h3>
                <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-1">{new Date(event.date).toLocaleDateString(language, {day: '2-digit', month: '2-digit', year: 'numeric'})} &bull; {event.location}</p>
                <p className="text-sm text-light-text-secondary dark:text-gray-300 mb-4 line-clamp-2">{event.summary[language]}</p>
                <div className="mt-auto pt-4 border-t border-light-border dark:border-dark-border">
                     <button onClick={() => onDetails(event)} className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-4 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300" aria-label={`${translations.events_page.details} for ${event.title[language]}`}>
                        {translations.events_page.details}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EventListItem: React.FC<{
    event: Event;
    onDetails: (event: Event) => void;
}> = ({ event, onDetails }) => {
    const { language, translations } = useLanguage();
    return (
        <div className="bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-lg hover:shadow-xl dark:hover:shadow-teal/20 backdrop-blur-sm transform hover:-translate-y-1 transition-transform duration-300 animate-slide-in-up" style={{animationDelay: `${(event.id % 6) * 50}ms`, animationFillMode: 'backwards'}}>
            <div className="md:col-span-2 text-center p-4">
                <p className="font-poppins text-4xl font-bold text-light-accent dark:text-teal">{new Date(event.date).getDate()}</p>
                <p className="text-sm uppercase text-light-text-secondary dark:text-gray-400">{new Date(event.date).toLocaleDateString(language, { month: 'short' })} '{new Date(event.date).getFullYear().toString().slice(-2)}</p>
            </div>
            <div className="md:col-span-7 p-4">
                <span className="inline-block bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal text-xs font-semibold px-2 py-1 rounded-full mb-2 self-start">{event.type[language]}</span>
                <h3 className="font-poppins text-lg font-bold mb-2 text-light-text dark:text-off-white">{event.title[language]}</h3>
                <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-1">{event.location}</p>
                <p className="text-sm text-light-text-secondary dark:text-gray-300 line-clamp-2">{event.summary[language]}</p>
            </div>
            <div className="md:col-span-3 p-4 flex items-center justify-center">
                <button onClick={() => onDetails(event)} className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-4 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300" aria-label={`${translations.events_page.details} for ${event.title[language]}`}>
                    {translations.events_page.details}
                </button>
            </div>
        </div>
    );
};

const EventDetailModal: React.FC<{
    event: Event | null;
    isOpen: boolean;
    onClose: () => void;
    onOpenGallery: (images: string[], startIndex: number) => void;
}> = ({ event, isOpen, onClose, onOpenGallery }) => {
    const { language, translations } = useLanguage();
    if (!event) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={event.title[language]}>
            <div className="max-h-[80vh] overflow-y-auto pr-2 space-y-6">
                <div>
                     <p className="text-light-accent dark:text-teal font-bold mb-2">{translations.events_page.event_passed}</p>
                     <p className="text-light-text-secondary dark:text-gray-400 text-sm">{new Date(event.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &bull; {event.location}</p>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {event.tags?.map(tag => (
                            <span key={tag} className="bg-light-bg dark:bg-navy-dark text-light-accent dark:text-teal text-xs font-medium px-2 py-0.5 rounded-full border border-light-border dark:border-dark-border">{tag}</span>
                        ))}
                    </div>
                </div>

                <p className="text-light-text-secondary dark:text-gray-300">{event.description[language]}</p>

                {event.speakers && event.speakers.length > 0 && (
                     <div>
                        <h4 className="text-lg font-poppins font-bold text-light-text dark:text-off-white border-b border-light-border dark:border-dark-border pb-2 mb-3">{translations.events_page.speakers}</h4>
                        <div className="space-y-3">
                        {event.speakers.map(speaker => (
                            <div key={speaker.name} className="flex items-center gap-3">
                                <img src={speaker.imageUrl} alt={speaker.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-bold text-light-text dark:text-off-white">{speaker.name}</p>
                                    <p className="text-sm text-light-text-secondary dark:text-gray-400">{speaker.role[language]}</p>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                
                {event.resources && event.resources.length > 0 && (
                     <div>
                        <h4 className="text-lg font-poppins font-bold text-light-text dark:text-off-white border-b border-light-border dark:border-dark-border pb-2 mb-3">{translations.events_page.resources}</h4>
                        <ul className="space-y-2">
                            {event.resources.map(res => (
                                <li key={res.name} className="flex justify-between items-center bg-light-card dark:bg-navy/50 p-2 rounded-md">
                                    <span className="text-sm text-light-text dark:text-off-white">{res.name} ({res.format}, {res.size})</span>
                                    <a href={res.url} download className="text-light-accent dark:text-teal hover:underline text-sm font-bold">Télécharger</a>
                                </li>
                            ))}
                        </ul>
                         {event.resources.length > 1 && (
                            <button className="w-full mt-4 bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal font-bold py-2 px-4 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300">
                                {translations.events_page.download_all}
                            </button>
                         )}
                    </div>
                )}

                 {event.photos && event.photos.length > 0 && (
                     <div>
                        <h4 className="text-lg font-poppins font-bold text-light-text dark:text-off-white border-b border-light-border dark:border-dark-border pb-2 mb-3">{translations.events_page.see_photos}</h4>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {event.photos.map((photo, index) => (
                                <button key={index} onClick={() => onOpenGallery(event.photos, index)} className="focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal rounded-md overflow-hidden group">
                                  <img src={photo} alt={`${event.title[language]} photo ${index+1}`} className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300" />
                                </button>
                            ))}
                        </div>
                    </div>
                 )}
                 <div className="mt-6 text-center border-t border-light-border dark:border-dark-border pt-6">
                    <button className="text-sm text-light-accent dark:text-teal hover:underline">{translations.events_page.similar_events}</button>
                </div>
            </div>
        </Modal>
    )
}

const EventsPage: React.FC = () => {
    const { language, translations } = useLanguage();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [domainFilter, setDomainFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isGalleryOpen, setGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryStartIndex, setGalleryStartIndex] = useState(0);

    // Charger les événements depuis l'API
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await eventService.getAllEventsNoPagination();
                setEvents(data);
            } catch (err: any) {
                console.error('Erreur chargement événements:', err);
                setError(err.message || 'Erreur lors du chargement des événements');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);
    
    const { types, domains, years, filteredEvents } = useMemo(() => {
        const uniqueTypes = [...new Set(events.map(e => e.type?.[language] || ''))].filter(Boolean).sort();
        const uniqueDomains = [...new Set(events.map(e => e.domain?.[language] || ''))].filter(Boolean).sort();
        const uniqueYears = [...new Set(events.map(e => new Date(e.date).getFullYear().toString()))].sort((a: string, b: string) => b.localeCompare(a));

        let processedEvents = events.filter(event => {
            const eventYear = new Date(event.date).getFullYear().toString();
            const matchesType = typeFilter === 'All' || event.type?.[language] === typeFilter;
            const matchesDomain = domainFilter === 'All' || event.domain?.[language] === domainFilter;
            const matchesYear = yearFilter === 'All' || eventYear === yearFilter;
            const matchesSearch = searchTerm === '' ||
                                  event.title?.[language]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  event.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  event.speakers?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesType && matchesDomain && matchesYear && matchesSearch;
        });

        processedEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { types: uniqueTypes, domains: uniqueDomains, years: uniqueYears, filteredEvents: processedEvents };
    }, [events, searchTerm, typeFilter, domainFilter, yearFilter, language]);

    const handleReset = () => {
        setSearchTerm('');
        setTypeFilter('All');
        setDomainFilter('All');
        setYearFilter('All');
    };
    
    const handleDetails = (event: Event) => {
        setSelectedEvent(event);
        setDetailModalOpen(true);
    };

    const handleOpenGallery = (images: string[], startIndex: number) => {
        setGalleryImages(images);
        setGalleryStartIndex(startIndex);
        setGalleryOpen(true);
    };

    const inputClasses = "w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal";

    return (
        <div className="animate-slide-in-up">
            <section className="relative h-64 flex items-center justify-center text-center px-4 bg-light-card dark:bg-navy-dark">
                 <div className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-100" style={{ backgroundImage: `url(${HERO_IMAGE_URL})` }}>
                    <div className="absolute inset-0 bg-light-bg dark:bg-navy bg-opacity-70"></div>
                </div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-poppins font-bold text-light-text dark:text-off-white">{translations.events_page.title}</h1>
                    <p className="text-lg text-light-text-secondary dark:text-gray-300 mt-2 max-w-2xl">{translations.events_page.subtitle}</p>
                </div>
            </section>
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Message de chargement */}
                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-light-accent dark:border-teal border-t-transparent"></div>
                        <p className="mt-4 text-light-text-secondary dark:text-gray-400">Chargement des événements...</p>
                    </div>
                )}

                {/* Message d'erreur */}
                {error && !loading && (
                    <div className="text-center py-12">
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg inline-block">
                            <p className="font-semibold">Erreur</p>
                            <p>{error}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-2 text-sm underline hover:no-underline"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                )}

                {/* Contenu principal */}
                {!loading && !error && (
                    <>
                        <div className="bg-light-bg dark:bg-navy/30 border border-light-border dark:border-dark-border rounded-lg p-4 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="text-xs text-light-text-secondary dark:text-gray-400">{translations.events_page.search_placeholder}</label>
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={translations.events_page.search_placeholder} className={inputClasses}/>
                            </div>
                            <div>
                                 <label className="text-xs text-light-text-secondary dark:text-gray-400">{translations.events_page.filter_type}</label>
                                 <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={inputClasses}>
                                     <option value="All">{translations.events_page.all_types}</option>
                                     {types.map(t => <option key={t} value={t}>{t}</option>)}
                                 </select>
                            </div>
                            <div>
                                 <label className="text-xs text-light-text-secondary dark:text-gray-400">{translations.events_page.filter_domain}</label>
                                 <select value={domainFilter} onChange={e => setDomainFilter(e.target.value)} className={inputClasses}>
                                     <option value="All">{translations.events_page.all_domains}</option>
                                     {domains.map(d => <option key={d} value={d}>{d}</option>)}
                                 </select>
                            </div>
                            <button onClick={handleReset} className="w-full bg-light-accent/10 dark:bg-teal/20 text-light-accent dark:text-teal font-semibold py-2 px-3 rounded-md hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300 h-10">{translations.events_page.reset_filters}</button>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                             <div className="text-sm text-light-text-secondary dark:text-gray-400">
                                {filteredEvents.length} événement(s) trouvé(s)
                            </div>
                             <div className="flex items-center gap-1 bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md p-1">
                                 <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded text-sm ${viewMode === 'grid' ? 'bg-light-accent dark:bg-teal text-white dark:text-navy' : 'text-light-text-secondary dark:text-gray-400'}`}>{translations.events_page.view_grid}</button>
                                 <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-light-accent dark:bg-teal text-white dark:text-navy' : 'text-light-text-secondary dark:text-gray-400'}`}>{translations.events_page.view_list}</button>
                                 <button onClick={() => setViewMode('timeline')} className={`px-3 py-1 rounded text-sm ${viewMode === 'timeline' ? 'bg-light-accent dark:bg-teal text-white dark:text-navy' : 'text-light-text-secondary dark:text-gray-400'}`}>{translations.events_page.view_timeline}</button>
                            </div>
                        </div>

                        {/* Message si aucun événement */}
                        {filteredEvents.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-light-text-secondary dark:text-gray-400">Aucun événement trouvé.</p>
                            </div>
                        )}

                        {viewMode === 'grid' && (
                             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredEvents.map(event => <EventCard key={event.id} event={event} onDetails={handleDetails} />)}
                            </div>
                        )}
                         {viewMode === 'list' && (
                            <div className="space-y-6">
                                {filteredEvents.map(event => <EventListItem key={event.id} event={event} onDetails={handleDetails} />)}
                            </div>
                        )}
                        {viewMode === 'timeline' && (
                             <div className="relative border-l-2 border-light-accent/30 dark:border-teal/30 ml-4 pl-8 space-y-12">
                                 {filteredEvents.map(event => (
                                     <div key={event.id} className="relative">
                                         <div className="absolute -left-[42px] top-1 w-4 h-4 bg-light-accent dark:bg-teal rounded-full border-4 border-light-bg dark:border-navy"></div>
                                         <p className="text-light-accent dark:text-teal font-bold">{new Date(event.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                         <h3 className="font-poppins text-xl font-bold text-light-text dark:text-off-white">{event.title[language]}</h3>
                                         <p className="text-sm text-light-text-secondary dark:text-gray-400">{event.location}</p>
                                         <button onClick={() => handleDetails(event)} className="text-sm text-light-accent dark:text-teal hover:underline mt-2">{translations.events_page.details} &rarr;</button>
                                     </div>
                                 ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <EventDetailModal event={selectedEvent} isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} onOpenGallery={handleOpenGallery}/>
            <Lightbox isOpen={isGalleryOpen} onClose={() => setGalleryOpen(false)} images={galleryImages} startIndex={galleryStartIndex} />
        </div>
    );
};

export default EventsPage;
