import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  trend,
  onClick,
  loading = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700/80 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-teal/50 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {value}
              </span>
            )}
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-teal/10 text-teal dark:bg-teal/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className={`mt-1 text-xs font-medium inline-flex items-center gap-1 ${
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

