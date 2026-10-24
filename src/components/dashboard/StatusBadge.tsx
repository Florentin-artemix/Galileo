import React from 'react';
import { UserRole } from '../../services/authService';
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/roles';

export type SubmissionStatusType = 
  | 'EN_ATTENTE' 
  | 'PENDING' 
  | 'ACCEPTEE' 
  | 'ACCEPTED' 
  | 'REJETEE' 
  | 'REJECTED' 
  | 'EN_REVISION' 
  | 'ANALYZING' 
  | 'UNDER_REVIEW';

export type DocumentProcessingStatusType = 
  | 'COMPLETED' 
  | 'PROCESSING' 
  | 'RECEIVED' 
  | 'FAILED';

interface StatusBadgeProps {
  status?: SubmissionStatusType | string;
  role?: UserRole;
  docStatus?: DocumentProcessingStatusType | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  role,
  docStatus,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  // Role Badge
  if (role) {
    const label = ROLE_LABELS[role] || role;
    const colorClasses = ROLE_COLORS[role] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
        <span>{label}</span>
      </span>
    );
  }

  // Document Processing Status Badge
  if (docStatus) {
    let label = 'Document reçu';
    let style = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    let pulse = false;

    switch (docStatus) {
      case 'COMPLETED':
        label = 'Indexé (1024D pgvector)';
        style = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        break;
      case 'PROCESSING':
        label = 'Vectorisation Qwen...';
        style = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        pulse = true;
        break;
      case 'FAILED':
        label = 'Échec analyse';
        style = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
        break;
      case 'RECEIVED':
      default:
        label = 'Document reçu';
        style = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${style} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? 'animate-ping' : ''}`}></span>
        <span>{label}</span>
      </span>
    );
  }

  // Submission Status Badge
  if (status) {
    let label = status;
    let style = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';

    switch (status) {
      case 'ACCEPTEE':
      case 'ACCEPTED':
        label = 'Acceptée';
        style = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        break;
      case 'REJETEE':
      case 'REJECTED':
        label = 'Rejetée';
        style = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
        break;
      case 'EN_REVISION':
        label = 'En révision';
        style = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        break;
      case 'ANALYZING':
        label = 'En cours d\'analyse';
        style = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        break;
      case 'UNDER_REVIEW':
        label = 'Sous revue';
        style = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        break;
      case 'EN_ATTENTE':
      case 'PENDING':
      default:
        label = 'En attente';
        style = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${style} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
        <span>{label}</span>
      </span>
    );
  }

  return null;
};

export default StatusBadge;

