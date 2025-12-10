
import React from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts } from '../data/blog';

const SingleBlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, translations } = useLanguage();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-poppins font-bold">Post not found</h1>
        <NavLink to="/blog" className="text-light-accent dark:text-teal mt-4 inline-block">Return to blog</NavLink>
      </div>
    );
  }

  const encodedUrl = encodeURIComponent(window.location.href);
  const encodedTitle = encodeURIComponent(post.title[language]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 animate-slide-in-up">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 text-light-text dark:text-off-white">{post.title[language]}</h1>
        <p className="text-light-accent dark:text-teal mb-8">{post.date}</p>
        <img src={post.imageUrl} alt={post.title[language]} className="w-full h-auto rounded-lg mb-8 shadow-lg" />
        <div className="prose prose-lg max-w-none text-light-text-secondary dark:text-gray-300 prose-headings:font-poppins prose-headings:text-light-text dark:prose-headings:text-off-white prose-a:text-light-accent dark:prose-a:text-teal prose-strong:text-light-text dark:prose-strong:text-off-white">
          {post.content[language].split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <div className="mt-12 border-t border-light-border dark:border-dark-border pt-8">
            <h3 className="text-lg font-bold mb-4 text-light-text dark:text-off-white">{translations.single_blog_page.share}</h3>
            <div className="flex space-x-4">
                <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="text-light-accent dark:text-teal hover:underline transition-colors">LinkedIn</a>
                <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="text-light-accent dark:text-teal hover:underline transition-colors">X</a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBlogPostPage;