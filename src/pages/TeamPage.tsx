import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllTeamMembers } from '../services/teamService';
import type { TeamMember } from '../types';
import Modal from '../components/Modal';

const TeamMemberCard: React.FC<{ member: TeamMember; onContact: (member: TeamMember) => void }> = ({ member, onContact }) => {
  const { translations } = useLanguage();
  return (
    <div 
      className="bg-light-card/80 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-xl p-6 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm animate-slide-in-up flex flex-col justify-between"
      aria-label={`Profil de ${member.name}`}
    >
      <div>
        <img 
          src={member.imageUrl} 
          alt={member.name} 
          className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-light-bg dark:border-navy shadow-md object-cover" 
          onError={(e) => {
            // Fallback avatar en cas d'image corrompue
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=200`;
          }}
        />
        <h3 className="text-xl font-poppins font-bold text-light-text dark:text-off-white">{member.name}</h3>
        <p className="text-light-accent dark:text-teal font-semibold mb-2">{member.role}</p>
        {member.location && <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-2">{member.location}</p>}
        <p className="text-light-text-secondary dark:text-gray-400 text-sm mb-4 min-h-[40px] line-clamp-3">
          {member.description || 'Membre du corps scientifique et académique Galileo.'}
        </p>
      </div>
      <button 
        onClick={() => onContact(member)} 
        className="text-sm font-bold border border-light-accent dark:border-teal text-light-accent dark:text-teal px-6 py-2 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300 mt-2"
        aria-label={`Contacter ${member.name}`}
      >
        {member.email ? translations.team_page.contact_member : "Demander contact"}
      </button>
    </div>
  );
};

// Skeleton loader component
const TeamMemberSkeleton: React.FC = () => (
  <div className="bg-light-card/80 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-xl p-6 text-center animate-pulse">
    <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-light-border dark:bg-dark-border"></div>
    <div className="h-6 bg-light-border dark:bg-dark-border rounded w-3/4 mx-auto mb-2"></div>
    <div className="h-4 bg-light-border dark:bg-dark-border rounded w-1/2 mx-auto mb-2"></div>
    <div className="h-4 bg-light-border dark:bg-dark-border rounded w-2/3 mx-auto mb-4"></div>
    <div className="h-10 bg-light-border dark:bg-dark-border rounded-full w-1/2 mx-auto"></div>
  </div>
);

const TeamPage: React.FC = () => {
  const { translations } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactMember, setContactMember] = useState<TeamMember | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // États de cycle de vie des données
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);

  // Charger les membres depuis l'API publique consolidée
  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsNetworkError(false);

      const members = await getAllTeamMembers();
      
      // Déduplication stricte par identifiant unique
      const uniqueMembers = members.filter((member, index, self) =>
        index === self.findIndex(m => m.id === member.id)
      );
      
      setTeamMembers(uniqueMembers);
    } catch (err: any) {
      console.error('Erreur chargement équipe:', err);
      if (!err.response || err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('network')) {
        setIsNetworkError(true);
        setError('Impossible de joindre le serveur. Veuillez vérifier votre connexion Internet.');
      } else {
        setIsNetworkError(false);
        setError('Une erreur est survenue lors de la récupération des membres de l\'équipe.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleContactClick = (member: TeamMember) => {
    if (member.email) {
      window.location.href = `mailto:${member.email}`;
    } else {
      setContactMember(member);
      setFormSubmitted(false);
      setIsModalOpen(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setIsModalOpen(false);
    }, 2000);
  };

  return (
    <div className="bg-light-card dark:bg-navy-dark min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 animate-slide-in-up">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold text-light-text dark:text-off-white mb-4">
            Notre Équipe
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-gray-300">
            Les responsables et encadreurs qui pilotent la recherche, la revue scientifique et les activités du réseau Galileo.
          </p>
        </div>

        {/* État d'erreur */}
        {error && !loading && (
          <div className="mt-12 text-center max-w-lg mx-auto">
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-2">{isNetworkError ? '📡' : '⚠️'}</div>
              <h3 className="font-semibold mb-1">
                {isNetworkError ? 'Problème de connexion' : 'Indisponibilité temporaire'}
              </h3>
              <p className="text-sm mb-4">{error}</p>
              <button 
                onClick={fetchTeamMembers}
                className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-colors duration-200 shadow"
              >
                <span>🔄</span>
                <span>Réessayer</span>
              </button>
            </div>
          </div>
        )}

        {/* État de chargement */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[...Array(6)].map((_, i) => (
              <TeamMemberSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Liste des membres ou état vide */}
        {!loading && !error && (
          <>
            {teamMembers.length === 0 ? (
              <div className="mt-12 text-center max-w-md mx-auto bg-light-card/60 dark:bg-navy/40 border border-light-border dark:border-dark-border rounded-xl p-8 shadow-sm">
                <div className="text-4xl mb-3">🏛️</div>
                <h3 className="text-lg font-semibold text-light-text dark:text-off-white mb-2">
                  Aucun membre répertorié pour le moment
                </h3>
                <p className="text-sm text-light-text-secondary dark:text-gray-400">
                  Les profils des responsables et encadreurs institutionnels apparaîtront ici dès leur enregistrement dans l'annuaire académique.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                {teamMembers.map(member => (
                  <TeamMemberCard key={member.id} member={member} onContact={handleContactClick} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Modale de contact */}
        {contactMember && (
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={`${translations.team_page.contact_modal_title} ${contactMember.name}`}
          >
            {formSubmitted ? (
              <div className="text-center p-6">
                <div className="text-4xl mb-2">✉️</div>
                <p className="text-lg font-medium text-light-accent dark:text-teal">{translations.team_page.message_sent}</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300">
                      {translations.team_page.your_name}
                    </label>
                    <input 
                      type="text" 
                      id="name" 
                      required 
                      className="mt-1 block w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal" 
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300">
                      {translations.team_page.your_email}
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      required 
                      className="mt-1 block w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal" 
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300">
                      {translations.team_page.message}
                    </label>
                    <textarea 
                      id="message" 
                      rows={4} 
                      required 
                      className="mt-1 block w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal" 
                      defaultValue={`Bonjour, je souhaiterais contacter ${contactMember.name}.`}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-4 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300"
                  >
                    {translations.team_page.send}
                  </button>
                </div>
              </form>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
