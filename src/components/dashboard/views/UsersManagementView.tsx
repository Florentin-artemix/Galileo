import React, { useState, useMemo } from 'react';
import { UserDTO } from '../../../services/usersService';
import { UserRole } from '../../../services/authService';
import { ROLE_LABELS } from '../../../constants/roles';
import DataTable, { Column } from '../DataTable';
import StatusBadge from '../StatusBadge';
import { RefreshIcon, TrashIcon } from '../DashboardIcons';

interface UsersManagementViewProps {
  users: UserDTO[];
  currentUserEmail?: string;
  updatingUser: string | null;
  onUpdateRole: (uid: string, newRole: UserRole) => Promise<void>;
  onDeleteUser?: (uid: string) => Promise<void>;
  loading: boolean;
  onReload: () => Promise<void>;
}

const AVAILABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: 'STUDENT', label: ROLE_LABELS.STUDENT },
  { value: 'TEACHER', label: ROLE_LABELS.TEACHER },
  { value: 'RESEARCHER', label: ROLE_LABELS.RESEARCHER },
  { value: 'STAFF', label: ROLE_LABELS.STAFF },
  { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
];

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  currentUserEmail,
  updatingUser,
  onUpdateRole,
  onDeleteUser,
  loading,
  onReload,
}) => {
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'ALL') return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const columns: Column<UserDTO>[] = [
    {
      key: 'email',
      header: 'Utilisateur',
      sortable: true,
      render: (u) => {
        const isSelf = u.email === currentUserEmail;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
              {u.displayName ? u.displayName.charAt(0) : u.email.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  {u.displayName || u.email.split('@')[0]}
                </span>
                {isSelf && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-teal/15 text-teal border border-teal/30">
                    Vous
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Rôle actuel',
      sortable: true,
      render: (u) => <StatusBadge role={u.role as UserRole} size="sm" />,
    },
    {
      key: 'changeRole',
      header: 'Changer le rôle',
      render: (u) => {
        const isSelf = u.email === currentUserEmail;
        const isUpdating = updatingUser === u.uid;

        return (
          <div className="flex items-center gap-2">
            <select
              value={u.role}
              onChange={(e) => onUpdateRole(u.uid, e.target.value as UserRole)}
              disabled={isSelf || isUpdating}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/60 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-teal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {isUpdating && (
              <span className="w-3.5 h-3.5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Informative Header Banner */}
      <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">Gestion des privilèges institutionnels</p>
          <p className="text-blue-700/90 dark:text-blue-300/80">
            Les nouveaux inscrits débutent avec le rôle « Visiteur ». L'attribution d'un rôle supérieur prend effet immédiatement sur les autorisations API du portail.
          </p>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(u) => u.uid || u.email}
        searchPlaceholder="Rechercher par nom ou email..."
        searchKeys={['email', 'displayName', 'role']}
        loading={loading}
        emptyMessage="Aucun utilisateur ne correspond à vos critères."
        filterComponent={
          <div className="flex items-center gap-2">
            <label htmlFor="roleFilterSelect" className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Rôle :
            </label>
            <select
              id="roleFilterSelect"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-teal"
            >
              <option value="ALL">Tous les rôles ({users.length})</option>
              {AVAILABLE_ROLES.map((r) => {
                const count = users.filter((u) => u.role === r.value).length;
                return (
                  <option key={r.value} value={r.value}>
                    {r.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        }
        extraHeaderActions={
          <button
            onClick={() => onReload()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal' : ''}`} />
            <span>Actualiser</span>
          </button>
        }
        actions={
          onDeleteUser
            ? (u) => {
                const isSelf = u.email === currentUserEmail;
                return (
                  <button
                    onClick={() => {
                      if (confirm(`Confirmez-vous la révocation du compte de ${u.email} ?`)) {
                        onDeleteUser(u.uid);
                      }
                    }}
                    disabled={isSelf}
                    className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Révoquer le compte'}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                );
              }
            : undefined
        }
      />
    </div>
  );
};

export default UsersManagementView;

