import React, { useEffect, useState, useCallback } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../services/publicationsService';
import { usersService, UserDTO } from '../services/usersService';
import { eventService } from '../services/eventService';
import { blogService, ArticleBlogDTO, ArticleBlogCreateDTO } from '../services/blogService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../services/authService';
import ProfileCard from '../components/ProfileCard';
import DashboardLayout, { DashboardNavItem } from '../components/dashboard/DashboardLayout';
import OverviewView from '../components/dashboard/views/OverviewView';
import UsersManagementView from '../components/dashboard/views/UsersManagementView';
import PendingSubmissionsView, { PendingSubmission } from '../components/dashboard/views/PendingSubmissionsView';
import PublicationsManagementView from '../components/dashboard/views/PublicationsManagementView';
import EventsManagementView, { EventItem } from '../components/dashboard/views/EventsManagementView';
import BlogManagementView from '../components/dashboard/views/BlogManagementView';
import {
  DashboardIcon,
  SubmissionsIcon,
  PublicationsIcon,
  UsersIcon,
  EventsIcon,
  BlogIcon,
  ProfileIcon,
} from '../components/dashboard/DashboardIcons';

const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const { language } = useLanguage();

  const [tab, setTab] = useState<string>('dashboard');
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [blogArticles, setBlogArticles] = useState<ArticleBlogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, pubData, usersData, eventsData, blogData] = await Promise.all([
        soumissionsService.getSoumissionsEnAttente().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] })),
        usersService.getUsers().catch((err) => {
          console.error('Erreur chargement utilisateurs:', err);
          return [];
        }),
        eventService.getAllEventsNoPagination().catch(() => []),
        blogService.getArticles().catch(() => []),
      ]);

      setPending(pendingData || []);
      setPublications(pubData.content || []);
      setUsers(usersData || []);
      setEvents(eventsData || []);
      setBlogArticles(blogData || []);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de synchroniser les données du tableau de bord administrateur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions métier
  const handleUpdateStatut = async (
    id: number,
    statut: 'ACCEPTEE' | 'REJETEE' | 'EN_REVISION',
    commentaire?: string
  ) => {
    try {
      if (statut === 'ACCEPTEE') {
        await soumissionsService.validerSoumission(id);
        setSuccess('Soumission validée et intégrée aux publications');
      } else if (statut === 'REJETEE') {
        await soumissionsService.rejeterSoumission(id);
        setSuccess('Soumission rejetée');
      } else if (statut === 'EN_REVISION') {
        if (!commentaire) return;
        await soumissionsService.demanderRevisions(id, commentaire);
        setSuccess('Demande de révisions transmise à l\'auteur');
      }
      setPending((prev) => prev.filter((s) => s.id !== id));
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleUpdateUserRole = async (uid: string, newRole: UserRole) => {
    setUpdatingUser(uid);
    try {
      await usersService.updateRole(uid, newRole);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));
      setSuccess(`Rôle mis à jour avec succès : ${newRole}`);
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError('Échec de la modification du rôle');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleReloadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await usersService.getUsers();
      setUsers(data || []);
      setSuccess('Liste des utilisateurs synchronisée');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Erreur lors du rechargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const created = await eventService.createEvent(eventData);
      setEvents((prev) => [created, ...prev]);
      setSuccess('Événement universitaire programmé avec succès');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création de l'événement");
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await eventService.deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSuccess('Événement retiré du calendrier');
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
    { id: 'users', label: 'Utilisateurs', icon: <UsersIcon />, badge: users.length },
    { id: 'events', label: 'Événements', icon: <EventsIcon />, badge: events.length },
    { id: 'blog', label: 'Articles de Blog', icon: <BlogIcon /> },
    { id: 'profile', label: 'Profil Administrateur', icon: <ProfileIcon /> },
  ];

  return (
    <DashboardLayout
      title="Console d'Administration"
      subtitle="Supervision globale, gestion des accès et modération scientifique"
      roleBadge="ADMIN"
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
            totalUsers: users.length,
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

      {tab === 'users' && (
        <UsersManagementView
          users={users}
          currentUserEmail={user?.email}
          updatingUser={updatingUser}
          onUpdateRole={handleUpdateUserRole}
          loading={loadingUsers || loading}
          onReload={handleReloadUsers}
        />
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

export default AdminDashboard;
