import { type ReactNode } from 'react';

interface SectionHeaderProps {
  title: string | ReactNode;
  colorHex?: string;
  className?: string;
}

export default function SectionHeader({ title, colorHex = '#1a7fe0', className = '' }: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-2 mb-3 ${className}`}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
      <h2 className="text-[13px] font-medium text-[#8b92a5]">{title}</h2>
    </div>
  );
}
