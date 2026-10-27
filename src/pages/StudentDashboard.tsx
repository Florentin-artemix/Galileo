import React, { useEffect, useState, useCallback } from 'react';
import { soumissionsService, publicationsService, PublicationDTO } from '../services/publicationsService';
import { documentsService } from '../services/documentsService';
import { useAuth } from '../contexts/AuthContext';
import ProfileCard from '../components/ProfileCard';
import DashboardLayout, { DashboardNavItem } from '../components/dashboard/DashboardLayout';
import OverviewView from '../components/dashboard/views/OverviewView';
import StudentSubmissionsView, { StudentSubmission } from '../components/dashboard/views/StudentSubmissionsView';
import PublicationsManagementView from '../components/dashboard/views/PublicationsManagementView';
import {
  DashboardIcon,
  SubmissionsIcon,
  PublicationsIcon,
  ProfileIcon,
} from '../components/dashboard/DashboardIcons';

const StudentDashboard: React.FC = () => {
  const { user, role } = useAuth();

  const [tab, setTab] = useState<string>('dashboard');
  const [soumissions, setSoumissions] = useState<StudentSubmission[]>([]);
  const [publications, setPublications] = useState<PublicationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [soumissionsData, pubData] = await Promise.all([
        soumissionsService.getMesSoumissions().catch(() => []),
        publicationsService.getPublications(0, 100).catch(() => ({ content: [] })),
      ]);

      setSoumissions(soumissionsData || []);
      setPublications(pubData.content || []);
    } catch (e: any) {
      console.error(e);
      setError('Impossible de synchroniser vos soumissions et publications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment retirer cette soumission ?')) return;

    setDeletingId(id);
    try {
      await soumissionsService.retirerSoumission(id);
      setSoumissions((prev) => prev.filter((s) => s.id !== id));
      setSuccess('Soumission retirée avec succès');
      setTimeout(() => setSuccess(null), 3500);
    } catch (e) {
      setError('Impossible de retirer cette soumission');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRetry = async (documentId?: number, pubId?: number) => {
    const targetId = documentId || pubId;
    if (!targetId) return;

    setRetryingId(targetId);
    try {
      if (documentId) {
        await documentsService.retryDocumentProcessing(documentId);
      } else if (pubId) {
        await documentsService.retryPublicationProcessing(pubId);
      }
      setSuccess('Analyse et indexation vectorielle du document relancée !');
      setTimeout(() => setSuccess(null), 3500);
      await loadData();
    } catch (e: any) {
      setError('Erreur lors de la relance du traitement du document');
    } finally {
      setRetryingId(null);
    }
  };

  const enAttenteCount = soumissions.filter(
    (s) => s.statut === 'EN_ATTENTE' || s.statut === 'PENDING'
  ).length;

  const accepteesCount = soumissions.filter(
    (s) => s.statut === 'ACCEPTEE' || s.statut === 'ACCEPTED'
  ).length;

  const rejeteesCount = soumissions.filter(
    (s) => s.statut === 'REJETEE' || s.statut === 'REJECTED'
  ).length;

  const navItems: DashboardNavItem[] = [
    { id: 'dashboard', label: 'Vue d\'ensemble', icon: <DashboardIcon /> },
    { id: 'soumissions', label: 'Mes soumissions', icon: <SubmissionsIcon />, badge: enAttenteCount },
    { id: 'publications', label: 'Publications', icon: <PublicationsIcon /> },
    { id: 'profile', label: 'Mon Profil', icon: <ProfileIcon /> },
  ];

  return (
    <DashboardLayout
      title="Espace Académique & Recherche"
      subtitle="Soumission d'articles, suivi d'évaluation et indexation IA pgvector"
      roleBadge={role}
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
            totalSoumissions: soumissions.length,
            enAttente: enAttenteCount,
            acceptees: accepteesCount,
            rejetees: rejeteesCount,
            totalPublications: publications.length,
          }}
          pending={soumissions.filter((s) =>
            ['EN_ATTENTE', 'PENDING', 'ANALYZING', 'UNDER_REVIEW', 'EN_REVISION'].includes(
              String(s.statut || '').toUpperCase()
            )
          )}
          publications={publications}
          onNavigateTab={setTab}
          role={role}
          userId={user?.uid}
        />
      )}

      {tab === 'soumissions' && (
        <StudentSubmissionsView
          soumissions={soumissions}
          onDelete={handleDelete}
          deletingId={deletingId}
          onRetry={handleRetry}
          retryingId={retryingId}
          loading={loading}
        />
      )}

      {tab === 'publications' && (
        <PublicationsManagementView publications={publications} loading={loading} />
      )}

      {tab === 'profile' && (
        <div className="max-w-3xl mx-auto">
          <ProfileCard />
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
