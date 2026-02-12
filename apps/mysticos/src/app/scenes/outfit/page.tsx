import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import OutfitClient from './Client';
import { getAllScenes } from '@/lib/scenes/index';
import { generateUnifiedModel } from '@/lib/engine'; // Added import

import { getEnergyAccount, computeEnergyState } from '@/lib/energy/service';

export default async function OutfitPage() {
  const user = await checkProfileOrRedirect();

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { deviceId },
      include: { profile: true }
    });
  } catch (e) {
    console.warn("DB Error in Outfit:", e);
  }

  // Mock User Fallback
  if (!user) {
    user = {
      id: "mock-user-id",
      deviceId,
      profile: { focus: "wealth", mbti: "INTJ", birthTime: "12:00" }
    } as any;
  }

  if (!user || !user.profile) redirect('/onboarding');

  const account = await getEnergyAccount(user.id);
  const energyState = computeEnergyState(account.energyLevel);

  const today = format(new Date(), 'yyyy-MM-dd');
  const seed = `${today}-${user.deviceId}`;
  let daily = await prisma.dailyResult.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  // 如果 Outfit 页面发现没有 DailyResult，原地生成
  if (!daily) {
    // In-Place Generation Fallback
    try {
      const model = generateUnifiedModel(user.profile as any, today, deviceId);
      const tarotCard = "The Fool";
      const newScenes = getAllScenes(model, tarotCard, seed, energyState);
      
      daily = {
        scenesJSON: JSON.stringify(newScenes),
        energyModel: JSON.stringify(model),
        tarotCard: tarotCard
      } as any;
    } catch (e) {
      console.error("Failed to generate fallback daily in Outfit:", e);
      redirect('/');
    }
  }
  
  let scenes: any = {};
  try {
    scenes = JSON.parse(daily!.scenesJSON);
  } catch (e) {
    console.error("Failed to parse scenesJSON", e);
  }

  let outfit = scenes.outfit || {};
  if (!outfit.recommendedColors || energyState === 'dormant') {
    const model = JSON.parse(daily!.energyModel);
    const newScenes = getAllScenes(model, daily!.tarotCard || "未知", seed, energyState);
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
