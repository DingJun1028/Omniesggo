import { useState, useCallback } from "react";
import { syncGamificationState } from "@/app/actions/gamification";

export type Quest = {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
  type: "daily" | "weekly" | "epic";
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  iconName: "Target" | "Flame" | "Shield" | "Star";
  unlocked: boolean;
};

const INITIAL_QUESTS: Quest[] = [
  { id: "q1", title: "完成 Scope 1 碳排放數據登錄", xpReward: 50, completed: false, type: "daily" },
  { id: "q2", title: "修復 3 個系統漏洞 (Entropy)", xpReward: 100, completed: false, type: "daily" },
  { id: "q3", title: "連續 5 天登錄 ESG 儀表板", xpReward: 300, completed: false, type: "weekly" },
];

const INITIAL_BADGES: Badge[] = [
  { id: "b1", name: "減碳先鋒", description: "首次登錄碳排放數據", iconName: "Target", unlocked: true },
  { id: "b2", name: "狂熱登入者", description: "連續登入超過 7 天", iconName: "Flame", unlocked: true },
  { id: "b3", name: "資安守護者", description: "成功觸發 10 次 Hash Lock", iconName: "Shield", unlocked: false },
  { id: "b4", name: "全通之心", description: "完成所有的任務與架構重構", iconName: "Star", unlocked: false },
];

export function useOmniGamification() {
  const [level, setLevel] = useState(12);
  const [xp, setXp] = useState(850);
  const [streakDays, setStreakDays] = useState(7); // 連續登入天數
  const xpNeeded = 1000;
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
  
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastGainedXp, setLastGainedXp] = useState(0);

  const completeQuest = useCallback(async (id: string, reward: number) => {
    setQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: true } : q))
    );
    
    setLastGainedXp(reward);
    let newLevel = level;
    let finalXp = xp + reward;
    
    setXp((prev) => {
      const updatedXp = prev + reward;
      if (updatedXp >= xpNeeded) {
        newLevel = level + 1;
        setLevel(newLevel);
        setShowLevelUp(true);
        setTimeout(() => setShowLevelUp(false), 3000);
        finalXp = updatedXp - xpNeeded;
        return finalXp;
      }
      return updatedXp;
    });
    
    try {
      const result = await syncGamificationState("u4", {
        level: newLevel,
        xp: finalXp,
        questsCompleted: [id]
      });
      if (result.success) {
        console.log(`[5T Protocol] Gamification state synced. Hash Lock: ${result.hashLock}`);
      }
    } catch (error) {
      console.error("Failed to sync gamification state", error);
    }
  }, [level, xp, xpNeeded]);

  const dismissLevelUp = () => setShowLevelUp(false);

  return {
    level,
    xp,
    xpNeeded,
    streakDays,
    quests,
    badges,
    showLevelUp,
    lastGainedXp,
    completeQuest,
    dismissLevelUp
  };
}
