/**
 * Storage Module
 * localStorage wrapper for progress persistence
 */

const STORAGE_KEY = 'libregto-progress';

// Default progress state
const DEFAULT_PROGRESS = {
  version: 1,
  stages: {
    foundations: {
      unlocked: true,
      completed: false,
      modules: {
        'hand-strength': {
          unlocked: true,
          completed: false,
          score: 0,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        'position': {
          unlocked: false,
          completed: false,
          score: 0,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        'equity': {
          unlocked: false,
          completed: false,
          score: 0,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        'ranges': {
          unlocked: false,
          completed: false,
          score: 0,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        }
      }
    },
    drills: {
      unlocked: false,
      completed: false,
      modules: {
        'hand-ranking': {
          unlocked: true,
          completed: false,
          bestScore: 0,
          bestStreak: 0,
          bestTime: null,
          attempts: 0,
          lastAttempt: null
        },
        'open-fold': {
          unlocked: false,
          completed: false,
          bestScore: 0,
          bestStreak: 0,
          bestTime: null,
          attempts: 0,
          lastAttempt: null
        },
        'equity-snap': {
          unlocked: false,
          completed: false,
          bestScore: 0,
          bestStreak: 0,
          bestTime: null,
          attempts: 0,
          lastAttempt: null
        },
        'range-check': {
          unlocked: false,
          completed: false,
          bestScore: 0,
          bestStreak: 0,
          bestTime: null,
          attempts: 0,
          lastAttempt: null
        },
        'position-speed': {
          unlocked: false,
          completed: false,
          bestScore: 0,
          bestStreak: 0,
          bestTime: null,
          attempts: 0,
          lastAttempt: null
        }
      },
      totalAttempts: 0,
      achievements: []
    },
    scenarios: {
      unlocked: false,
      completed: false,
      modules: {
        // Tier 1: High Consensus (unlocked immediately when Stage 3 unlocks)
        'defend-3bet': {
          unlocked: true,
          completed: false,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        'bb-defense': {
          unlocked: true,
          completed: false,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        '3bet-value': {
          unlocked: true,
          completed: false,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        'sb-3bet-fold': {
          unlocked: true,
          completed: false,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        // Tier 2: Simplified (requires 2 Tier 1 at 75%+)
        'cold-4bet': {
          unlocked: false,
          completed: false,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        },
        // Tier 3: Heuristic (always available - educational)
        'board-texture': {
          unlocked: true,
          completed: false,
          bestScore: 0,
          attempts: 0,
          lastAttempt: null
        }
      },
      achievements: []
    },
    'full-hands': {
      unlocked: false,
      completed: false,
      modules: {}
    }
  },
  stats: {
    totalQuizzes: 0,
    correctAnswers: 0,
    totalTime: 0,
    streak: 0,
    bestStreak: 0
  },
  settings: {
    soundEnabled: true,
    animationsEnabled: true
  },
  lastUpdated: null
};

// Module order for unlocking
const MODULE_ORDER = ['hand-strength', 'position', 'equity', 'ranges'];

// Drill order for unlocking
const DRILL_ORDER = ['hand-ranking', 'open-fold', 'equity-snap', 'range-check', 'position-speed'];

// Drill pass thresholds
const DRILL_THRESHOLDS = {
  'hand-ranking': 80,
  'open-fold': 75,
  'equity-snap': 70,
  'range-check': 75,
  'position-speed': 80
};

// Scenario order for unlocking
const SCENARIO_ORDER = [
  'defend-3bet', 'bb-defense', '3bet-value', 'sb-3bet-fold',
  'cold-4bet', 'board-texture'
];

// Scenario pass thresholds
const SCENARIO_THRESHOLDS = {
  'defend-3bet': 75,
  'bb-defense': 75,
  '3bet-value': 75,
  'sb-3bet-fold': 75,
  'cold-4bet': 70,
  'board-texture': 80  // Higher threshold for conceptual quiz
};

// Tier 1 scenarios (available when Stage 3 unlocks)
const TIER_1_SCENARIOS = ['defend-3bet', 'bb-defense', '3bet-value', 'sb-3bet-fold'];

/**
 * Load progress from localStorage
 */
export function loadProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new fields
      return mergeWithDefaults(parsed, DEFAULT_PROGRESS);
    }
  } catch (error) {
    console.error('Error loading progress:', error);
  }
  return { ...DEFAULT_PROGRESS };
}

/**
 * Save progress to localStorage
 */
export function saveProgress(progress) {
  try {
    progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.error('Error saving progress:', error);
    return false;
  }
}

/**
 * Reset all progress
 */
export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting progress:', error);
    return false;
  }
}

/**
 * Merge stored data with defaults (handles schema updates)
 */
function mergeWithDefaults(stored, defaults) {
  const result = { ...defaults };

  for (const key in stored) {
    if (typeof stored[key] === 'object' && stored[key] !== null && !Array.isArray(stored[key])) {
      result[key] = mergeWithDefaults(stored[key], defaults[key] || {});
    } else {
      result[key] = stored[key];
    }
  }

  return result;
}

/**
 * Get module progress
 */
export function getModuleProgress(stage, moduleId) {
  const progress = loadProgress();
  return progress.stages[stage]?.modules[moduleId] || null;
}

/**
 * Update module progress
 */
export function updateModuleProgress(stage, moduleId, updates) {
  const progress = loadProgress();

  if (!progress.stages[stage]?.modules[moduleId]) {
    console.error(`Module ${moduleId} not found in stage ${stage}`);
    return false;
  }

  Object.assign(progress.stages[stage].modules[moduleId], updates);

  // Update best score if current score is higher
  if (updates.score !== undefined) {
    const module = progress.stages[stage].modules[moduleId];
    if (updates.score > module.bestScore) {
      module.bestScore = updates.score;
    }
  }

  return saveProgress(progress);
}

/**
 * Complete a module and unlock the next one
 */
export function completeModule(stage, moduleId, score) {
  const progress = loadProgress();
  const stageData = progress.stages[stage];

  if (!stageData?.modules[moduleId]) {
    return false;
  }

  // Update current module
  const module = stageData.modules[moduleId];
  module.completed = true;
  module.score = score;
  module.attempts += 1;
  module.lastAttempt = new Date().toISOString();

  if (score > module.bestScore) {
    module.bestScore = score;
  }

  // Unlock next module in sequence
  const currentIndex = MODULE_ORDER.indexOf(moduleId);
  if (currentIndex >= 0 && currentIndex < MODULE_ORDER.length - 1) {
    const nextModuleId = MODULE_ORDER[currentIndex + 1];
    if (stageData.modules[nextModuleId]) {
      stageData.modules[nextModuleId].unlocked = true;
    }
  }

  // Check if stage is complete
  const allCompleted = MODULE_ORDER.every(
    id => stageData.modules[id]?.completed
  );
  if (allCompleted) {
    stageData.completed = true;
    // Unlock next stage
    unlockNextStage(progress, stage);
  }

  return saveProgress(progress);
}

/**
 * Unlock the next stage
 */
function unlockNextStage(progress, currentStage) {
  const stageOrder = ['foundations', 'drills', 'scenarios', 'full-hands'];
  const currentIndex = stageOrder.indexOf(currentStage);

  if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
    const nextStage = stageOrder[currentIndex + 1];
    progress.stages[nextStage].unlocked = true;
  }
}

/**
 * Check if a module is unlocked
 */
export function isModuleUnlocked(stage, moduleId) {
  const progress = loadProgress();
  return progress.stages[stage]?.modules[moduleId]?.unlocked || false;
}

/**
 * Check if a module is completed
 */
export function isModuleCompleted(stage, moduleId) {
  const progress = loadProgress();
  return progress.stages[stage]?.modules[moduleId]?.completed || false;
}

/**
 * Check if a stage is unlocked
 */
export function isStageUnlocked(stage) {
  const progress = loadProgress();
  return progress.stages[stage]?.unlocked || false;
}

/**
 * Check if a stage is completed
 */
export function isStageCompleted(stage) {
  const progress = loadProgress();
  return progress.stages[stage]?.completed || false;
}

/**
 * Get overall completion percentage
 */
export function getOverallProgress() {
  const progress = loadProgress();
  let completed = 0;
  let total = 0;

  for (const stage of Object.values(progress.stages)) {
    for (const module of Object.values(stage.modules || {})) {
      total++;
      if (module.completed) completed++;
    }
  }

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/**
 * Get stage completion percentage
 */
export function getStageProgress(stage) {
  const progress = loadProgress();
  const stageData = progress.stages[stage];

  if (!stageData?.modules) return 0;

  const modules = Object.values(stageData.modules);
  const completed = modules.filter(m => m.completed).length;

  return modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0;
}

/**
 * Update global stats
 */
export function updateStats(statsUpdate) {
  const progress = loadProgress();

  if (statsUpdate.correctAnswer !== undefined) {
    progress.stats.totalQuizzes++;
    if (statsUpdate.correctAnswer) {
      progress.stats.correctAnswers++;
      progress.stats.streak++;
      if (progress.stats.streak > progress.stats.bestStreak) {
        progress.stats.bestStreak = progress.stats.streak;
      }
    } else {
      progress.stats.streak = 0;
    }
  }

  if (statsUpdate.time !== undefined) {
    progress.stats.totalTime += statsUpdate.time;
  }

  return saveProgress(progress);
}

/**
 * Get global stats
 */
export function getStats() {
  const progress = loadProgress();
  return progress.stats;
}

/**
 * Get settings
 */
export function getSettings() {
  const progress = loadProgress();
  return progress.settings;
}

/**
 * Update settings
 */
export function updateSettings(settings) {
  const progress = loadProgress();
  Object.assign(progress.settings, settings);
  return saveProgress(progress);
}

/**
 * Get the current/next module to work on
 */
export function getCurrentModule(stage = 'foundations') {
  const progress = loadProgress();
  const stageData = progress.stages[stage];

  if (!stageData?.modules) return null;

  // Find first incomplete but unlocked module
  for (const moduleId of MODULE_ORDER) {
    const module = stageData.modules[moduleId];
    if (module && module.unlocked && !module.completed) {
      return moduleId;
    }
  }

  // All complete, return last one
  return MODULE_ORDER[MODULE_ORDER.length - 1];
}

/**
 * Export progress as JSON (for backup)
 */
export function exportProgress() {
  const progress = loadProgress();
  return JSON.stringify(progress, null, 2);
}

/**
 * Import progress from JSON (for restore)
 */
export function importProgress(jsonString) {
  try {
    const imported = JSON.parse(jsonString);
    return saveProgress(imported);
  } catch (error) {
    console.error('Error importing progress:', error);
    return false;
  }
}

// ============================================
// DRILL-SPECIFIC FUNCTIONS
// ============================================

/**
 * Get drill progress
 */
export function getDrillProgress(drillId) {
  const progress = loadProgress();
  return progress.stages.drills?.modules[drillId] || null;
}

/**
 * Get all drills progress
 */
export function getAllDrillsProgress() {
  const progress = loadProgress();
  return progress.stages.drills?.modules || {};
}

/**
 * Update drill progress after completion
 */
export function updateDrillProgress(drillId, stats) {
  const progress = loadProgress();
  const drillData = progress.stages.drills;

  if (!drillData?.modules[drillId]) {
    console.error(`Drill ${drillId} not found`);
    return false;
  }

  const drill = drillData.modules[drillId];
  const threshold = DRILL_THRESHOLDS[drillId] || 70;
  const passed = stats.accuracy >= threshold;

  // Update attempt count
  drill.attempts += 1;
  drill.lastAttempt = new Date().toISOString();
  drillData.totalAttempts += 1;

  // Update best score if higher
  if (stats.accuracy > drill.bestScore) {
    drill.bestScore = stats.accuracy;
  }

  // Update best streak if higher
  if (stats.bestStreak > drill.bestStreak) {
    drill.bestStreak = stats.bestStreak;
  }

  // Update best time if faster (and valid)
  if (stats.avgTime && (drill.bestTime === null || stats.avgTime < drill.bestTime)) {
    drill.bestTime = stats.avgTime;
  }

  // Mark as completed if passed
  if (passed && !drill.completed) {
    drill.completed = true;

    // Unlock next drill
    const currentIndex = DRILL_ORDER.indexOf(drillId);
    if (currentIndex >= 0 && currentIndex < DRILL_ORDER.length - 1) {
      const nextDrillId = DRILL_ORDER[currentIndex + 1];
      if (drillData.modules[nextDrillId]) {
        drillData.modules[nextDrillId].unlocked = true;
      }
    }

    // Check if all drills completed
    const allCompleted = DRILL_ORDER.every(
      id => drillData.modules[id]?.completed
    );
    if (allCompleted) {
      drillData.completed = true;
      // Unlock scenarios stage
      if (progress.stages.scenarios) {
        progress.stages.scenarios.unlocked = true;
      }
    }

    // Check for achievements
    checkDrillAchievements(progress, drillId, stats);
  }

  return saveProgress(progress);
}

/**
 * Check and award drill achievements
 */
function checkDrillAchievements(progress, drillId, stats) {
  const achievements = progress.stages.drills.achievements || [];

  // Speed Demon - avg < 2s per question
  if (stats.avgTime < 2000 && !achievements.includes('speed-demon')) {
    achievements.push('speed-demon');
  }

  // Perfect Run - 100% accuracy
  if (stats.accuracy === 100 && !achievements.includes('perfect-run')) {
    achievements.push('perfect-run');
  }

  // On Fire - 25 streak
  if (stats.bestStreak >= 25 && !achievements.includes('on-fire')) {
    achievements.push('on-fire');
  }

  // Drill Master - complete all drills
  const allCompleted = DRILL_ORDER.every(
    id => progress.stages.drills.modules[id]?.completed
  );
  if (allCompleted && !achievements.includes('drill-master')) {
    achievements.push('drill-master');
  }

  progress.stages.drills.achievements = achievements;
}

/**
 * Check if a drill is unlocked
 */
export function isDrillUnlocked(drillId) {
  const progress = loadProgress();
  return progress.stages.drills?.modules[drillId]?.unlocked || false;
}

/**
 * Check if a drill is completed
 */
export function isDrillCompleted(drillId) {
  const progress = loadProgress();
  return progress.stages.drills?.modules[drillId]?.completed || false;
}

/**
 * Get drill pass threshold
 */
export function getDrillThreshold(drillId) {
  return DRILL_THRESHOLDS[drillId] || 70;
}

/**
 * Get the next drill to work on
 */
export function getCurrentDrill() {
  const progress = loadProgress();
  const drillData = progress.stages.drills;

  if (!drillData?.modules) return null;

  // Find first incomplete but unlocked drill
  for (const drillId of DRILL_ORDER) {
    const drill = drillData.modules[drillId];
    if (drill && drill.unlocked && !drill.completed) {
      return drillId;
    }
  }

  // All complete or none available, return first unlocked
  for (const drillId of DRILL_ORDER) {
    const drill = drillData.modules[drillId];
    if (drill && drill.unlocked) {
      return drillId;
    }
  }

  return DRILL_ORDER[0];
}

/**
 * Get drill achievements
 */
export function getDrillAchievements() {
  const progress = loadProgress();
  return progress.stages.drills?.achievements || [];
}

/**
 * Get drill stats summary
 */
export function getDrillStats() {
  const progress = loadProgress();
  const drillData = progress.stages.drills;

  const completed = DRILL_ORDER.filter(
    id => drillData.modules[id]?.completed
  ).length;

  const totalBestStreak = Math.max(
    ...DRILL_ORDER.map(id => drillData.modules[id]?.bestStreak || 0)
  );

  return {
    completed,
    total: DRILL_ORDER.length,
    totalAttempts: drillData.totalAttempts || 0,
    bestStreak: totalBestStreak,
    achievements: drillData.achievements?.length || 0
  };
}

/**
 * Get drill order
 */
export function getDrillOrder() {
  return [...DRILL_ORDER];
}

// ============================================
// SCENARIO-SPECIFIC FUNCTIONS
// ============================================

/**
 * Get scenario progress
 */
export function getScenarioProgress(scenarioId) {
  const progress = loadProgress();
  return progress.stages.scenarios?.modules[scenarioId] || null;
}

/**
 * Get all scenarios progress
 */
export function getAllScenariosProgress() {
  const progress = loadProgress();
  return progress.stages.scenarios?.modules || {};
}

/**
 * Update scenario progress after completion
 */
export function updateScenarioProgress(scenarioId, stats) {
  const progress = loadProgress();
  const scenarioData = progress.stages.scenarios;

  if (!scenarioData?.modules[scenarioId]) {
    console.error(`Scenario ${scenarioId} not found`);
    return false;
  }

  const scenario = scenarioData.modules[scenarioId];
  const threshold = SCENARIO_THRESHOLDS[scenarioId] || 75;
  const passed = stats.accuracy >= threshold;

  // Update attempt count
  scenario.attempts += 1;
  scenario.lastAttempt = new Date().toISOString();

  // Update best score if higher
  if (stats.accuracy > scenario.bestScore) {
    scenario.bestScore = stats.accuracy;
  }

  // Mark as completed if passed
  if (passed && !scenario.completed) {
    scenario.completed = true;

    // Check if cold-4bet should unlock (requires 2 Tier 1 at 75%+)
    const tier1Completed = TIER_1_SCENARIOS.filter(
      id => scenarioData.modules[id]?.bestScore >= 75
    ).length;
    if (tier1Completed >= 2 && scenarioData.modules['cold-4bet']) {
      scenarioData.modules['cold-4bet'].unlocked = true;
    }

    // Check if all scenarios completed
    const allCompleted = SCENARIO_ORDER.every(
      id => scenarioData.modules[id]?.completed
    );
    if (allCompleted) {
      scenarioData.completed = true;
      // Unlock full-hands stage
      if (progress.stages['full-hands']) {
        progress.stages['full-hands'].unlocked = true;
      }
    }

    // Check for achievements
    checkScenarioAchievements(progress, scenarioId, stats);
  }

  return saveProgress(progress);
}

/**
 * Check and award scenario achievements
 */
function checkScenarioAchievements(progress, scenarioId, stats) {
  const achievements = progress.stages.scenarios.achievements || [];

  // Perfect Decisions - 100% on any scenario
  if (stats.accuracy === 100 && !achievements.includes('perfect-decisions')) {
    achievements.push('perfect-decisions');
  }

  // Scenario Solver - complete all scenarios
  const allCompleted = SCENARIO_ORDER.every(
    id => progress.stages.scenarios.modules[id]?.completed
  );
  if (allCompleted && !achievements.includes('scenario-solver')) {
    achievements.push('scenario-solver');
  }

  // Preflop Master - complete all 5 preflop scenarios
  const preflopScenarios = ['defend-3bet', 'bb-defense', '3bet-value', 'sb-3bet-fold', 'cold-4bet'];
  const preflopCompleted = preflopScenarios.every(
    id => progress.stages.scenarios.modules[id]?.completed
  );
  if (preflopCompleted && !achievements.includes('preflop-master')) {
    achievements.push('preflop-master');
  }

  // 3-Bet Specialist - master both 3-bet scenarios
  const threeBetScenarios = ['3bet-value', 'sb-3bet-fold'];
  const threeBetMastered = threeBetScenarios.every(
    id => progress.stages.scenarios.modules[id]?.bestScore >= 85
  );
  if (threeBetMastered && !achievements.includes('3bet-specialist')) {
    achievements.push('3bet-specialist');
  }

  // Defender - master defense scenarios
  const defenseScenarios = ['defend-3bet', 'bb-defense'];
  const defenseMastered = defenseScenarios.every(
    id => progress.stages.scenarios.modules[id]?.bestScore >= 85
  );
  if (defenseMastered && !achievements.includes('defender')) {
    achievements.push('defender');
  }

  progress.stages.scenarios.achievements = achievements;
}

/**
 * Check if a scenario is unlocked
 */
export function isScenarioUnlocked(scenarioId) {
  const progress = loadProgress();

  // First check if scenarios stage is unlocked
  if (!progress.stages.scenarios?.unlocked) {
    return false;
  }

  return progress.stages.scenarios?.modules[scenarioId]?.unlocked || false;
}

/**
 * Check if a scenario is completed
 */
export function isScenarioCompleted(scenarioId) {
  const progress = loadProgress();
  return progress.stages.scenarios?.modules[scenarioId]?.completed || false;
}

/**
 * Get scenario pass threshold
 */
export function getScenarioThreshold(scenarioId) {
  return SCENARIO_THRESHOLDS[scenarioId] || 75;
}

/**
 * Get the next scenario to work on
 */
export function getCurrentScenario() {
  const progress = loadProgress();
  const scenarioData = progress.stages.scenarios;

  if (!scenarioData?.modules) return null;

  // Find first incomplete but unlocked scenario
  for (const scenarioId of SCENARIO_ORDER) {
    const scenario = scenarioData.modules[scenarioId];
    if (scenario && scenario.unlocked && !scenario.completed) {
      return scenarioId;
    }
  }

  // All complete or none available, return first unlocked
  for (const scenarioId of SCENARIO_ORDER) {
    const scenario = scenarioData.modules[scenarioId];
    if (scenario && scenario.unlocked) {
      return scenarioId;
    }
  }

  return SCENARIO_ORDER[0];
}

/**
 * Get scenario achievements
 */
export function getScenarioAchievements() {
  const progress = loadProgress();
  return progress.stages.scenarios?.achievements || [];
}

/**
 * Get scenario stats summary
 */
export function getScenarioStats() {
  const progress = loadProgress();
  const scenarioData = progress.stages.scenarios;

  const completed = SCENARIO_ORDER.filter(
    id => scenarioData.modules[id]?.completed
  ).length;

  const totalAttempts = SCENARIO_ORDER.reduce(
    (sum, id) => sum + (scenarioData.modules[id]?.attempts || 0), 0
  );

  return {
    completed,
    total: SCENARIO_ORDER.length,
    totalAttempts,
    achievements: scenarioData.achievements?.length || 0
  };
}

/**
 * Get scenario order
 */
export function getScenarioOrder() {
  return [...SCENARIO_ORDER];
}

/**
 * Check if scenarios stage should be unlocked
 * (Requires 3+ drills at 80%+ OR at least 3 drills completed)
 */
export function checkScenariosUnlock() {
  const progress = loadProgress();
  const drillData = progress.stages.drills;

  if (!drillData?.modules) return false;

  // Count drills at 80%+ or completed
  const qualifyingDrills = DRILL_ORDER.filter(id => {
    const drill = drillData.modules[id];
    return drill && (drill.bestScore >= 80 || drill.completed);
  }).length;

  return qualifyingDrills >= 3;
}
