import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileApi, TeamMemberProfile } from '../src/services/profileService';

interface ProfileCardProps {
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ className = '' }) => {
  const { user, idToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<TeamMemberProfile>({
    name: '',
    description: '',
    motivation: '',
    linkedinUrl: '',
    location: '',
    phone: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Charger le profil au montage
  useEffect(() => {
    const loadProfile = async () => {
      if (!idToken) return;
      
      setIsLoading(true);
      try {
        const existingProfile = await profileApi.getMyProfile(idToken);
        if (existingProfile) {
          setProfile(existingProfile);
        } else {
          // Pré-remplir avec les infos de Firebase
          setProfile(prev => ({
            ...prev,
            name: user?.displayName || '',
            email: user?.email || '',
          }));
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [idToken, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !idToken) return;

    // Validation côté client
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Format non supporté. Utilisez JPEG, PNG, GIF ou WebP.' });
      return;
    }

    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'La photo doit faire moins de 5 Mo.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const result = await profileApi.uploadPhoto(idToken, file);
      const newImageUrl = result.imageUrl || result.signedUrl;
      
      // Mettre à jour le profil avec la nouvelle URL
      const updatedProfile = { ...profile, imageUrl: newImageUrl };
      setProfile(updatedProfile);
      
      // Sauvegarder automatiquement le profil avec la nouvelle photo
      try {
        await profileApi.saveMyProfile(idToken, updatedProfile);
        setMessage({ type: 'success', text: 'Photo téléchargée et sauvegardée !' });
      } catch (saveError) {
        console.error('Erreur sauvegarde profil après upload:', saveError);
        setMessage({ type: 'success', text: 'Photo téléchargée ! N\'oubliez pas de sauvegarder votre profil.' });
      }
    } catch (error) {
      console.error('Erreur upload photo:', error);
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement de la photo.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!idToken) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const savedProfile = await profileApi.saveMyProfile(idToken, profile);
      setProfile(savedProfile);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profil sauvegardé avec succès !' });
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde du profil.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Chargement du profil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* En-tête avec photo */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
        <div className="flex items-center space-x-6">
          {/* Photo de profil */}
          <div className="relative">
            <div 
              onClick={isEditing ? handlePhotoClick : undefined}
              className={`w-24 h-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-4 border-white/50 ${
                isEditing ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
              }`}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : profile.imageUrl ? (
                <img 
                  src={profile.imageUrl} 
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-12 h-12 text-white/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-lg">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Infos principales */}
          <div className="text-white">
            <h2 className="text-2xl font-bold">{profile.name || 'Mon Profil'}</h2>
            <p className="text-white/80">{user?.email}</p>
            {profile.role && (
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                {profile.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message de feedback */}
      {message && (
        <div className={`px-6 py-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulaire / Affichage */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rôle / Fonction
              </label>
              <input
                type="text"
                name="role"
                value={profile.role || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ex: Chercheur, Doctorant, Professeur..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivation
              </label>
              <textarea
                name="motivation"
                value={profile.motivation || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Pourquoi êtes-vous passionné par la recherche ?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                À propos de moi
              </label>
              <textarea
                name="description"
                value={profile.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Parlez-nous de vous, vos recherches, vos intérêts..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  name="location"
                  value={profile.location || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ville, Pays"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profil LinkedIn
              </label>
              <input
                type="url"
                name="linkedinUrl"
                value={profile.linkedinUrl || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://linkedin.com/in/votre-profil"
              />
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Affichage du profil */}
            {profile.motivation && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Motivation</h3>
                <p className="text-gray-800 dark:text-gray-200">{profile.motivation}</p>
              </div>
            )}

            {profile.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">À propos</h3>
                <p className="text-gray-800 dark:text-gray-200">{profile.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.location && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.location}
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {profile.phone}
                </div>
              )}

              {profile.linkedinUrl && (
                <div className="flex items-center">
                  <a 
                    href={profile.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Voir le profil LinkedIn
                  </a>
                </div>
              )}
            </div>

            {/* Bouton modifier */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier mon profil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
