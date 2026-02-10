import { OnboardingForm } from '@/components/OnboardingForm';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">建立你的个人决策参考画像</h1>
        <div className="text-slate-500 text-sm mb-8 space-y-1">
          <p>我们将结合你的个人信息，生成每日可执行的穿搭、行动与风险提示建议</p>
          <p className="text-slate-400 text-xs">仅提供参考，不做确定性判断</p>
        </div>
        
        <OnboardingForm />
        
        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <p className="text-[10px] text-slate-300 px-8 leading-relaxed">
            Life Signal 提供的是基于行为倾向与情境分析的参考建议，不构成任何形式的确定性判断。
          </p>
        </div>
      </div>
    </div>
  );
}
