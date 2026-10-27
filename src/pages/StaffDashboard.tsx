import React, { useEffect, useState, useCallback } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../services/publicationsService';
import { eventService } from '../services/eventService';
import { blogService, ArticleBlogDTO, ArticleBlogCreateDTO } from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProfileCard from '../components/ProfileCard';
import DashboardLayout, { DashboardNavItem } from '../components/dashboard/DashboardLayout';
import OverviewView from '../components/dashboard/views/OverviewView';
import PendingSubmissionsView, { PendingSubmission } from '../components/dashboard/views/PendingSubmissionsView';
import PublicationsManagementView from '../components/dashboard/views/PublicationsManagementView';
import EventsManagementView, { EventItem } from '../components/dashboard/views/EventsManagementView';
import BlogManagementView from '../components/dashboard/views/BlogManagementView';
import {
  DashboardIcon,
  SubmissionsIcon,
  PublicationsIcon,
  EventsIcon,
  BlogIcon,
  ProfileIcon,
} from '../components/dashboard/DashboardIcons';

const StaffDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const { language } = useLanguage();

  const [tab, setTab] = useState<string>('dashboard');
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [blogArticles, setBlogArticles] = useState<ArticleBlogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, pubData, eventsData, blogData] = await Promise.all([
        soumissionsService.getSoumissionsEnAttente().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] })),
        eventService.getAllEventsNoPagination().catch(() => []),
        blogService.getArticles().catch(() => []),
      ]);

      setPending(pendingData || []);
      setPublications(pubData.content || []);
      setEvents(eventsData || []);
      setBlogArticles(blogData || []);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de synchroniser les données du tableau de bord');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatut = async (
    id: number,
    statut: 'ACCEPTEE' | 'REJETEE' | 'EN_REVISION',
    commentaire?: string
  ) => {
    try {
      if (statut === 'ACCEPTEE') {
        await soumissionsService.validerSoumission(id, commentaire || 'Validé par l\'équipe éditoriale');
        setSuccess('Soumission validée avec succès');
      } else if (statut === 'REJETEE') {
        await soumissionsService.rejeterSoumission(
          id,
          commentaire && commentaire.trim() ? commentaire.trim() : 'Soumission non conforme aux critères éditoriaux'
        );
        setSuccess('Soumission rejetée');
      } else if (statut === 'EN_REVISION') {
        if (!commentaire || !commentaire.trim()) return;
        await soumissionsService.demanderRevisions(id, commentaire.trim());
        setSuccess('Demande de révisions transmise à l\'auteur');
      }
      setPending((prev) => prev.filter((s) => s.id !== id));
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const created = await eventService.createEvent(eventData);
      setEvents((prev) => [created, ...prev]);
      setSuccess('Événement programmé avec succès');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création de l'événement");
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await eventService.deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSuccess('Événement retiré');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError('Erreur lors de la suppression de l\'événement');
    }
  };

  const handleCreateBlogArticle = async (data: ArticleBlogCreateDTO, file?: File | null) => {
    try {
      const articlePayload = { ...data };
      if (file) {
        const upload = await blogService.uploadBlogImage(file);
        articlePayload.urlImagePrincipale = upload.imageUrl;
      }
      const created = await blogService.createArticle(articlePayload);
      setBlogArticles((prev) => [created, ...prev]);
      setSuccess('Article de blog publié avec succès');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la publication de l'article");
    }
  };

  const handleUpdateBlogArticle = async (id: number, data: ArticleBlogCreateDTO, file?: File | null) => {
    try {
      const articlePayload = { ...data };
      if (file) {
        const upload = await blogService.uploadBlogImage(file);
        articlePayload.urlImagePrincipale = upload.imageUrl;
      }
      const updated = await blogService.updateArticle(id, articlePayload);
      setBlogArticles((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSuccess('Article de blog mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la mise à jour de l'article");
    }
  };

  const handleDeleteBlogArticle = async (id: number) => {
    try {
      await blogService.deleteArticle(id);
      setBlogArticles((prev) => prev.filter((a) => a.id !== id));
      setSuccess('Article de blog supprimé');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError('Erreur lors de la suppression de l\'article');
    }
  };

  const navItems: DashboardNavItem[] = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: <DashboardIcon /> },
    { id: 'pending', label: 'Soumissions', icon: <SubmissionsIcon />, badge: pending.length },
    { id: 'publications', label: 'Publications', icon: <PublicationsIcon /> },
    { id: 'events', label: 'Événements', icon: <EventsIcon />, badge: events.length },
    { id: 'blog', label: 'Articles de Blog', icon: <BlogIcon /> },
    { id: 'profile', label: 'Mon Profil', icon: <ProfileIcon /> },
  ];

  return (
    <DashboardLayout
      title="Espace Personnel & Modération"
      subtitle="Assistance à l'administration, modération éditoriale et gestion d'événements"
      roleBadge="STAFF"
      navItems={navItems}
      activeTab={tab}
      onTabChange={setTab}
      error={error}
      success={success}
      onClearError={() => setError(null)}
      onClearSuccess={() => setSuccess(null)}
    >
      {tab === 'dashboard' && (
        <OverviewView
          stats={{
            totalPublications: publications.length,
            totalEvents: events.length,
            pendingSubmissions: pending.length,
          }}
          pending={pending}
          events={events}
          publications={publications}
          onNavigateTab={setTab}
          role={role}
          userId={user?.uid}
        />
      )}

      {tab === 'pending' && (
        <PendingSubmissionsView
          pending={pending}
          onUpdateStatut={handleUpdateStatut}
          loading={loading}
        />
      )}

      {tab === 'publications' && (
        <PublicationsManagementView publications={publications} loading={loading} />
      )}

      {tab === 'events' && (
        <EventsManagementView
          events={events}
          language={language as 'fr' | 'en'}
          onDelete={handleDeleteEvent}
          onCreate={handleCreateEvent}
          loading={loading}
        />
      )}

      {tab === 'blog' && (
        <BlogManagementView
          articles={blogArticles}
          onCreate={handleCreateBlogArticle}
          onUpdate={handleUpdateBlogArticle}
          onDelete={handleDeleteBlogArticle}
          loading={loading}
        />
      )}

      {tab === 'profile' && (
        <div className="max-w-3xl mx-auto">
          <ProfileCard />
        </div>
      )}
    </DashboardLayout>
  );
};

export default StaffDashboard;
