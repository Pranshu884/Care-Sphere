import { type ReactNode } from 'react';
import Card from './Card';
import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  icon?: LucideIcon;
  iconColorClass?: string; // e.g. text-[#1a7fe0]
  iconBgClass?: string;    // e.g. bg-[#1a7fe0]/10
  statusText?: string;     // e.g. "Pending", "Active"
  statusColorClass?: string;
  statusBgClass?: string;
  emptyStateText?: string;
  actionText?: string;
  actionLink?: string;
  actionColorClass?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColorClass = 'text-white',
  iconBgClass = 'bg-white/10',
  statusText,
  statusColorClass = 'text-white',
  statusBgClass = 'bg-white/10',
  emptyStateText = 'No data',
  actionText,
  actionLink,
  actionColorClass = 'text-[#1a7fe0]'
}: StatCardProps) {
  const hasData = value !== 0 && value !== '0' && value !== '-' && value !== '';

  return (
    <Card className={`h-[140px] hover:border-[${iconColorClass.replace('text-', '')}]/50`} hoverEffect={false}>
      <div className="flex justify-between items-start mb-auto">
        {Icon ? (
          <div className={`w-10 h-10 rounded-[6px] ${iconBgClass} flex items-center justify-center ${iconColorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-10 h-10" />
        )}
        {hasData && statusText ? (
          <div className={`px-3 py-1 rounded-full ${statusBgClass} ${statusColorClass} text-[11px] font-medium`}>
            {statusText}
          </div>
        ) : !hasData ? (
          <div className="px-3 py-1 rounded-full bg-white/5 text-[#8b92a5] text-[11px] font-medium">
            {emptyStateText}
          </div>
        ) : null}
      </div>
      
      {hasData ? (
        <div>
          <p className="text-[22px] font-medium text-white/90 leading-none mb-1">{value}</p>
          <p className="text-[12px] text-[#8b92a5]">{title}</p>
        </div>
      ) : (
        <div>
          <p className="text-[22px] font-medium text-white/40 leading-none mb-1">—</p>
          {actionLink && actionText ? (
            <Link to={actionLink} className={`text-[12px] ${actionColorClass} hover:underline flex items-center gap-1 group`}>
              {actionText} <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <p className="text-[12px] text-[#8b92a5]">{title}</p>
          )}
        </div>
      )}
    </Card>
  );
}
