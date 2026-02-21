import React from 'react';

interface ProgressBarProps {
  value: number;
  colorClass?: string;
  heightClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  colorClass = 'bg-primary',
  heightClass = 'h-2'
}) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
      <div 
        className={`${heightClass} rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
};