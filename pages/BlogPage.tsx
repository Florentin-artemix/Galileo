
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { blogPosts } from '../data/blog';
import type { BlogPost } from '../types';

const BlogPostCard: React.FC<{ post: BlogPost }> = ({ post }) => {
    const { language, translations } = useLanguage();
    return (
        <NavLink to={`/blog/${post.slug}`} className="block bg-light-card dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-xl dark:hover:shadow-teal/20 backdrop-blur-sm group">
            <img src={post.imageUrl} alt={post.title[language]} className="w-full h-48 object-cover" />
            <div className="p-6">
                <p className="text-sm text-light-accent dark:text-teal mb-2">{post.date}</p>
                <h3 className="font-poppins text-xl font-bold mb-2 text-light-text dark:text-off-white group-hover:text-light-accent dark:group-hover:text-teal transition-colors duration-300">{post.title[language]}</h3>
                <p className="text-light-text-secondary dark:text-gray-400 text-sm mb-4 line-clamp-3">{post.summary[language]}</p>
                <span className="font-bold text-light-accent dark:text-teal">{translations.blog_page.read_more} →</span>
            </div>
        </NavLink>
    );
};

const BlogPage: React.FC = () => {
    const { translations } = useLanguage();
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 animate-slide-in-up">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-poppins font-bold text-light-text dark:text-off-white">{translations.blog_page.title}</h1>
                <p className="text-lg text-light-text-secondary dark:text-gray-300 mt-2">{translations.blog_page.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogPosts.map(post => (
                    <BlogPostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
};

export default BlogPage;