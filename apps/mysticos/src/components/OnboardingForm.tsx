'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileSchema } from '@/lib/zod-schemas';
import { submitProfile } from '@/app/onboarding/actions';
import { Clock, Info, Check } from 'lucide-react';

const SHICHEN = [
  { id: 'zi', label: '子时 (23:00-01:00)' },
  { id: 'chou', label: '丑时 (01:00-03:00)' },
  { id: 'yin', label: '寅时 (03:00-05:00)' },
  { id: 'mao', label: '卯时 (05:00-07:00)' },
  { id: 'chen', label: '辰时 (07:00-09:00)' },
  { id: 'si', label: '巳时 (09:00-11:00)' },
  { id: 'wu', label: '午时 (11:00-13:00)' },
  { id: 'wei', label: '未时 (13:00-15:00)' },
  { id: 'shen', label: '申时 (15:00-17:00)' },
  { id: 'you', label: '酉时 (17:00-19:00)' },
  { id: 'xu', label: '戌时 (19:00-21:00)' },
  { id: 'hai', label: '亥时 (21:00-23:00)' },
];

const TIME_RANGES = [
  { id: 'morning', label: '早上 (05:00–09:00)' },
  { id: 'noon', label: '中午 (11:00–13:00)' },
  { id: 'afternoon', label: '下午 (13:00–17:00)' },
  { id: 'night', label: '晚上 (19:00–23:00)' },
];

export function OnboardingForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [precision, setPrecision] = useState<'exact_shichen' | 'approx_range' | 'unknown'>('unknown');
  const [selectedShichen, setSelectedShichen] = useState('');
  const [selectedRange, setSelectedRange] = useState('');

  // 包装为 Server Action 调用，但仍保留 Client 验证
  async function clientAction(formData: FormData) {
    setIsSubmitting(true);
    setErrors({});

    const rawData = { 
      birthDate: formData.get('birthDate'), 
      gender: formData.get('gender'), 
      focus: formData.get('focus'), 
      mbti: formData.get('mbti'), 
      bloodType: formData.get('bloodType'),
      birthTimePrecision: precision,
      birthShichen: precision === 'exact_shichen' ? selectedShichen : '',
      birthTimeRange: precision === 'approx_range' ? selectedRange : '',
    };

    const result = ProfileSchema.safeParse(rawData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // 调用 Server Action，它会负责 redirect
    await submitProfile(result.data);
    // 如果 redirect 生效，下面代码不会执行；如果没生效，手动兜底
    setTimeout(() => { window.location.href = '/tarot'; }, 1000);
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-2xl p-4 mb-2 border border-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
          <Info className="w-3 h-3" />
          完成后你将获得：
        </h3>
        <ul className="text-xs text-slate-600 space-y-2">
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-emerald-500" />
            今日关键词与宜 / 忌参考
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-emerald-500" />
            围绕你关注重点的行动建议
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3 h-3 text-emerald-500" />
            根据当日状态调整的风险提示
          </li>
        </ul>
      </div>

      <form action={clientAction} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">出生日期 *</label>
            <input name="birthDate" type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            <p className="text-[10px] text-slate-400 mt-1.5">用于生成周期性参考，不公开</p>
            {errors.birthDate && <p className="text-red-500 text-[10px] mt-1">{errors.birthDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              出生时间精度 (可选)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'exact_shichen', label: '具体时辰' },
                { id: 'approx_range', label: '大概时段' },
                { id: 'unknown', label: '我不确定' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrecision(opt.id as any)}
                  className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                    precision === opt.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {precision === 'exact_shichen' && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <select 
                  value={selectedShichen}
                  onChange={(e) => setSelectedShichen(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-slate-50"
                >
                  <option value="">请选择出生时辰</option>
                  {SHICHEN.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <p className="text-[9px] text-indigo-500 mt-1.5 font-medium">✨ 完整时辰将构建更精确的决策模型</p>
              </div>
            )}

            {precision === 'approx_range' && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-2">
                  {TIME_RANGES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRange(r.id)}
                      className={`py-2.5 px-3 text-xs rounded-xl border transition-all ${
                        selectedRange === r.id 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold' 
                          : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-400 mt-1.5 font-medium">系统将通过多个可能时辰取交集，提供稳健建议</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">性别 *</label>
            <select name="gender" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none">
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
            {errors.gender && <p className="text-red-500 text-[10px] mt-1">{errors.gender}</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">关注重点 *</label>
            <select name="focus" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none">
              <option value="career">事业</option>
              <option value="wealth">财运</option>
              <option value="love">感情</option>
            </select>
            {errors.focus && <p className="text-red-500 text-[10px] mt-1">{errors.focus}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">MBTI (可选)</label>
            <input name="mbti" placeholder="如 INTJ" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">血型 (可选)</label>
            <select name="bloodType" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none">
              <option value="">未知</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="O">O</option>
              <option value="AB">AB</option>
            </select>
          </div>
        </div>

        {errors.form && <p className="text-red-500 text-sm text-center">{errors.form}</p>}

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-[0.98] mt-4 shadow-xl shadow-indigo-100 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>正在建模...</span>
            </div>
          ) : '查看我的今日建议'}
        </button>
      </form>

      <div className="flex gap-4 justify-center mt-8">
        <a href="/tarot" className="text-xs text-indigo-400 font-bold underline">
          如果未自动跳转，点此进入塔罗
        </a>
      </div>
    </div>
  );
}
