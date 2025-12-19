
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTeamMembersByRole } from '../src/services/teamService';
import type { TeamMember } from '../types';
import Modal from '../components/Modal';

const TeamMemberCard: React.FC<{ member: TeamMember; onContact: (member: TeamMember) => void }> = ({ member, onContact }) => {
  const { translations } = useLanguage();
  return (
    <div 
      className="bg-light-card/80 dark:bg-navy/50 border border-light-border dark:border-dark-border rounded-xl p-6 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm animate-slide-in-up"
      aria-label={`Profil de ${member.name}`}
    >
      <img src={member.imageUrl} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-light-bg dark:border-navy shadow-md" />
      <h3 className="text-xl font-poppins font-bold text-light-text dark:text-off-white">{member.name}</h3>
      <p className="text-light-accent dark:text-teal font-semibold mb-2">{member.role}</p>
      {member.location && <p className="text-sm text-light-text-secondary dark:text-gray-400 mb-2">{member.location}</p>}
      <p className="text-light-text-secondary dark:text-gray-400 text-sm mb-4 min-h-[40px]">{member.description}</p>
      <button 
        onClick={() => onContact(member)} 
        className="text-sm font-bold border border-light-accent dark:border-teal text-light-accent dark:text-teal px-6 py-2 rounded-full hover:bg-light-accent dark:hover:bg-teal hover:text-white dark:hover:text-navy transition-colors duration-300"
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
  
  // États pour les données API
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les membres depuis l'API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        // Récupérer les membres STAFF et ADMIN en parallèle
        const [staffMembers, adminMembers] = await Promise.all([
          getTeamMembersByRole('STAFF'),
          getTeamMembersByRole('ADMIN')
        ]);
        
        // Combiner et dédupliquer par ID
        const allMembers = [...staffMembers, ...adminMembers];
        const uniqueMembers = allMembers.filter((member, index, self) =>
          index === self.findIndex(m => m.id === member.id)
        );
        
        setTeamMembers(uniqueMembers);
      } catch (err) {
        console.error('Erreur chargement équipe:', err);
        setError('Impossible de charger les membres de l\'équipe');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

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
    console.log(`Simulating contact submission for ${contactMember?.name}`);
    setFormSubmitted(true);
    setTimeout(() => {
        setIsModalOpen(false);
    }, 2000);
  }

  return (
    <div className="bg-light-card dark:bg-navy-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 animate-slide-in-up">
        <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-poppins font-bold text-light-text dark:text-off-white mb-4">Notre Équipe</h1>
            <p className="text-lg text-light-text-secondary dark:text-gray-300">
                Les responsables et encadreurs qui pilotent la recherche, la revue scientifique et les activités du réseau Galileo.
            </p>
        </div>

        {/* État d'erreur */}
        {error && (
          <div className="mt-8 text-center">
            <div className="inline-block bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg">
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

        {/* État de chargement */}
        {loading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[...Array(6)].map((_, i) => (
              <TeamMemberSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Liste des membres */}
        {!loading && !error && (
          <>
            {teamMembers.length === 0 ? (
              <div className="mt-12 text-center text-light-text-secondary dark:text-gray-400">
                <p>Aucun membre de l'équipe pour le moment.</p>
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

        {contactMember && (
            <Modal 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
              title={`${translations.team_page.contact_modal_title} ${contactMember.name}`}
            >
              {formSubmitted ? (
                   <div className="text-center p-4">
                      <p className="text-lg text-light-accent dark:text-teal">{translations.team_page.message_sent}</p>
                  </div>
              ) : (
              <form onSubmit={handleFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300">{translations.team_page.your_name}</label>
                    <input type="text" id="name" required className="mt-1 block w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300">{translations.team_page.your_email}</label>
                    <input type="email" id="email" required className="mt-1 block w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal" />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-light-text-secondary dark:text-gray-300">{translations.team_page.message}</label>
                    <textarea id="message" rows={4} required className="mt-1 block w-full bg-light-card dark:bg-navy/70 border border-light-border dark:border-dark-border rounded-md shadow-sm py-2 px-3 text-light-text dark:text-off-white focus:outline-none focus:ring-light-accent dark:focus:ring-teal focus:border-light-accent dark:focus:border-teal" defaultValue={`Bonjour, je souhaiterais contacter ${contactMember.name}.`}></textarea>
                  </div>
                  <button type="submit" className="w-full bg-light-accent dark:bg-teal text-white dark:text-navy font-bold py-2 px-4 rounded-full hover:bg-light-accent-hover dark:hover:bg-opacity-80 transition-all duration-300">
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