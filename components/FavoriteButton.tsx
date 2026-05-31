import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favoritesService } from '../src/services/favoritesService';

interface FavoriteButtonProps {
  /** Identifiant de la publication */
  publicationId: number;
  /** Métadonnées optionnelles enregistrées avec le favori */
  publicationTitle?: string;
  publicationAuthors?: string;
  publicationDomain?: string;
  /** Taille du bouton */
  size?: 'sm' | 'md' | 'lg';
  /** Afficher un libellé textuel à côté de l'icône */
  showLabel?: boolean;
  /** Callback appelé après bascule, avec le nouvel état favori */
  onToggle?: (isFavorite: boolean) => void;
  className?: string;
}

/**
 * Bouton favori pour ajouter/retirer une publication des favoris.
 * Exploite le microservice galileo-user-profile via favoritesService.
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  publicationId,
  publicationTitle,
  publicationAuthors,
  publicationDomain,
  size = 'md',
  showLabel = false,
  onToggle,
  className = '',
}) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier le statut favori au chargement
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user) {
        setIsFavorite(false);
        return;
      }
      try {
        const status = await favoritesService.isFavorite(publicationId);
        if (!cancelled) setIsFavorite(status);
      } catch (error) {
        console.warn('[FavoriteButton] Échec de la vérification du favori:', error);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [user, publicationId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Vous devez être connecté pour ajouter aux favoris');
      return;
    }

    setIsLoading(true);
    try {
      let newStatus: boolean;
      if (isFavorite) {
        await favoritesService.removeFavorite(publicationId);
        newStatus = false;
      } else {
        await favoritesService.addFavorite({
          publicationId,
          publicationTitle,
          publicationAuthors,
          publicationDomain,
        });
        newStatus = true;
      }
      setIsFavorite(newStatus);
      onToggle?.(newStatus);
    } catch (error) {
      console.error('[FavoriteButton] Échec de la bascule du favori:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 p-2 rounded-full
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
      aria-pressed={isFavorite}
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
      {showLabel && (
        <span className="text-sm font-medium">
          {isFavorite ? 'Dans vos favoris' : 'Ajouter aux favoris'}
        </span>
      )}
    </button>
  );
};

export default FavoriteButton;
