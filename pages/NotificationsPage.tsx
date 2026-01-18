import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, Notification, NotificationPreferences, NotificationType, PaginatedNotifications } from '../src/services/notificationService';

/**
 * Page Notifications complète
 * Exploite galileo-notification: tous les endpoints
 */
const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadPreferences();
    }
  }, [user]);

  const loadNotifications = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    setIsLoading(true);
    try {
      let data: Notification[];
      if (filter === 'unread') {
        data = await notificationService.getUnreadNotifications();
      } else {
        const paginated: PaginatedNotifications = await notificationService.getMyNotificationsPaginated(currentPage, limit);
        data = paginated.content;
        setHasMore(paginated.number < paginated.totalPages - 1);
      }
      
      if (reset || currentPage === 0) {
        setNotifications(data);
        setPage(0);
      } else {
        setNotifications(prev => [...prev, ...data]);
      }
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError('Impossible de charger les notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Erreur chargement préférences:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Erreur marquage notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Erreur marquage toutes notifications:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Supprimer toutes les notifications ?')) return;
    // Note: deleteAll n'existe pas dans le service - on supprime une par une
    try {
      for (const n of notifications) {
        await notificationService.deleteNotification(n.id);
      }
      setNotifications([]);
    } catch (err) {
      console.error('Erreur suppression toutes notifications:', err);
    }
  };

  const handleUpdatePreference = async (type: NotificationType, enabled: boolean) => {
    try {
      if (!enabled) {
        await notificationService.muteType(type);
      } else {
        await notificationService.unmuteType(type);
      }
      setPreferences(prev => prev ? {
        ...prev,
        mutedTypes: enabled 
          ? prev.mutedTypes.filter(t => t !== type)
          : [...prev.mutedTypes, type]
      } : null);
    } catch (err) {
      console.error('Erreur mise à jour préférences:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications(true);
    }
  }, [filter]);

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'PUBLICATION_APPROVED': '✅',
      'PUBLICATION_REJECTED': '❌',
      'PUBLICATION_PENDING': '📝',
      'NEW_PUBLICATION': '📄',
      'NEW_COMMENT': '💬',
      'SYSTEM': '📢',
      'WELCOME': '👋',
      'ROLE_CHANGED': '🎭'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      'PUBLICATION_APPROVED': 'text-green-500',
      'PUBLICATION_REJECTED': 'text-red-500',
      'PUBLICATION_PENDING': 'text-yellow-500',
      'NEW_PUBLICATION': 'text-blue-500',
      'NEW_COMMENT': 'text-purple-500',
      'SYSTEM': 'text-gray-500',
      'WELCOME': 'text-blue-500',
      'ROLE_CHANGED': 'text-indigo-500'
    };
    return colors[type] || 'text-gray-500';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return date.toLocaleDateString('fr-FR');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationTypes: { type: NotificationType; label: string; icon: string }[] = [
    { type: 'PUBLICATION_APPROVED', label: 'Publication approuvée', icon: '✅' },
    { type: 'PUBLICATION_REJECTED', label: 'Publication rejetée', icon: '❌' },
    { type: 'REVISION_REQUESTED', label: 'Révision demandée', icon: '📝' },
    { type: 'NEW_PUBLICATION', label: 'Nouvelle publication', icon: '📄' },
    { type: 'NEW_COMMENT', label: 'Nouveau commentaire', icon: '💬' },
    { type: 'SYSTEM_ANNOUNCEMENT', label: 'Système', icon: '📢' }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
            Connectez-vous pour voir vos notifications
          </h2>
          <a href="/auth" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-sm bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Préférences"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Préférences panel */}
        {showPreferences && preferences && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Préférences de notification
            </h3>
            <div className="space-y-3">
              {notificationTypes.map(({ type, label, icon }) => (
                <label key={type} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <span>{icon}</span>
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={!preferences.mutedTypes.includes(type)}
                    onChange={(e) => handleUpdatePreference(type, e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Filtres et actions */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Non lues ({unreadCount})
            </button>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              >
                Tout marquer comme lu
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                Tout supprimer
              </button>
            )}
          </div>
        </div>

        {/* Liste des notifications */}
        {isLoading && page === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => loadNotifications(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all ${
                  !notification.read ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                <div className="p-4 flex items-start gap-4">
                  <div className={`text-2xl ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`text-base font-medium ${
                          notification.read 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </p>
                      </div>
                      
                      <span className="flex-shrink-0 text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    
                    {notification.link && (
                      <a
                        href={notification.link}
                        className="mt-2 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Voir les détails →
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Marquer comme lu
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
            
            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    setPage(p => p + 1);
                    loadNotifications();
                  }}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {isLoading ? 'Chargement...' : 'Charger plus'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
