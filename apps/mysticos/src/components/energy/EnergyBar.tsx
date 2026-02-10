import React from 'react';

interface EnergyBarProps {
  level: number;
  size?: 'sm' | 'lg';
}

export function EnergyBar({ level, size = 'lg' }: EnergyBarProps) {
  const height = size === 'lg' ? 'h-4' : 'h-2';
  
  const getColor = (val: number) => {
    if (val >= 70) return 'bg-emerald-500';
    if (val >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5`}>
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getColor(level)}`}
          style={{ width: `${level}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">0%</span>
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{level}%</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">100%</span>
      </div>
    </div>
  );
}
