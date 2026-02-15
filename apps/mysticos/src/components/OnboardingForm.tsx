import { submitProfile } from '@/app/onboarding/actions';

export function OnboardingForm() {
  return (
    <form action={submitProfile} className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">出生日期 *</label>
        <input
          name="birthDate"
          type="date"
          required
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">性别 *</label>
        <select name="gender" required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none">
          <option value="male">男</option>
          <option value="female">女</option>
          <option value="other">其他</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">关注重点 *</label>
        <select name="focus" required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none">
          <option value="career">事业</option>
          <option value="wealth">财富</option>
          <option value="love">情感</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">MBTI (可选)</label>
        <input name="mbti" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none" />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">血型 (可选)</label>
        <input name="bloodType" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none" />
      </div>

      <input type="hidden" name="birthTimePrecision" value="unknown" />
      <input type="hidden" name="birthShichen" value="" />
      <input type="hidden" name="birthTimeRange" value="" />
      <input type="hidden" name="birthTime" value="" />
      <input type="hidden" name="birthPlace" value="" />

      <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">
        完成并进入首页
      </button>
    </form>
  );
}
