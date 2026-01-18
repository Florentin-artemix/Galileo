import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesService } from '../src/services/favoritesService';

interface FavoriteButtonProps {
  publication: {
    id: number;
    titre: string;
    auteurs: string;
    domaine: string;
  };
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  className?: string;
}

/**
 * Bouton favori pour ajouter/retirer une publication des favoris
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  publication,
  size = 'medium',
  showCount = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(0);

  // Vérifier si c'est un favori au chargement
  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, publication.id]);

  const checkFavoriteStatus = async () => {
    try {
      const status = await favoritesService.isFavorite(publication.id);
      setIsFavorite(status);
    } catch (error) {
      console.warn('Failed to check favorite status:', error);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Rediriger vers la page de connexion ou afficher un message
      alert('Vous devez être connecté pour ajouter aux favoris');
      return;
    }

    setIsLoading(true);
    try {
      const newStatus = await favoritesService.toggleFavorite(publication);
      setIsFavorite(newStatus);
      setCount(prev => newStatus ? prev + 1 : Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  };

  const iconSize = {
    small: 16,
    medium: 20,
    large: 24
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-1 p-2 rounded-full
        transition-all duration-200 ease-in-out
        ${isFavorite
          ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
          : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        ${className}
      `}
      title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showCount && count > 0 && (
        <span className="text-sm font-medium">{count}</span>
      )}
    </button>
  );
};

export default FavoriteButton;
