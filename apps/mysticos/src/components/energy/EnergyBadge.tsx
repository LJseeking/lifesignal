import React from 'react';
import { Battery, BatteryCharging, BatteryFull, BatteryLow, BatteryMedium } from 'lucide-react';
import Link from 'next/link';
import { EnergyState } from '@/lib/energy/service';

interface EnergyBadgeProps {
  level: number;
  state: EnergyState;
  estimatedDays: number;
}

export function EnergyBadge({ level, state, estimatedDays }: EnergyBadgeProps) {
  const stateColors: Record<EnergyState, string> = {
    high: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    medium: 'text-amber-500 bg-amber-50 border-amber-100',
    low: 'text-rose-500 bg-rose-50 border-rose-100',
    dormant: 'text-slate-400 bg-slate-50 border-slate-100',
  };

  const stateLabels: Record<EnergyState, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    dormant: 'Dormant',
  };

  const Icon = level >= 70 ? BatteryFull : level >= 40 ? BatteryMedium : level > 0 ? BatteryLow : Battery;

  return (
    <Link href="/energy" className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all hover:shadow-sm active:scale-95 ${stateColors[state]}`}>
      <Icon className="w-4 h-4" />
      <div className="flex flex-col items-start leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider">Energy</span>
          <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${level >= 70 ? 'bg-emerald-500' : level >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${level}%` }} 
            />
          </div>
          <span className="text-[10px] font-bold">{stateLabels[state]}</span>
        </div>
        <span className="text-[8px] font-medium opacity-70 mt-0.5">预计维持: {estimatedDays} 天</span>
      </div>
    </Link>
  );
}
