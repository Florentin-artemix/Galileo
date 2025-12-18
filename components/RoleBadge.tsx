import React from 'react';
import { UserRole } from '../src/services/authService';
import { ROLE_LABELS, ROLE_COLORS } from '../src/constants/roles';

interface RoleBadgeProps {
  role: UserRole;
  showDescription?: boolean;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showDescription = false, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-lg border ${ROLE_COLORS[role]} ${className}`}>
      {ROLE_LABELS[role]}
    </span>
  );
};

export default RoleBadge;
