
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogService, type ArticleBlogDTO } from '../src/services/blogService';

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

    const defaultImage = 'https://via.placeholder.com/800x400?text=Article+Blog';

    return (
        <NavLink to={`/blog/${post.id}`} className="block bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-xl dark:hover:shadow-teal/20 backdrop-blur-sm group">
            <img 
                src={post.urlImagePrincipale || defaultImage} 
                alt={post.titre} 
                className="w-full h-48 object-cover" 
                onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultImage;
                }}
            />
            <div className="p-6">
                <p className="text-sm text-light-accent dark:text-teal mb-2">
                    {formatDate(post.datePublication)} • {post.tempsLecture || 5} min de lecture
                </p>
                <h3 className="font-poppins text-xl font-bold mb-2 text-light-text dark:text-off-white group-hover:text-light-accent dark:group-hover:text-teal transition-colors duration-300">
                    {post.titre}
                </h3>
                <p className="text-light-text-secondary dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {post.resume}
                </p>
                {post.categorie && (
                    <span className="inline-block bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal text-xs px-3 py-1 rounded-full mb-3">
                        {post.categorie}
                    </span>
                )}
                <div className="mt-4">
                    <span className="font-bold text-light-accent dark:text-teal">{translations.blog_page.read_more} →</span>
                </div>
            </div>
        </NavLink>
    );
};

const BlogPage: React.FC = () => {
    const { translations } = useLanguage();
    const [articles, setArticles] = useState<ArticleBlogDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                setLoading(true);
                const data = await blogService.getArticles();
                setArticles(data);
            } catch (err) {
                console.error('Erreur lors du chargement des articles:', err);
                setError('Impossible de charger les articles de blog');
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center">
                    <p className="text-light-text-secondary dark:text-gray-400">Chargement des articles...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="text-center">
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 animate-slide-in-up">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-poppins font-bold text-light-text dark:text-off-white">{translations.blog_page.title}</h1>
                <p className="text-lg text-light-text-secondary dark:text-gray-300 mt-2">{translations.blog_page.subtitle}</p>
            </div>
            {articles.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-light-text-secondary dark:text-gray-400">Aucun article de blog disponible pour le moment.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map(post => (
                        <BlogPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogPage;