'use client';

import React, { useState, useEffect } from 'react';
import { BoostModal } from './BoostModal';
import { Sparkles } from 'lucide-react';

interface BoostTriggerProps {
  userId: string;
  energyLevel: number;
  autoTrigger?: boolean;
}

export function BoostTrigger({ userId, energyLevel, autoTrigger = false }: BoostTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoTrigger) {
      const hasTriggered = sessionStorage.getItem('mystic_boost_triggered');
      if (!hasTriggered) {
        setIsOpen(true);
        sessionStorage.setItem('mystic_boost_triggered', 'true');
      }
    }
  }, [autoTrigger]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mt-2 ml-1"
      >
        <Sparkles className="w-3 h-3" />
        查看更深入解读
      </button>

      <BoostModal 
        userId={userId} 
        energyLevel={energyLevel} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
