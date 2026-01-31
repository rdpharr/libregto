/**
 * Difficulty Utilities
 * Shared utilities for Easy/Hard mode functionality
 */

/**
 * Common delay values for difficulty modes
 */
export const DIFFICULTY_DELAYS = {
  easy: { correctDelay: 800, wrongDelay: 1500 },
  hard: { correctDelay: 500, wrongDelay: 1000 }
};

/**
 * Format time in milliseconds to human readable string
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time
 */
export function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Get current stats based on selected difficulty
 * @param {Object} progress - Progress object from storage
 * @param {string} selectedDifficulty - 'easy' or 'hard'
 * @returns {Object} Stats for the selected difficulty
 */
export function getCurrentStats(progress, selectedDifficulty) {
  if (selectedDifficulty === 'hard' && progress?.hard) {
    return progress.hard;
  }
  return progress;
}

/**
 * Get previous best for comparison in results screen
 * @param {Object} progress - Progress object from storage
 * @param {string} selectedDifficulty - 'easy' or 'hard'
 * @returns {Object} Previous best stats with correct values for difficulty
 */
export function getPreviousBest(progress, selectedDifficulty) {
  if (selectedDifficulty === 'hard' && progress?.hard) {
    return {
      ...progress,
      bestScore: progress.hard.bestScore,
      bestStreak: progress.hard.bestStreak,
      bestTime: progress.hard.bestTime
    };
  }
  return progress;
}

/**
 * Update start screen elements when difficulty changes
 * @param {Object} config - Difficulty config for selected difficulty
 * @param {string} selectedDifficulty - 'easy' or 'hard'
 * @param {Object} progress - Progress object from storage
 * @param {Object} options - Display options
 * @param {boolean} options.showStreak - Whether to show streak stat (default: true)
 * @param {boolean} options.showTime - Whether to show time stat (default: true)
 * @param {boolean} options.showAttempts - Whether to show attempts stat (default: false)
 */
export function updateStartScreenForDifficulty(config, selectedDifficulty, progress, options = {}) {
  const { showStreak = true, showTime = true, showAttempts = false } = options;

  // Update meta info (questions count, pass threshold)
  const metaEl = document.getElementById('drill-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span>${config.totalQuestions} questions</span>
      <span>Pass: ${config.passThreshold}%</span>
    `;
  }

  // Get stats for selected difficulty
  const currentStats = getCurrentStats(progress, selectedDifficulty);

  // Update best stats display
  const bestEl = document.getElementById('best-stats');
  if (bestEl && currentStats) {
    const statParts = [];

    statParts.push(`<span>Score: ${Math.round(currentStats.bestScore || 0)}%</span>`);

    if (showStreak && currentStats.bestStreak !== undefined) {
      statParts.push(`<span>Streak: ${currentStats.bestStreak || 0}</span>`);
    }

    if (showAttempts && currentStats.attempts !== undefined) {
      statParts.push(`<span>Attempts: ${currentStats.attempts || 0}</span>`);
    }

    if (showTime && currentStats.bestTime) {
      statParts.push(`<span>Avg: ${formatTime(currentStats.bestTime)}</span>`);
    }

    bestEl.innerHTML = `
      <div class="drill-start__best-title">Your Best</div>
      <div class="drill-start__best-stats">
        ${statParts.join('')}
      </div>
    `;
  }
}

/**
 * Generate a fold hand from pools, excluding hands in the playable range
 * @param {Object} rangeData - Range data with fourBet, call, threeBet arrays
 * @param {boolean} useMarginalFolds - If true, only use marginal fold hands (harder)
 * @param {Object} handPools - Hand pools for fold generation
 * @param {string[]} handPools.marginalFoldHands - Hands close to calling range
 * @param {string[]} handPools.clearFoldHands - Obvious fold hands
 * @param {string[]} handPools.fallbackHands - Fallback hands if no valid folds found
 * @param {Function} randomPick - Function to pick random element from array
 * @returns {string} A fold hand
 */
export function generateFoldHand(rangeData, useMarginalFolds, handPools, randomPick) {
  const { marginalFoldHands, clearFoldHands, fallbackHands } = handPools;

  // Collect all playable hands
  const notFold = [
    ...(rangeData.fourBet || []),
    ...(rangeData.call || []),
    ...(rangeData.threeBet || [])
  ];

  // Use marginal hands only in hard mode, otherwise mix both
  const foldPool = useMarginalFolds
    ? marginalFoldHands
    : [...marginalFoldHands, ...clearFoldHands];

  // Filter out any that are actually playable
  const actualFolds = foldPool.filter(h => !notFold.includes(h));

  if (actualFolds.length > 0) {
    return randomPick(actualFolds);
  }

  return randomPick(fallbackHands);
}
