
export interface Publication {
  id: number;
  title: Record<string, string>;
  authors: string[];
  date: string;
  domain: Record<string, string>;
  summary: Record<string, string>;
  pdfUrl: string | null;
  imageUrl: string;
  tags: string[];
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
  location?: string;
  email?: string;
  phone?: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: Record<string, string>;
  summary: Record<string, string>;
  content: Record<string, string>;
  imageUrl: string;
  date: string;
}

export interface Speaker {
  name: string;
  role: Record<string, string>;
  imageUrl: string;
  linkedin?: string;
}

export interface Resource {
  name: string;
  url: string;
  size: string;
  format: string;
}

export interface Event {
  id: number;
  title: Record<string, string>;
  date: string;
  type: Record<string, 'Atelier' | 'Conférence' | 'Workshop' | 'Conference'>;
  domain: Record<string, string>;
  location: string;
  summary: Record<string, string>;
  description: Record<string, string>;
  speakers: Speaker[];
  tags: string[];
  imageUrl: string;
  photos: string[];
  resources: Resource[];
}

export type SubmissionCategory = 'Nos travaux' | 'Décryptage' | 'Récits courts' | 'Innovations & Découvertes';

export interface ArticleFormData {
    submitterName: string;
    contactEmail: string;
    title: string;
    authors: string;
    affiliations: string;
    domain: string;
    category: SubmissionCategory;
    summary: string;
    keywords: string;
}

export interface ResourceItem {
  name: Record<string, string>;
  description: Record<string, string>;
  url: string;
  format: string;
}

export interface ResourceCategory {
  title: Record<string, string>;
  description: Record<string, string>;
  items: ResourceItem[];
}