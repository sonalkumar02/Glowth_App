// Update streak when scan is completed
async function updateStreak() {
  const userId = await getUserId();
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];

  // Get current streak
  const { data: streaks, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching streak:', error);
    return;
  }

  let newStreak = 1;
  let lastScanned = null;

  if (streaks) {
    lastScanned = new Date(streaks.last_scanned);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastScanned.toDateString() === yesterday.toDateString()) {
      newStreak = streaks.streak_count + 1;
    }

    await supabase
      .from('streaks')
      .update({
        streak_count: newStreak,
        last_scanned: today
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('streaks')
      .insert({
        user_id: userId,
        streak_count: 1,
        last_scanned: today
      });
  }

  console.log('Streak updated to:', newStreak);
}

// Update skin score & give coins
async function updateSkinScore(score) {
  const userId = await getUserId();
  if (!userId) return;

  const coinsEarned = Math.floor(score / 10);

  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching stats:', error);
    return;
  }

  if (data) {
    await supabase
      .from('user_stats')
      .update({
        skin_score: score,
        glow_coins: data.glow_coins + coinsEarned
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        skin_score: score,
        glow_coins: coinsEarned
      });
  }

  console.log(`Updated skin score to ${score}, earned ${coinsEarned} GlowCoins`);
}

// Mark a goal as completed
async function completeGoal(goalName) {
  const userId = await getUserId();
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];

  const { data: existing, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_name', goalName)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('Error checking goal:', error);
    return;
  }

  if (existing) {
    console.log('Goal already completed today.');
    return;
  }

  await supabase.from('goals').insert({
    user_id: userId,
    goal_name: goalName,
    is_completed: true,
    date: today
  });

  console.log(`Goal "${goalName}" marked as completed`);
}

try {
  if (typeof formData !== 'undefined') {
    fetch('/analyze', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (typeof displayAnalysisResults === 'function') {
          displayAnalysisResults(data);
        }
        if (typeof updateStreak === 'function') updateStreak();
        updateSkinScore(85);
        completeGoal('daily-scan');
      })
      .catch(() => {});
  }
} catch (_) {}


    
// Gamification System
class GamificationSystem {
  constructor() {
    this.streak = 0;
    this.glowCoins = 0;
    this.glowScore = 0;
    this.dailyXP = 0;
    this.hydrationXP = 0;
    this.hydrationPoints = 0;
    this.dailyQuests = [];
    this.achievements = [];
    
    // Achievement tracking
    this.achievementProgress = {
      firstScan: { current: 0, max: 1, completed: false },
      hydrationHero: { current: 0, max: 7, completed: false },
      protectionPro: { current: 0, max: 10, completed: false },
      streakMaster: { current: 0, max: 7, completed: false }
    };

    this.initializeSystem();
  }

  initializeSystem() {
    this.streak = parseInt(localStorage.getItem('dailyStreak')) || 0;
    this.glowCoins = parseInt(localStorage.getItem('glowCoins')) || 0;
    this.glowScore = parseInt(localStorage.getItem('glowScore')) || 0;
    this.dailyXP = parseInt(localStorage.getItem('dailyXP')) || 0;
    this.hydrationXP = parseInt(localStorage.getItem('hydrationXP')) || 0;
    this.hydrationPoints = parseInt(localStorage.getItem('hydrationPoints')) || 0;

    try {
      this.dailyQuests = JSON.parse(localStorage.getItem('dailyQuests')) || [];
      this.achievements = JSON.parse(localStorage.getItem('achievements')) || [];
      this.achievementProgress = JSON.parse(localStorage.getItem('achievementProgress')) || this.achievementProgress;
    } catch {
      this.dailyQuests = [];
      this.achievements = [];
      this.achievementProgress = {
        firstScan: { current: 0, max: 1, completed: false },
        hydrationHero: { current: 0, max: 7, completed: false },
        protectionPro: { current: 0, max: 10, completed: false },
        streakMaster: { current: 0, max: 7, completed: false }
      };
    }

    this.updateUI();
    this.startDailyReset();
    this.updateStreak();
  }

  addGlowCoin(amount = 1) {
    this.glowCoins += amount;
    this.saveToLocal();
    this.updateUI();
  }
  

  async addDailyXP(amount, source) {
    this.dailyXP += amount;
    if (this.dailyXP >= 10) {
      const coins = Math.floor(this.dailyXP / 10);
      this.dailyXP = this.dailyXP % 10;
      this.glowCoins += coins;
      this.showCoinAnimation(coins);
    }
    this.saveToLocal();
    this.updateUI();
  }

  async addHydrationXP(amount, source) {
    this.hydrationXP += amount;
    if (this.hydrationXP >= 10) {
      const points = Math.floor(this.hydrationXP / 10);
      this.hydrationXP = this.hydrationXP % 10;
      this.hydrationPoints += points;
    }
    this.saveToLocal();
    this.updateUI();
  }

  addHydrationPoint(amount = 1) {
    this.hydrationPoints += amount;
    this.updateHydrationAchievement();
    this.saveToLocal();
    this.updateUI();
  }

  updateStreak() {
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem('lastActiveDate');
    let streak = parseInt(localStorage.getItem('dailyStreak')) || 0;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastActive === yesterday.toDateString()) {
      streak += 1;
    } else if (lastActive !== today) {
      streak = 1;
    }

    localStorage.setItem('lastActiveDate', today);
    localStorage.setItem('dailyStreak', streak.toString());
    this.streak = streak;

    // Update streak master achievement
    this.updateAchievement('streakMaster', Math.min(streak, 7));

    this.saveToLocal();
    this.updateUI();
  }

  updateAchievement(achievementKey, currentValue) {
    if (this.achievementProgress[achievementKey]) {
      this.achievementProgress[achievementKey].current = Math.min(currentValue, this.achievementProgress[achievementKey].max);
      this.achievementProgress[achievementKey].completed = this.achievementProgress[achievementKey].current >= this.achievementProgress[achievementKey].max;
      this.saveToLocal();
    }
  }

  markFirstScan() {
    this.updateAchievement('firstScan', 1);
  }

  updateHydrationAchievement() {
    this.updateAchievement('hydrationHero', Math.min(this.hydrationPoints, 7));
  }

  updateProtectionAchievement() {
    // This will be called when pollution is checked
    const current = this.achievementProgress.protectionPro.current;
    this.updateAchievement('protectionPro', current + 1);
  }

  completeQuest(questId) {
    const quest = this.dailyQuests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    quest.completed = true;
    this.addDailyXP(quest.reward || 1, 'quest');
    this.glowScore = Math.min(100, this.glowScore + (quest.score_increase || 0));
    this.saveToLocal();
    this.updateUI();
  }
  
  saveToLocal() {
    localStorage.setItem('dailyXP', this.dailyXP);
    localStorage.setItem('hydrationXP', this.hydrationXP);
    localStorage.setItem('hydrationPoints', this.hydrationPoints);
    localStorage.setItem('glowCoins', this.glowCoins);
    localStorage.setItem('glowScore', this.glowScore);
    localStorage.setItem('dailyStreak', this.streak);
    localStorage.setItem('dailyQuests', JSON.stringify(this.dailyQuests));
    localStorage.setItem('achievements', JSON.stringify(this.achievements));
    localStorage.setItem('achievementProgress', JSON.stringify(this.achievementProgress));
  }

  updateUI() {
    // update streak
    const streakEl = document.querySelector('.daily-streak-count');
    if (streakEl) streakEl.textContent = this.streak;

    const profileStreakEl = document.getElementById('profile-streak-count');
    if (profileStreakEl) profileStreakEl.textContent = this.streak;

    // update glow coins
    const coinEl = document.querySelector('.glow-coin-count');
    if (coinEl) coinEl.textContent = this.glowCoins;

    const profileCoinsEl = document.getElementById('profile-glow-coins');
    if (profileCoinsEl) profileCoinsEl.textContent = this.glowCoins;

    // update hydration count
    const waterEl = document.querySelector('.hydration-count');
    if (waterEl) waterEl.textContent = this.hydrationPoints;

    const profileHydrationEl = document.getElementById('profile-hydration-points');
    if (profileHydrationEl) profileHydrationEl.textContent = this.hydrationPoints;

    // update glow score
    const scoreEl = document.querySelector('.glow-score');
    if (scoreEl) scoreEl.textContent = `Glow Score: ${this.glowScore}`;

    // progress bar
    const bar = document.querySelector('.progress-bar-fill');
    if (bar) bar.style.width = `${this.glowScore}%`;

    // Update achievement progress
    this.updateAchievementUI();

    // ✅ New: also trigger progress bars and chest animation
    if (typeof window.updateGoalBars === 'function') {
      window.updateGoalBars();
    }
  }

  updateAchievementUI() {
    // First Scan (always completed if any scan was done)
    const firstScanEl = document.getElementById('achievement-first-scan-current');
    if (firstScanEl) firstScanEl.textContent = this.achievementProgress.firstScan.completed ? '1' : '0';

    // Hydration Hero
    const hydrationCurrentEl = document.getElementById('achievement-hydration-current');
    const hydrationBarEl = document.getElementById('achievement-hydration-bar');
    if (hydrationCurrentEl) hydrationCurrentEl.textContent = this.achievementProgress.hydrationHero.current;
    if (hydrationBarEl) {
      const percentage = (this.achievementProgress.hydrationHero.current / this.achievementProgress.hydrationHero.max) * 100;
      hydrationBarEl.style.width = `${percentage}%`;
    }

    // Protection Pro
    const protectionCurrentEl = document.getElementById('achievement-protection-current');
    const protectionBarEl = document.getElementById('achievement-protection-bar');
    if (protectionCurrentEl) protectionCurrentEl.textContent = this.achievementProgress.protectionPro.current;
    if (protectionBarEl) {
      const percentage = (this.achievementProgress.protectionPro.current / this.achievementProgress.protectionPro.max) * 100;
      protectionBarEl.style.width = `${percentage}%`;
    }

    // Streak Master
    const streakCurrentEl = document.getElementById('achievement-streak-current');
    const streakBarEl = document.getElementById('achievement-streak-bar');
    if (streakCurrentEl) streakCurrentEl.textContent = this.achievementProgress.streakMaster.current;
    if (streakBarEl) {
      const percentage = (this.achievementProgress.streakMaster.current / this.achievementProgress.streakMaster.max) * 100;
      streakBarEl.style.width = `${percentage}%`;
    }
  }

  showCoinAnimation(count) {
    const coinContainer = document.createElement('div');
    coinContainer.className = 'fixed inset-0 z-50 pointer-events-none';
    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className = 'glow-coin animate-float absolute text-3xl';
      coin.style.left = `${Math.random() * 100}vw`;
      coin.style.top = '100vh';
      coin.textContent = '✨';
      coinContainer.appendChild(coin);
    }
    document.body.appendChild(coinContainer);
    setTimeout(() => document.body.removeChild(coinContainer), 3000);
  }

  startDailyReset() {
    const now = new Date();
    const reset = new Date();
    reset.setHours(24, 0, 0, 0);
    const timeout = reset.getTime() - now.getTime();
    setTimeout(() => {
      this.dailyXP = 0;
      this.hydrationXP = 0;
      this.saveToLocal();
      this.updateUI();
      this.startDailyReset();
    }, timeout);
  }

  completePlan(planId) {
    // If already completed once, do nothing
    if (localStorage.getItem(`${planId}-completed`) === 'true') {
      return;
    }

    // Mark all tasks done visually
    const tasks = document.querySelectorAll(`#${planId} .task`);
    tasks.forEach(task => task.classList.add('done', 'line-through', 'text-green-600'));

    // Reward based on plan
    if (planId === 'am-tasks' || planId === 'pm-tasks') {
      this.addGlowCoin(1);
    } else if (planId === 'hydration-tasks') {
      this.addHydrationPoint(1);
    }

    // Save state (set both generic and legacy flags)
    localStorage.setItem(`${planId}-completed`, 'true');
    if (planId === 'am-tasks') localStorage.setItem('am-tasks-completed', 'true');
    if (planId === 'pm-tasks') localStorage.setItem('pm-tasks-completed', 'true');
    if (planId === 'hydration-tasks') localStorage.setItem('hydration-tasks-completed', 'true');

    // Optional: small XP for completing both AM and PM
    const amDone = localStorage.getItem('am-tasks-completed') === 'true' || planId === 'am-tasks';
    const pmDone = localStorage.getItem('pm-tasks-completed') === 'true' || planId === 'pm-tasks';
    if (amDone && pmDone) {
      this.addDailyXP(1, 'routine');
    }

    this.updateUI();
  }  

  checkAndRewardPlan(planId) {
    // Prevent duplicate reward
    if (localStorage.getItem(`${planId}-rewarded`) === 'true') return;

    const plan = document.getElementById(planId);
    if (!plan) return;
    const tasks = plan.querySelectorAll('.task');
    if (tasks.length === 0) return;
    const allDone = Array.from(tasks).every(t => t.classList.contains('done') || t.classList.contains('line-through'));
    if (!allDone) return;

    if (planId === 'am-tasks' || planId === 'pm-tasks') {
      this.addGlowCoin(1);
    } else if (planId === 'hydration-tasks') {
      this.addHydrationPoint(1);
    }
    localStorage.setItem(`${planId}-completed`, 'true');
    localStorage.setItem(`${planId}-rewarded`, 'true');
    if (planId === 'am-tasks') localStorage.setItem('am-tasks-completed', 'true');
    if (planId === 'pm-tasks') localStorage.setItem('pm-tasks-completed', 'true');
    if (planId === 'hydration-tasks') localStorage.setItem('hydration-tasks-completed', 'true');
    this.updateUI();
  }
}

// Initialize gamification system
const gamification = new GamificationSystem();


window.completeTask = function(planId) {
  gamification.completePlan(planId);
};

window.gamification = gamification;

// Convenience wrappers used elsewhere in the app
window.addXP = function(amount) { gamification.addDailyXP(Number(amount) || 1, 'ui'); };
window.addHydrationXP = function(amount) { gamification.addHydrationXP(Number(amount) || 1, 'ui'); };
window.awardProductXP = function(price) {
  const p = Number(price) || 0;
  const xpAmount = p > 1000 ? 10 : p > 500 ? 5 : 1;
  gamification.addDailyXP(xpAmount, 'purchase');
};

// No module export; exposed via window.gamification