
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogService, type ArticleBlogDTO } from '../src/services/blogService';
import { searchService } from '../src/services/searchService';

const BlogPostCard: React.FC<{ post: ArticleBlogDTO }> = ({ post }) => {
    const { translations } = useLanguage();
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <NavLink 
            to={`/blog/${post.id}`} 
            className="block bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg p-5 sm:p-6 transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
        >
            {/* Date et temps de lecture */}
            <p className="text-xs sm:text-sm text-light-accent dark:text-teal mb-3">
                {formatDate(post.datePublication)} • {post.tempsLecture || 5} min de lecture
            </p>
            
            {/* Titre */}
            <h3 className="font-poppins text-lg sm:text-xl font-bold mb-3 text-light-text dark:text-off-white group-hover:text-light-accent dark:group-hover:text-teal transition-colors duration-300">
                {post.titre}
            </h3>
            
            {/* Description/Résumé */}
            <p className="text-light-text-secondary dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {post.resume}
            </p>
            
            {/* Catégorie (optionnel) */}
            {post.categorie && (
                <span className="inline-block bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal text-xs px-3 py-1 rounded-full mb-3">
                    {post.categorie}
                </span>
            )}
            
            {/* Lien "Lire la suite" */}
            <div className="mt-3 pt-3 border-t border-light-border dark:border-dark-border">
                <span className="font-semibold text-light-accent dark:text-teal text-sm group-hover:underline">
                    {translations.blog_page.read_more} →
                </span>
            </div>
        </NavLink>
    );
};

const BlogPage: React.FC = () => {
    const { translations } = useLanguage();
    const [articles, setArticles] = useState<ArticleBlogDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tous');
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                // Utiliser l'endpoint approprié selon le tri
                const data = sortBy === 'popular' 
                    ? await blogService.getPopularArticles()
                    : await blogService.getArticles();
                setArticles(data);
            } catch (err) {
                console.error('Erreur lors du chargement des articles:', err);
                setError('Impossible de charger les articles de blog');
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [sortBy]);

    // Extraire les catégories uniques
    const categories = useMemo(() => {
        const cats = articles
            .map(a => a.categorie)
            .filter((c): c is string => !!c);
        return ['Tous', ...Array.from(new Set(cats))];
    }, [articles]);

    // Filtrer les articles
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesCategory = selectedCategory === 'Tous' || article.categorie === selectedCategory;
            const matchesSearch = searchTerm === '' || 
                article.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.resume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                article.auteur.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [articles, selectedCategory, searchTerm]);

    const handleSearch = async () => {
        if (searchTerm.trim().length >= 2) {
            try {
                setLoading(true);
                const results = await searchService.searchBlog(searchTerm, 0, 20);
                // Convertir les résultats en ArticleBlogDTO
                const mappedResults = (results.content || []).map((r: any) => ({
                    id: r.publicationId || r.id || Math.random(),
                    titre: r.titre || '',
                    contenu: '',
                    resume: r.resume || '',
                    auteur: r.auteurPrincipal || 'Inconnu',
                    categorie: r.domaine || null,
                    motsCles: Array.isArray(r.motsCles) ? r.motsCles.join(', ') : r.motsCles,
                    urlImagePrincipale: null,
                    tempsLecture: 5,
                    nombreVues: r.nombreVues || 0,
                    datePublication: r.datePublication || new Date().toISOString()
                }));
                setArticles(mappedResults);
            } catch (err) {
                console.error('Erreur de recherche:', err);
            } finally {
                setLoading(false);
            }
        }
    };

    const resetFilters = async () => {
        setSearchTerm('');
        setSelectedCategory('Tous');
        setSortBy('recent');
        try {
            setLoading(true);
            const data = await blogService.getArticles();
            setArticles(data);
        } catch (err) {
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-light-accent dark:border-teal"></div>
                    <p className="text-light-text-secondary dark:text-gray-400 mt-4">Chargement des articles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center">
                    <p className="text-red-500">{error}</p>
                    <button 
                        onClick={resetFilters}
                        className="mt-4 px-4 py-2 bg-light-accent dark:bg-teal text-white rounded-lg"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 md:py-24 animate-slide-in-up overflow-x-hidden">
            <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-light-text dark:text-off-white break-words px-2">
                    {translations.blog_page.title}
                </h1>
                <p className="text-base sm:text-lg text-light-text-secondary dark:text-gray-300 mt-2 break-words px-2">
                    {translations.blog_page.subtitle}
                </p>
            </div>

            {/* Barre de filtres */}
            <div className="mb-8 bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-xl p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Recherche */}
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">
                            Rechercher
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    setSearchTerm(e.target.value);
                                }}
                                onPaste={(e) => {
                                    e.stopPropagation();
                                    const text = e.clipboardData.getData('text');
                                    setSearchTerm(text);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (searchTerm.trim().length >= 2) {
                                            handleSearch(e as unknown as React.FormEvent);
                                        }
                                    }
                                }}
                                placeholder="Titre, auteur, contenu..."
                                className="w-full bg-light-bg dark:bg-navy-dark border border-light-border dark:border-dark-border rounded-lg py-2 px-4 pr-10 text-light-text dark:text-off-white focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal"
                            />
                            <button 
                                type="button" 
                                onClick={() => {
                                    if (searchTerm.trim().length >= 2) {
                                        handleSearch({ preventDefault: () => {} } as React.FormEvent);
                                    }
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-light-accent dark:text-teal hover:opacity-70"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Catégorie */}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">
                            Catégorie
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-light-bg dark:bg-navy-dark border border-light-border dark:border-dark-border rounded-lg py-2 px-4 text-light-text dark:text-off-white focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tri */}
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-1">
                            Trier par
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
                            className="w-full bg-light-bg dark:bg-navy-dark border border-light-border dark:border-dark-border rounded-lg py-2 px-4 text-light-text dark:text-off-white focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-teal"
                        >
                            <option value="recent">Plus récents</option>
                            <option value="popular">Plus populaires</option>
                        </select>
                    </div>
                </div>

                {/* Bouton reset */}
                {(searchTerm || selectedCategory !== 'Tous' || sortBy !== 'recent') && (
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={resetFilters}
                            className="text-sm text-light-accent dark:text-teal hover:underline flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Réinitialiser les filtres
                        </button>
                    </div>
                )}
            </div>

            {/* Résultats */}
            <div className="mb-4 text-light-text-secondary dark:text-gray-400">
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} trouvé{filteredArticles.length !== 1 ? 's' : ''}
            </div>

            {filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-light-text-secondary dark:text-gray-400 break-words px-4">
                        Aucun article de blog ne correspond à vos critères.
                    </p>
                    <button 
                        onClick={resetFilters}
                        className="mt-4 text-light-accent dark:text-teal hover:underline"
                    >
                        Voir tous les articles
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredArticles.map(post => (
                        <BlogPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogPage;