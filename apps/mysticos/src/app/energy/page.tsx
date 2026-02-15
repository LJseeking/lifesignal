import { ChevronLeft, Info, BatteryCharging, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import { computeEnergyState, estimateRuntimeDays, EnergyState } from '@/lib/energy/service';
import { EnergyBar } from '@/components/energy/EnergyBar';
import { ChargeOptions } from '@/components/energy/ChargeOptions';
import { getUserWithProfileOrRedirect } from '@/lib/user';

export default async function EnergyPage() {
  const user = await getUserWithProfileOrRedirect();

  // 如果是 Mock 用户，可能没有 energyAccount，需要兜底
  const account = user.energyAccount || { energyLevel: 50 };
  const state = computeEnergyState(account.energyLevel);
  const runtimeDays = estimateRuntimeDays(account.energyLevel);

  const stateLabels: Record<EnergyState, string> = {
    high: '运行效率：极佳',
    medium: '运行效率：平衡',
    low: '运行效率：低电量',
    dormant: '运行效率：已休眠',
  };

  const stateColors: Record<EnergyState, string> = {
    high: 'text-emerald-600',
    medium: 'text-amber-600',
    low: 'text-rose-600',
    dormant: 'text-slate-500',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <div className="px-6 py-8 max-w-lg mx-auto">
        <Link href="/" className="flex items-center text-slate-500 mb-8 hover:text-indigo-600 transition-colors w-fit">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">返回总览</span>
        </Link>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-sm">
            <BatteryCharging className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Signal Energy</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">管理 Signal 的运行能量</p>
          </div>
        </div>

        {/* 当前运行状态模块 */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm mb-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">当前状态</p>
              <h2 className={`text-xl font-black ${stateColors[state]}`}>{stateLabels[state]}</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">预计可维持</p>
              <div className="flex items-center gap-1.5 justify-end">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-xl font-black text-indigo-600">{runtimeDays} 天</span>
              </div>
            </div>
          </div>

          <EnergyBar level={account.energyLevel} />
        </div>

        {/* 能量如何被使用模块 */}
        <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Zap className="w-32 h-32 rotate-12 fill-white" />
          </div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Info className="w-4 h-4" />
            能量如何被使用
          </h3>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            {[
              { label: '每日状态分析', icon: '🧠' },
              { label: '连续记忆维护', icon: '💾' },
              { label: '模式识别计算', icon: '📡' },
              { label: '关键时刻提醒', icon: '🎯' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-bold text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 充能操作区 */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1 ml-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">为 SIGNAL 充能</h3>
            <p className="text-[10px] text-slate-400 font-medium">提升运行能量，开启更深度的 AI 理解与洞察</p>
          </div>
          
          <ChargeOptions userId={user.id} currentLevel={account.energyLevel} />
          
          <Link 
            href="/"
            className="w-full py-4 text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
          >
            稍后再说
          </Link>
        </div>

        {/* 休眠说明 */}
        <p className="mt-12 text-center text-[10px] text-slate-400 px-10 leading-relaxed font-medium">
          当运行能量耗尽时，Signal 将进入休眠状态，暂停对你状态的分析。你可以随时为其充能，恢复运行。
        </p>
      </div>
    </div>
  );
}
