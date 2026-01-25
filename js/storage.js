/**
 * Storage Module
 * localStorage wrapper for progress persistence
 */

const STORAGE_KEY = 'holdem-trainer-progress';

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
      modules: {}
    },
    scenarios: {
      unlocked: false,
      completed: false,
      modules: {}
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
