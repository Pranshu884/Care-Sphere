import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export default function Card({ children, className = '', onClick, hoverEffect = false }: CardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-[#13151e] border border-[#1e2130] rounded-[10px] p-5 flex flex-col ${hoverEffect ? 'hover:border-[#1a7fe0]/50 transition-colors cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
