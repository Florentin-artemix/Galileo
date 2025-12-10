import type { TeamMember } from '../types';

// NOTE: Placeholder images are used. Replace with actual photos in production.
// They can be stored in `/public/uploads/team/` for example.

export const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: 'Jean-Paul Tsasa',
    role: 'Superviseur',
    description: "Supervise la coordination académique et la rigueur scientifique des activités et publications de Galileo.",
    imageUrl: `https://ui-avatars.com/api/?name=Jean-Paul+Tsasa&background=0B1E38&color=00BFA6&size=400`,
    location: "Faculté d'économie",
  },
  {
    id: 5,
    name: 'Joseph Ramazani',
    role: 'Consultant principal',
    description: "Apporte un appui scientifique et relecture experte des articles soumis.",
    imageUrl: `https://ui-avatars.com/api/?name=Joseph+Ramazani&background=0B1E38&color=00BFA6&size=400`,
    location: "Faculté d'économie",
    email: "josephramazani14@gmail.com",
    phone: "+243 824 917 197",
  },
  {
    id: 2,
    name: 'Derry Okanga',
    role: 'Président',
    description: "Responsable stratégique du cadre, il pilote les partenariats institutionnels et la vision opérationnelle.",
    imageUrl: `https://ui-avatars.com/api/?name=Derry+Okanga&background=0B1E38&color=00BFA6&size=400`,
    location: "Faculté d'économie",
  },
  {
    id: 3,
    name: 'Typhon Morisho',
    role: 'Vice-président',
    description: "Supervise les opérations quotidiennes, les ateliers et le soutien aux projets étudiants.",
    imageUrl: `https://ui-avatars.com/api/?name=Typhon+Morisho&background=0B1E38&color=00BFA6&size=400`,
    location: "Faculté d'économie",
  },
  {
    id: 4,
    name: 'Ketsia Ekutsu',
    role: 'Secrétaire',
    description: "Gère la communication interne, l’archivage des publications et l’organisation des événements.",
    imageUrl: `https://ui-avatars.com/api/?name=Ketsia+Ekutsu&background=0B1E38&color=00BFA6&size=400`,
    location: "Faculté d'économie",
  },
];
