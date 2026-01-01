
import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogService, type ArticleBlogDTO } from '../src/services/blogService';

const SingleBlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { translations } = useLanguage();
  const [post, setPost] = useState<ArticleBlogDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) {
        setError('ID de l\'article manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const article = await blogService.getArticleById(Number(id));
        setPost(article);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'article:', err);
        setError('Article non trouvé');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-light-text-secondary dark:text-gray-400">Chargement de l'article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-poppins font-bold text-light-text dark:text-off-white mb-4">Article non trouvé</h1>
        <NavLink to="/blog" className="text-light-accent dark:text-teal mt-4 inline-block hover:underline">
          Retour au blog
        </NavLink>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const encodedUrl = encodeURIComponent(window.location.href);
  const encodedTitle = encodeURIComponent(post.titre);
  const defaultImage = 'https://via.placeholder.com/1200x600?text=Article+Blog';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 md:py-24 animate-slide-in-up overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-poppins font-bold mb-4 text-light-text dark:text-off-white break-words">
          {post.titre}
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 text-light-text-secondary dark:text-gray-400 text-sm sm:text-base">
          <p className="text-light-accent dark:text-teal break-words">{formatDate(post.datePublication)}</p>
          <span className="hidden sm:inline">•</span>
          <p className="break-words">{post.tempsLecture || 5} min de lecture</p>
          <span className="hidden sm:inline">•</span>
          <p className="break-words">{post.nombreVues} vues</p>
        </div>
        {post.auteur && (
          <p className="text-light-text-secondary dark:text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base break-words">
            Par <span className="font-semibold text-light-text dark:text-off-white">{post.auteur}</span>
          </p>
        )}
        {post.urlImagePrincipale && (
          <div className="w-full mb-6 sm:mb-8 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={post.urlImagePrincipale} 
              alt={post.titre} 
              className="w-full h-auto object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultImage;
              }}
            />
          </div>
        )}
        {post.categorie && (
          <span className="inline-block bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal text-sm px-4 py-2 rounded-full mb-6 break-words">
            {post.categorie}
          </span>
        )}
        <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none text-light-text-secondary dark:text-gray-300 prose-headings:font-poppins prose-headings:text-light-text dark:prose-headings:text-off-white prose-a:text-light-accent dark:prose-a:text-teal prose-strong:text-light-text dark:prose-strong:text-off-white prose-img:rounded-lg prose-img:shadow-lg break-words">
          {post.contenu.split('\n').map((paragraph, index) => (
            paragraph.trim() && <p key={index} className="mb-4 break-words">{paragraph}</p>
          ))}
        </div>
        {post.motsCles && (
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-light-border dark:border-dark-border">
            <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-2">Mots-clés :</p>
            <div className="flex flex-wrap gap-2">
              {post.motsCles.split(',').map((keyword, index) => (
                <span key={index} className="bg-light-accent/10 dark:bg-teal/10 text-light-accent dark:text-teal text-xs px-3 py-1 rounded-full break-words">
                  {keyword.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 sm:mt-12 border-t border-light-border dark:border-dark-border pt-6 sm:pt-8">
          <h3 className="text-base sm:text-lg font-bold mb-4 text-light-text dark:text-off-white">
            {translations.single_blog_page.share}
          </h3>
          <div className="flex flex-wrap gap-4">
            <a 
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-light-accent dark:text-teal hover:underline transition-colors text-sm sm:text-base"
            >
              LinkedIn
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-light-accent dark:text-teal hover:underline transition-colors text-sm sm:text-base"
            >
              X
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBlogPostPage;