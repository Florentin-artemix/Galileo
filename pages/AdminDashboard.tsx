import React, { useEffect, useState } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../src/services/publicationsService';
import { usersService, UserDTO } from '../src/services/usersService';
import { eventService } from '../src/services/eventService';
import { blogService, ArticleBlogDTO, ArticleBlogCreateDTO } from '../src/services/blogService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../src/services/authService';
import { ROLE_LABELS } from '../src/constants/roles';
import RoleBadge from '../components/RoleBadge';
import ProfileCard from '../components/ProfileCard';
import QuickStats from '../components/QuickStats';
import ReadingHistoryWidget from '../components/ReadingHistoryWidget';
import FavoritesWidget from '../components/FavoritesWidget';

interface Soumission {
  id: number;
  titre?: string;
  auteurPrincipal?: string;
  emailAuteur?: string;
  statut?: string;
  dateCreation?: string;
  domaineRecherche?: string;
}

interface Event {
  id: number;
  title: { fr: string; en: string };
  date: string;
  type: { fr: string; en: string };
  domain: { fr: string; en: string };
  location: string;
}

interface Stats {
  totalUsers: number;
  totalPublications: number;
  totalEvents: number;
  pendingSubmissions: number;
}

type TabType = 'dashboard' | 'profile' | 'users' | 'events' | 'publications' | 'pending' | 'blog';

const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();
  const { translations, language } = useLanguage();
  const [pending, setPending] = useState<Soumission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [blogArticles, setBlogArticles] = useState<ArticleBlogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('dashboard');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPublications: 0,
    totalEvents: 0,
    pendingSubmissions: 0
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlogArticle, setEditingBlogArticle] = useState<ArticleBlogDTO | null>(null);
  const [newEvent, setNewEvent] = useState({
    titleFr: '',
    titleEn: '',
    date: '',
    typeFr: '',
    typeEn: '',
    domainFr: '',
    domainEn: '',
    location: '',
    summaryFr: '',
    summaryEn: '',
    descriptionFr: '',
    descriptionEn: ''
  });
  const [newBlogArticle, setNewBlogArticle] = useState<ArticleBlogCreateDTO>({
    titre: '',
    contenu: '',
    resume: '',
    auteur: '',
    categorie: '',
    motsCles: '',
    urlImagePrincipale: '',
    tempsLecture: 5,
    publie: true
  });
  const [blogImageFile, setBlogImageFile] = useState<File | null>(null);
  const [blogImagePreview, setBlogImagePreview] = useState<string | null>(null);
  const [uploadingBlogImage, setUploadingBlogImage] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, [role]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, pubData] = await Promise.all([
        soumissionsService.getSoumissionsEnAttente().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] }))
      ]);

      setPending(pendingData || []);
      setPublications(pubData.content || []);

      // Charger les utilisateurs, événements et articles de blog pour ADMIN/STAFF
      if (role === 'ADMIN' || role === 'STAFF') {
        try {
          if (role === 'ADMIN') {
            setLoadingUsers(true);
          }
          const [usersData, eventsData, blogData] = await Promise.all([
            role === 'ADMIN' ? usersService.getUsers().catch((err) => {
              console.error('Erreur lors de la récupération des utilisateurs:', err);
              const errorMsg = err.response?.data?.message || err.response?.data?.erreur || err.message || 'Erreur inconnue';
              setError(`Erreur lors du chargement des utilisateurs: ${errorMsg}`);
              return [];
            }) : Promise.resolve([]),
            // ADMIN et STAFF peuvent voir les événements
            eventService.getAllEventsNoPagination().catch((err) => {
              console.error('Erreur lors de la récupération des événements:', err);
              return [];
            }),
            blogService.getArticles().catch((err) => {
              console.error('Erreur lors de la récupération des articles de blog:', err);
              return [];
            })
          ]);
          if (role === 'ADMIN') {
            setUsers(usersData || []);
            setLoadingUsers(false);
            console.log(`✅ ${usersData?.length || 0} utilisateurs chargés`);
          }
          setEvents(eventsData || []);
          setBlogArticles(blogData || []);
          
          // Calculer les statistiques pour ADMIN et STAFF
          setStats({
            totalUsers: role === 'ADMIN' ? (usersData?.length || 0) : 0,
            totalPublications: pubData.content?.length || 0,
            totalEvents: eventsData?.length || 0,
            pendingSubmissions: pendingData?.length || 0
          });
        } catch (e) {
          console.error('Erreur chargement données admin:', e);
          setError('Erreur lors du chargement des données administrateur');
        }
      }
    } catch (e: any) {
      setError("Impossible de charger les données");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (id: number, statut: 'ACCEPTEE' | 'REJETEE' | 'EN_REVISION') => {
    try {
      if (statut === 'ACCEPTEE') {
        await soumissionsService.validerSoumission(id);
        setSuccess('Soumission acceptée avec succès');
      } else if (statut === 'REJETEE') {
        await soumissionsService.rejeterSoumission(id);
        setSuccess('Soumission rejetée');
      } else if (statut === 'EN_REVISION') {
        const commentaire = prompt('Commentaires pour la révision:');
        if (commentaire) {
          await soumissionsService.demanderRevisions(id, commentaire);
          setSuccess('Demande de révisions envoyée');
        } else {
          return; // Annulé par l'utilisateur
        }
      }
      setPending((prev) => prev.filter((s) => s.id !== id));
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    setUpdatingUser(uid);
    try {
      await usersService.updateRole(uid, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
      setSuccess('Rôle modifié avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError("Impossible de modifier le rôle");
    } finally {
      setUpdatingUser(null);
    }
  };

  const createEvent = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }

      const eventData = {
        title: { fr: newEvent.titleFr, en: newEvent.titleEn },
        date: newEvent.date,
        type: { fr: newEvent.typeFr, en: newEvent.typeEn },
        domain: { fr: newEvent.domainFr, en: newEvent.domainEn },
        location: newEvent.location,
        summary: { fr: newEvent.summaryFr, en: newEvent.summaryEn },
        description: { fr: newEvent.descriptionFr, en: newEvent.descriptionEn },
        speakers: [],
        tags: [],
        imageUrl: 'https://picsum.photos/800/400',
        photos: [],
        resources: []
      };

      const created = await eventService.createEvent(eventData, token);
      setEvents(prev => [created, ...prev]);
      setShowEventModal(false);
      setNewEvent({
        titleFr: '', titleEn: '', date: '', typeFr: '', typeEn: '',
        domainFr: '', domainEn: '', location: '', summaryFr: '', summaryEn: '',
        descriptionFr: '', descriptionEn: ''
      });
      setSuccess('Événement créé avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError('Erreur lors de la création: ' + (e.message || ''));
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError('Token d\'authentification manquant');
        return;
      }
      await eventService.deleteEvent(eventId, token);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSuccess('Événement supprimé');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Erreur lors de la suppression');
    }
  };

  const createBlogArticle = async () => {
    try {
      if (!newBlogArticle.titre || !newBlogArticle.contenu || !newBlogArticle.resume || !newBlogArticle.auteur) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      let articleData = { ...newBlogArticle };

      // Upload de l'image si un fichier est sélectionné
      if (blogImageFile) {
        setUploadingBlogImage(true);
        try {
          const uploadResult = await blogService.uploadBlogImage(blogImageFile);
          articleData.urlImagePrincipale = uploadResult.imageUrl;
        } catch (uploadError: any) {
          setError('Erreur lors de l\'upload de l\'image: ' + (uploadError.message || ''));
          setUploadingBlogImage(false);
          return;
        }
        setUploadingBlogImage(false);
      }

      const created = await blogService.createArticle(articleData);
      setBlogArticles(prev => [created, ...prev]);
      setShowBlogModal(false);
      setNewBlogArticle({
        titre: '',
        contenu: '',
        resume: '',
        auteur: '',
        categorie: '',
        motsCles: '',
        urlImagePrincipale: '',
        tempsLecture: 5,
        publie: true
      });
      setBlogImageFile(null);
      setBlogImagePreview(null);
      setSuccess('Article de blog créé avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError('Erreur lors de la création: ' + (e.message || ''));
    }
  };

  const updateBlogArticle = async () => {
    if (!editingBlogArticle) return;
    try {
      if (!newBlogArticle.titre || !newBlogArticle.contenu || !newBlogArticle.resume || !newBlogArticle.auteur) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      let articleData = { ...newBlogArticle };

      // Upload de l'image si un nouveau fichier est sélectionné
      if (blogImageFile) {
        setUploadingBlogImage(true);
        try {
          const uploadResult = await blogService.uploadBlogImage(blogImageFile);
          articleData.urlImagePrincipale = uploadResult.imageUrl;
        } catch (uploadError: any) {
          setError('Erreur lors de l\'upload de l\'image: ' + (uploadError.message || ''));
          setUploadingBlogImage(false);
          return;
        }
        setUploadingBlogImage(false);
      }

      const updated = await blogService.updateArticle(editingBlogArticle.id, articleData);
      setBlogArticles(prev => prev.map(a => a.id === editingBlogArticle.id ? updated : a));
      setShowBlogModal(false);
      setEditingBlogArticle(null);
      setNewBlogArticle({
        titre: '',
        contenu: '',
        resume: '',
        auteur: '',
        categorie: '',
        motsCles: '',
        urlImagePrincipale: '',
        tempsLecture: 5,
        publie: true
      });
      setBlogImageFile(null);
      setBlogImagePreview(null);
      setSuccess('Article de blog mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError('Erreur lors de la mise à jour: ' + (e.message || ''));
    }
  };

  const deleteBlogArticle = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article de blog ?')) return;
    try {
      await blogService.deleteArticle(id);
      setBlogArticles(prev => prev.filter(a => a.id !== id));
      setSuccess('Article de blog supprimé');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError('Erreur lors de la suppression: ' + (e.message || ''));
    }
  };

  const openBlogEditModal = (article: ArticleBlogDTO) => {
    setEditingBlogArticle(article);
    setNewBlogArticle({
      titre: article.titre,
      contenu: article.contenu,
      resume: article.resume,
      auteur: article.auteur,
      categorie: article.categorie || '',
      motsCles: article.motsCles || '',
      urlImagePrincipale: article.urlImagePrincipale || '',
      tempsLecture: article.tempsLecture || 5,
      publie: true
    });
    setShowBlogModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header - ADMIN PREMIUM */}
        <div className="mb-8">
          <div className="relative bg-gradient-to-r from-red-700 via-red-600 to-amber-600 rounded-2xl p-6 mb-4 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">👑</span>
                    <h1 className="text-3xl font-bold text-white">
                      Dashboard Administrateur
                    </h1>
                  </div>
                  <p className="text-white/90">
                    Accès complet en lecture et écriture à toutes les fonctionnalités
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <div className="inline-flex items-center px-4 py-2 bg-amber-500/90 rounded-full text-white font-bold shadow-lg">
                    <span className="mr-2">⚡</span>
                    SUPER ADMIN
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                  <span className="mr-2">✅</span> Gestion utilisateurs
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                  <span className="mr-2">✅</span> CRUD Publications
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                  <span className="mr-2">✅</span> CRUD Événements
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                  <span className="mr-2">✅</span> CRUD Blog
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-sm">
                  <span className="mr-2">✅</span> Validation soumissions
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Connecté en tant que <span className="font-semibold">{user?.email}</span>
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-between animate-slide-in-down">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="ml-4 underline hover:no-underline">Fermer</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 flex items-center justify-between animate-slide-in-down">
            <span>✅ {success}</span>
            <button onClick={() => setSuccess(null)} className="ml-4 underline hover:no-underline">Fermer</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-2">
          <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon="📊">
            Vue d'ensemble
          </TabButton>
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon="👤">
            Mon Profil
          </TabButton>
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} icon="⏳" badge={pending.length}>
            Soumissions
          </TabButton>
          <TabButton active={tab === 'publications'} onClick={() => setTab('publications')} icon="📚">
            Publications
          </TabButton>
          {(role === 'ADMIN' || role === 'STAFF') && (
            <TabButton active={tab === 'blog'} onClick={() => setTab('blog')} icon="✍️">
              Blog
            </TabButton>
          )}
          {role === 'ADMIN' && (
            <>
              <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon="🎯">
                Événements
              </TabButton>
              <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon="👥" badge={users.length}>
                Utilisateurs
              </TabButton>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {tab === 'dashboard' && (
            <DashboardView stats={stats} pending={pending} publications={publications} events={events} />
          )}

          {tab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <ProfileCard />
            </div>
          )}

          {tab === 'pending' && (
            <PendingSubmissionsView pending={pending} onUpdateStatut={updateStatut} />
          )}

          {tab === 'publications' && (
            <PublicationsView publications={publications} />
          )}

          {tab === 'events' && role === 'ADMIN' && (
            <EventsView 
              events={events} 
              language={language} 
              onDelete={deleteEvent}
              onAdd={() => setShowEventModal(true)}
            />
          )}

          {tab === 'users' && role === 'ADMIN' && (
            <UsersView 
              users={users} 
              currentUserEmail={user?.email} 
              updatingUser={updatingUser} 
              onUpdateRole={updateUserRole}
              loading={loadingUsers}
              onReload={async () => {
                setLoadingUsers(true);
                setError(null);
                try {
                  const usersData = await usersService.getUsers();
                  setUsers(usersData || []);
                  setStats(prev => ({ ...prev, totalUsers: usersData?.length || 0 }));
                  console.log(`✅ ${usersData?.length || 0} utilisateurs rechargés`);
                } catch (err: any) {
                  console.error('Erreur lors du rechargement des utilisateurs:', err);
                  const errorMsg = err.response?.data?.message || err.response?.data?.erreur || err.message || 'Erreur inconnue';
                  setError(`Erreur lors du rechargement des utilisateurs: ${errorMsg}`);
                } finally {
                  setLoadingUsers(false);
                }
              }}
            />
          )}

          {tab === 'blog' && (role === 'ADMIN' || role === 'STAFF') && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Articles de Blog</h2>
                <button
                  onClick={() => {
                    setEditingBlogArticle(null);
                    setNewBlogArticle({
                      titre: '',
                      contenu: '',
                      resume: '',
                      auteur: user?.email || '',
                      categorie: '',
                      motsCles: '',
                      urlImagePrincipale: '',
                      tempsLecture: 5,
                      publie: true
                    });
                    setShowBlogModal(true);
                  }}
                  className="px-4 py-2 bg-teal text-white rounded-lg hover:bg-teal/90 transition-colors"
                >
                  + Nouvel Article
                </button>
              </div>
              
              {blogArticles.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Aucun article de blog pour le moment.
                </p>
              ) : (
                <div className="grid gap-4">
                  {blogArticles.map(article => (
                    <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{article.titre}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{article.resume}</p>
                          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Par {article.auteur}</span>
                            <span>•</span>
                            <span>{new Date(article.datePublication).toLocaleDateString('fr-FR')}</span>
                            <span>•</span>
                            <span>{article.nombreVues} vues</span>
                            {article.categorie && (
                              <>
                                <span>•</span>
                                <span className="bg-teal/10 text-teal px-2 py-1 rounded">{article.categorie}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => openBlogEditModal(article)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                          >
                            Modifier
                          </button>
                          {role === 'ADMIN' && (
                            <button
                              onClick={() => deleteBlogArticle(article.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création d'événement */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Nouvel événement</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre (FR) *</label>
                  <input
                    type="text"
                    value={newEvent.titleFr}
                    onChange={(e) => setNewEvent({ ...newEvent, titleFr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre (EN) *</label>
                  <input
                    type="text"
                    value={newEvent.titleEn}
                    onChange={(e) => setNewEvent({ ...newEvent, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lieu *</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type (FR) *</label>
                  <input
                    type="text"
                    value={newEvent.typeFr}
                    onChange={(e) => setNewEvent({ ...newEvent, typeFr: e.target.value })}
                    placeholder="ex: Conférence, Atelier"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type (EN) *</label>
                  <input
                    type="text"
                    value={newEvent.typeEn}
                    onChange={(e) => setNewEvent({ ...newEvent, typeEn: e.target.value })}
                    placeholder="ex: Conference, Workshop"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domaine (FR) *</label>
                  <input
                    type="text"
                    value={newEvent.domainFr}
                    onChange={(e) => setNewEvent({ ...newEvent, domainFr: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domaine (EN) *</label>
                  <input
                    type="text"
                    value={newEvent.domainEn}
                    onChange={(e) => setNewEvent({ ...newEvent, domainEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Résumé (FR) *</label>
                <textarea
                  value={newEvent.summaryFr}
                  onChange={(e) => setNewEvent({ ...newEvent, summaryFr: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Résumé (EN) *</label>
                <textarea
                  value={newEvent.summaryEn}
                  onChange={(e) => setNewEvent({ ...newEvent, summaryEn: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (FR) *</label>
                <textarea
                  value={newEvent.descriptionFr}
                  onChange={(e) => setNewEvent({ ...newEvent, descriptionFr: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (EN) *</label>
                <textarea
                  value={newEvent.descriptionEn}
                  onChange={(e) => setNewEvent({ ...newEvent, descriptionEn: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={createEvent}
                disabled={!newEvent.titleFr || !newEvent.titleEn || !newEvent.date}
                className="flex-1 px-4 py-2 bg-teal hover:bg-teal/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Créer l'événement
              </button>
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création/modification d'article de blog */}
      {showBlogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ✍️ {editingBlogArticle ? 'Modifier l\'article' : 'Nouvel article de blog'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre * <span className="text-xs text-gray-500">(min 10, max 500 caractères)</span>
                </label>
                <input
                  type="text"
                  value={newBlogArticle.titre}
                  onChange={(e) => setNewBlogArticle({ ...newBlogArticle, titre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Titre de l'article"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Résumé * <span className="text-xs text-gray-500">(min 50, max 1000 caractères)</span>
                </label>
                <textarea
                  value={newBlogArticle.resume}
                  onChange={(e) => setNewBlogArticle({ ...newBlogArticle, resume: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Résumé court de l'article"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenu * <span className="text-xs text-gray-500">(min 100 caractères)</span>
                </label>
                <textarea
                  value={newBlogArticle.contenu}
                  onChange={(e) => setNewBlogArticle({ ...newBlogArticle, contenu: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="Contenu de l'article (une ligne par paragraphe)"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Auteur *
                  </label>
                  <input
                    type="text"
                    value={newBlogArticle.auteur}
                    onChange={(e) => setNewBlogArticle({ ...newBlogArticle, auteur: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nom de l'auteur"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={newBlogArticle.categorie || ''}
                    onChange={(e) => setNewBlogArticle({ ...newBlogArticle, categorie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="ex: Recherche, Actualité, Tutoriel"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mots-clés <span className="text-xs text-gray-500">(séparés par des virgules)</span>
                  </label>
                  <input
                    type="text"
                    value={newBlogArticle.motsCles || ''}
                    onChange={(e) => setNewBlogArticle({ ...newBlogArticle, motsCles: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="ex: science, recherche, IA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temps de lecture <span className="text-xs text-gray-500">(en minutes)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newBlogArticle.tempsLecture || 5}
                    onChange={(e) => setNewBlogArticle({ ...newBlogArticle, tempsLecture: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image principale
                </label>
                <div className="space-y-3">
                  {/* Aperçu de l'image */}
                  {(blogImagePreview || newBlogArticle.urlImagePrincipale) && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img 
                        src={blogImagePreview || newBlogArticle.urlImagePrincipale || ''} 
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setBlogImageFile(null);
                          setBlogImagePreview(null);
                          setNewBlogArticle({ ...newBlogArticle, urlImagePrincipale: '' });
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Bouton d'upload */}
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-teal dark:hover:border-teal transition-colors bg-gray-50 dark:bg-gray-700/50">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {blogImageFile ? blogImageFile.name : 'Sélectionner une image depuis votre PC'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Vérifier la taille (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              setError('L\'image ne doit pas dépasser 5MB');
                              return;
                            }
                            setBlogImageFile(file);
                            // Créer un aperçu local
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setBlogImagePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {/* Indicateur d'upload en cours */}
                  {uploadingBlogImage && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal"></div>
                      <span>Upload de l'image en cours...</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Formats acceptés: JPG, PNG, GIF, WebP (max 5MB)
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="publie"
                  checked={newBlogArticle.publie ?? true}
                  onChange={(e) => setNewBlogArticle({ ...newBlogArticle, publie: e.target.checked })}
                  className="w-4 h-4 text-teal border-gray-300 rounded focus:ring-teal"
                />
                <label htmlFor="publie" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Publié (visible publiquement)
                </label>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={editingBlogArticle ? updateBlogArticle : createBlogArticle}
                disabled={!newBlogArticle.titre || !newBlogArticle.contenu || !newBlogArticle.resume || !newBlogArticle.auteur || uploadingBlogImage}
                className="flex-1 px-4 py-2 bg-teal hover:bg-teal/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploadingBlogImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Upload en cours...
                  </>
                ) : (
                  editingBlogArticle ? '✓ Modifier l\'article' : '✓ Créer l\'article'
                )}
              </button>
              <button
                onClick={() => {
                  setShowBlogModal(false);
                  setEditingBlogArticle(null);
                  setNewBlogArticle({
                    titre: '',
                    contenu: '',
                    resume: '',
                    auteur: '',
                    categorie: '',
                    motsCles: '',
                    urlImagePrincipale: '',
                    tempsLecture: 5,
                    publie: true
                  });
                  setBlogImageFile(null);
                  setBlogImagePreview(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composants enfants
const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      </div>
      <div className="text-4xl opacity-20">{icon}</div>
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, badge, children }: any) => (
  <button
    onClick={onClick}
    className={`relative px-4 py-2 font-medium whitespace-nowrap rounded-t-lg transition-all ${
      active
        ? 'text-teal bg-white dark:bg-gray-800 border-b-2 border-teal'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`}
  >
    <span className="mr-2">{icon}</span>
    {children}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const DashboardView = ({ stats, pending, publications, events }: any) => {
  const { user, role } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Stats Cards Modernes */}
      <QuickStats userId={user?.uid} role={role} />

      {/* Widgets Lecture et Favoris */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadingHistoryWidget />
        <FavoritesWidget />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Soumissions récentes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pending.length} en attente</p>
            </div>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune soumission en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map((s: any) => (
                <div key={s.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition border border-transparent hover:border-orange-200 dark:hover:border-orange-800 cursor-pointer">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{s.titre}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{s.auteurPrincipal}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
                    {s.statut || 'EN_ATTENTE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <svg className="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Événements à venir</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{events.length} événements</p>
            </div>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun événement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map((e: any) => (
                <div key={e.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition border border-transparent hover:border-teal-200 dark:hover:border-teal-800 cursor-pointer">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{e.title?.fr || 'Sans titre'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{e.date}</p>
                  {e.type?.fr && (
                    <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">
                      {e.type.fr}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PendingSubmissionsView = ({ pending, onUpdateStatut }: any) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">⏳ Soumissions en attente ({pending.length})</h2>
    {pending.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">✅ Aucune soumission en attente de validation</p>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pending.map((soumission: any) => (
          <div key={soumission.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                {soumission.titre || 'Sans titre'}
              </h3>
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
                En attente
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <p className="flex items-center">
                <span className="font-medium mr-2">👤</span>
                {soumission.auteurPrincipal || 'Inconnu'}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">📧</span>
                {soumission.emailAuteur || 'N/A'}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">🔬</span>
                {soumission.domaineRecherche || 'Non spécifié'}
              </p>
              {soumission.dateCreation && (
                <p className="flex items-center">
                  <span className="font-medium mr-2">📅</span>
                  {new Date(soumission.dateCreation).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateStatut(soumission.id, 'ACCEPTEE')}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  ✓ Accepter
                </button>
                <button
                  onClick={() => onUpdateStatut(soumission.id, 'REJETEE')}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  ✗ Rejeter
                </button>
              </div>
              <button
                onClick={() => onUpdateStatut(soumission.id, 'EN_REVISION')}
                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                ✏️ Demander des révisions
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const PublicationsView = ({ publications }: any) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📚 Publications ({publications.length})</h2>
    {publications.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucune publication pour le moment</p>
      </div>
    ) : (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">ID</th>
                <th className="px-6 py-4 text-left font-semibold">Titre</th>
                <th className="px-6 py-4 text-left font-semibold">Auteur</th>
                <th className="px-6 py-4 text-left font-semibold">Domaine</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Vues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {publications.map((pub: any) => (
                <tr key={pub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4">{pub.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md">
                    <div className="truncate">{pub.titre}</div>
                  </td>
                  <td className="px-6 py-4">{pub.auteurPrincipal}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {pub.domaine}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(pub.datePublication).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-teal">{pub.nombreVues}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const EventsView = ({ events, language, onDelete, onAdd }: any) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🎯 Événements ({events.length})</h2>
      <button 
        onClick={onAdd}
        className="px-4 py-2 bg-teal hover:bg-teal/90 text-white rounded-lg transition-colors font-medium"
      >
        ➕ Nouvel événement
      </button>
    </div>

    {events.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucun événement créé</p>
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event: any) => (
          <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {event.title?.[language] || event.title?.fr || 'Sans titre'}
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <p className="flex items-center">
                <span className="mr-2">📅</span>
                {event.date}
              </p>
              <p className="flex items-center">
                <span className="mr-2">📍</span>
                {event.location}
              </p>
              <p className="flex items-center">
                <span className="mr-2">🏷️</span>
                {event.type?.[language] || event.type?.fr}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                ✏️ Modifier
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const UsersView = ({ users, currentUserEmail, updatingUser, onUpdateRole, loading, onReload }: any) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👥 Gestion des utilisateurs ({users.length})</h2>
      {onReload && (
        <button
          onClick={onReload}
          disabled={loading}
          className="px-4 py-2 bg-teal hover:bg-teal/90 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Recharger
        </button>
      )}
    </div>
    
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <p className="text-sm text-blue-700 dark:text-blue-300">
        <strong>ℹ️ Note:</strong> Les nouveaux utilisateurs commencent avec le rôle "Visiteur". 
        Modifiez leur rôle ci-dessous pour leur donner accès aux fonctionnalités.
        L'utilisateur devra se reconnecter pour que le nouveau rôle prenne effet.
      </p>
    </div>

    {loading ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-teal mx-auto mb-4"></div>
        <p className="text-lg text-gray-500 dark:text-gray-400">Chargement des utilisateurs...</p>
      </div>
    ) : users.length === 0 ? (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <p className="text-lg text-gray-500 dark:text-gray-400">Aucun utilisateur enregistré</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Si vous pensez qu'il devrait y avoir des utilisateurs, vérifiez la console pour les erreurs.
        </p>
      </div>
    ) : (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Email</th>
                <th className="px-6 py-4 text-left font-semibold">Nom</th>
                <th className="px-6 py-4 text-left font-semibold">Rôle actuel</th>
                <th className="px-6 py-4 text-left font-semibold">Changer le rôle</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u: any) => (
                <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {u.email}
                    {u.email === currentUserEmail && (
                      <span className="ml-2 px-2 py-1 bg-teal/20 text-teal text-xs rounded-full">Vous</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{u.displayName || '-'}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => onUpdateRole(u.uid, e.target.value as UserRole)}
                      disabled={updatingUser === u.uid || u.email === currentUserEmail}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="VIEWER">{ROLE_LABELS.VIEWER}</option>
                      <option value="STUDENT">{ROLE_LABELS.STUDENT}</option>
                      <option value="STAFF">{ROLE_LABELS.STAFF}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                    {updatingUser === u.uid && (
                      <span className="ml-2 text-xs text-gray-500">⏳</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      disabled={u.email === currentUserEmail}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

export default AdminDashboard;
