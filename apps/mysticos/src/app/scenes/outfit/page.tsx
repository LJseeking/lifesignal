import { prisma } from '@/lib/prisma';
import { getDeviceId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import OutfitClient from './Client';
import { getAllScenes } from '@/lib/scenes/index';

import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';

export default async function OutfitPage() {
  const deviceId = getDeviceId();
  // 注意：在实际生产中，这里应该从 DB 或 Session 获取订阅状态
  // 为了预览效果，我们假设已订阅（或者由上层 Home 组件控制访问）
  const isSubscribed = true; 
  
  if (!deviceId) redirect('/onboarding');

  const user = await prisma.user.findUnique({
    where: { deviceId },
    include: { profile: true }
  });

  if (!user || !user.profile) redirect('/onboarding');

  const account = await getEnergyAccount(user.id);
  const energyState = computeEnergyState(account.energyLevel);

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${deviceId}`;
  const daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  if (!daily) redirect('/');
  
  // 最小数据契约解析与兜底
  let scenes: any = {};
  try {
    scenes = JSON.parse(daily.scenesJSON);
  } catch (e) {
    console.error("Failed to parse scenesJSON", e);
  }

  // 如果数据结构过旧（缺少 recommendedColors），实时重新生成并更新
  let outfit = scenes.outfit || {};
  if (!outfit.recommendedColors || energyState === 'dormant') {
    const model = JSON.parse(daily.energyModel);
    const newScenes = getAllScenes(model, daily.tarotCard || "未知", seed, energyState);
    outfit = newScenes.outfit;
  }

  const clientData = {
    summary: outfit.description || "今日适合保持低调，以舒适材质为主。",
    recommendedColors: outfit.recommendedColors || ["灰色", "米色"],
    avoidColors: outfit.avoidColors || ["鲜红色"],
    materials: outfit.materials || ["棉质"],
    accessories: outfit.accessories || ["无"],
    notes: outfit.notes || "根据当日能量模型生成的平衡建议。"
  };

  return <OutfitClient data={clientData} />;
}
