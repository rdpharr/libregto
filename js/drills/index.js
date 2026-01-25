/**
 * Drills Hub
 * Main page for the drills stage
 */

import {
  getAllDrillsProgress,
  getCurrentDrill,
  getDrillStats,
  getDrillAchievements,
  getDrillThreshold,
  isStageUnlocked
} from '../storage.js';

// Drill metadata
const DRILL_INFO = {
  'hand-ranking': {
    title: 'Hand Ranking Speed',
    description: 'Which hand is stronger? Make quick comparisons.',
    icon: '🃏',
    questions: 20,
    timeLimit: '30s or 20 questions'
  },
  'open-fold': {
    title: 'Open or Fold',
    description: 'Should you open this hand from this position?',
    icon: '📊',
    questions: 25,
    timeLimit: '25 questions'
  },
  'equity-snap': {
    title: 'Equity Snap',
    description: 'Quickly estimate your equity vs a random hand.',
    icon: '📈',
    questions: 15,
    timeLimit: '15 questions'
  },
  'range-check': {
    title: 'Range Check',
    description: 'Is this hand in the opening range for this position?',
    icon: '🎯',
    questions: 20,
    timeLimit: '20 questions'
  },
  'position-speed': {
    title: 'Position Speed',
    description: 'Test your knowledge of position advantage.',
    icon: '♠️',
    questions: 15,
    timeLimit: '15 questions'
  }
};

// Drill order
const DRILL_ORDER = ['hand-ranking', 'open-fold', 'equity-snap', 'range-check', 'position-speed'];

/**
 * Render the drills hub page
 */
export function renderDrillsHub(container) {
  // Check if drills are unlocked
  if (!isStageUnlocked('drills')) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Drills Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete Stage 1: Foundations to unlock drills.</p>
        <a href="#/foundations" class="btn btn--primary">Go to Foundations</a>
      </div>
    `;
    return;
  }

  const drillsProgress = getAllDrillsProgress();
  const currentDrill = getCurrentDrill();
  const stats = getDrillStats();
  const achievements = getDrillAchievements();

  container.innerHTML = `
    <div class="drills-hub container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Drills</span>
        </nav>
        <h1 class="page-header__title">Stage 2: Drills</h1>
        <p class="page-header__subtitle">Build muscle memory through rapid-fire practice</p>
        <div class="page-header__progress">
          <div class="progress">
            <div class="progress__bar" style="width: ${(stats.completed / stats.total) * 100}%"></div>
          </div>
          <div class="text-sm text-secondary mt-2">${stats.completed}/${stats.total} drills completed</div>
        </div>
      </div>

      <div class="drills-hub__stats animate-fade-in-up stagger-1">
        <div class="drills-hub__stat">
          <div class="drills-hub__stat-value">${stats.totalAttempts}</div>
          <div class="drills-hub__stat-label">Total Attempts</div>
        </div>
        <div class="drills-hub__stat">
          <div class="drills-hub__stat-value">${stats.bestStreak}</div>
          <div class="drills-hub__stat-label">Best Streak</div>
        </div>
        <div class="drills-hub__stat">
          <div class="drills-hub__stat-value">${achievements.length}</div>
          <div class="drills-hub__stat-label">Achievements</div>
        </div>
      </div>

      <div class="drills-hub__grid">
        ${DRILL_ORDER.map((drillId, index) => renderDrillCard(drillId, drillsProgress[drillId], index, currentDrill)).join('')}
      </div>

      ${currentDrill ? `
        <div class="drills-hub__action animate-fade-in-up stagger-6">
          <a href="#/drill/${currentDrill}" class="btn btn--primary btn--lg">
            ${stats.completed > 0 ? 'Continue Practice' : 'Start Drilling'}
          </a>
        </div>
      ` : ''}

      ${achievements.length > 0 ? renderAchievements(achievements) : ''}
    </div>
  `;
}

/**
 * Render a drill card
 */
function renderDrillCard(drillId, progress, index, currentDrill) {
  const info = DRILL_INFO[drillId];
  const isUnlocked = progress?.unlocked || false;
  const isCompleted = progress?.completed || false;
  const isCurrent = drillId === currentDrill;
  const threshold = getDrillThreshold(drillId);

  return `
    <div class="drill-card ${!isUnlocked ? 'drill-card--locked' : ''} ${isCompleted ? 'drill-card--completed' : ''} ${isCurrent ? 'drill-card--current' : ''} animate-fade-in-up stagger-${index + 2}"
         ${isUnlocked ? `onclick="window.location.hash='#/drill/${drillId}'"` : ''}>
      ${!isUnlocked ? '<span class="drill-card__lock">🔒</span>' : ''}
      <div class="drill-card__icon">${info.icon}</div>
      <div class="drill-card__content">
        <div class="drill-card__title">${info.title}</div>
        <div class="drill-card__description">${info.description}</div>
        ${isUnlocked ? `
          <div class="drill-card__meta">
            <span class="drill-card__questions">${info.questions} questions</span>
            <span class="drill-card__threshold">Pass: ${threshold}%</span>
          </div>
        ` : ''}
      </div>
      ${isCompleted ? `
        <div class="drill-card__stats">
          <div class="drill-card__best-score">${Math.round(progress.bestScore)}%</div>
          <div class="drill-card__best-streak">🔥 ${progress.bestStreak}</div>
          ${progress.bestTime ? `<div class="drill-card__best-time">⚡ ${formatTime(progress.bestTime)}</div>` : ''}
        </div>
      ` : isUnlocked ? `
        <div class="drill-card__arrow">→</div>
      ` : ''}
    </div>
  `;
}

/**
 * Render achievements section
 */
function renderAchievements(achievements) {
  const achievementInfo = {
    'speed-demon': { name: 'Speed Demon', icon: '⚡', description: 'Average < 2s per question' },
    'perfect-run': { name: 'Perfect Run', icon: '💯', description: '100% accuracy in a drill' },
    'on-fire': { name: 'On Fire', icon: '🔥', description: '25 answer streak' },
    'drill-master': { name: 'Drill Master', icon: '👑', description: 'Complete all drills' }
  };

  return `
    <div class="drills-hub__achievements animate-fade-in-up stagger-7">
      <h3 class="drills-hub__section-title">Achievements</h3>
      <div class="drills-hub__achievement-grid">
        ${achievements.map(id => {
          const info = achievementInfo[id];
          return `
            <div class="achievement achievement--earned">
              <span class="achievement__icon">${info.icon}</span>
              <span class="achievement__name">${info.name}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Format time in milliseconds
 */
function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export { DRILL_INFO, DRILL_ORDER };
