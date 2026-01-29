/**
 * Scenarios Hub
 * Main hub page for Stage 3 scenarios
 */

import {
  isStageUnlocked,
  getAllScenariosProgress,
  getScenarioThreshold,
  getScenarioStats,
  getScenarioAchievements,
  getCurrentScenario,
  getScenarioOrder,
  checkScenariosUnlock
} from '../storage.js';

// Scenario metadata
const SCENARIOS = {
  'defend-3bet': {
    id: 'defend-3bet',
    title: 'Defend vs 3-Bet',
    description: 'You open, villain 3-bets. Call, 4-bet, or fold?',
    icon: '&#x1F4B0;', // money bag
    category: 'preflop',
    tier: 1,
    badge: null
  },
  'bb-defense': {
    id: 'bb-defense',
    title: 'BB Defense',
    description: 'Villain opens, you\'re in BB. Call, 3-bet, or fold?',
    icon: '&#x1F6E1;', // shield
    category: 'preflop',
    tier: 1,
    badge: null
  },
  '3bet-value': {
    id: '3bet-value',
    title: '3-Bet for Value',
    description: 'Identify when to 3-bet for value vs calling or folding.',
    icon: '&#x1F4B8;', // money with wings
    category: 'preflop',
    tier: 1,
    badge: null
  },
  'sb-3bet-fold': {
    id: 'sb-3bet-fold',
    title: 'SB: 3-Bet or Fold',
    description: 'From SB, learn when to 3-bet and when to fold (rarely call).',
    icon: '&#x1F3AF;', // target
    category: 'preflop',
    tier: 1,
    badge: null
  },
  'cold-4bet': {
    id: 'cold-4bet',
    title: 'Cold 4-Bet Spots',
    description: 'Someone opens, another 3-bets. 4-bet or fold?',
    icon: '&#x1F525;', // fire
    category: 'preflop',
    tier: 2,
    badge: 'simplified'
  },
  'board-texture': {
    id: 'board-texture',
    title: 'Board Texture',
    description: 'Identify dry, wet, paired, and monotone boards.',
    icon: '&#x1F0CF;', // playing card
    category: 'postflop',
    tier: 3,
    badge: 'educational'
  }
};

// Achievement definitions
const ACHIEVEMENT_DEFS = {
  'perfect-decisions': {
    name: 'Perfect Decisions',
    icon: '&#x1F31F;', // star
    description: '100% on any scenario'
  },
  'scenario-solver': {
    name: 'Scenario Solver',
    icon: '&#x1F3C6;', // trophy
    description: 'Complete all scenarios'
  },
  'preflop-master': {
    name: 'Preflop Master',
    icon: '&#x1F451;', // crown
    description: 'Complete all preflop scenarios'
  },
  '3bet-specialist': {
    name: '3-Bet Specialist',
    icon: '&#x1F4AA;', // muscle
    description: 'Master both 3-bet scenarios'
  },
  'defender': {
    name: 'Defender',
    icon: '&#x1F6E1;', // shield
    description: 'Master defense scenarios'
  }
};

/**
 * Render the scenarios hub
 * @param {HTMLElement} container - Container element
 */
export function renderScenariosHub(container) {
  // Check if scenarios stage is unlocked
  const isUnlocked = isStageUnlocked('scenarios');

  if (!isUnlocked) {
    renderLockedState(container);
    return;
  }

  const progress = getAllScenariosProgress();
  const stats = getScenarioStats();
  const achievements = getScenarioAchievements();
  const currentScenario = getCurrentScenario();

  container.innerHTML = `
    <div class="scenarios-hub container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Scenarios</span>
        </nav>
        <h1 class="page-header__title">Stage 3: Scenarios</h1>
        <p class="page-header__subtitle">Apply your knowledge in realistic poker situations</p>
      </div>

      <!-- Stats Overview -->
      <div class="drills-hub__stats animate-fade-in-up">
        <div class="drills-hub__stat">
          <div class="drills-hub__stat-value">${stats.completed}/${stats.total}</div>
          <div class="drills-hub__stat-label">Completed</div>
        </div>
        <div class="drills-hub__stat">
          <div class="drills-hub__stat-value">${stats.totalAttempts}</div>
          <div class="drills-hub__stat-label">Attempts</div>
        </div>
        <div class="drills-hub__stat">
          <div class="drills-hub__stat-value">${stats.achievements}</div>
          <div class="drills-hub__stat-label">Achievements</div>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="scenarios-hub__tabs">
        <button class="scenarios-hub__tab scenarios-hub__tab--active" data-category="all">All</button>
        <button class="scenarios-hub__tab" data-category="preflop">Preflop</button>
        <button class="scenarios-hub__tab" data-category="postflop">Postflop</button>
      </div>

      <!-- Scenario Cards Grid -->
      <div class="scenarios-hub__grid" id="scenarios-grid">
        ${renderScenarioCards(progress, currentScenario)}
      </div>

      <!-- Quick Play Button -->
      <div class="scenarios-hub__quick-play">
        <button class="btn btn--primary btn--lg" id="random-scenario-btn">
          Random Scenario
        </button>
      </div>

      <!-- Achievements Section -->
      ${renderAchievementsSection(achievements)}
    </div>
  `;

  // Bind events
  bindHubEvents(container, progress);
}

/**
 * Render locked state when scenarios aren't unlocked yet
 */
function renderLockedState(container) {
  const canUnlock = checkScenariosUnlock();

  container.innerHTML = `
    <div class="container scenario-locked">
      <div class="animate-fade-in-up">
        <div class="scenario-locked__icon">&#x1F512;</div>
        <h1 class="display-md mb-4">Scenarios Locked</h1>
        <p class="text-lg text-secondary mb-8">
          ${canUnlock
            ? 'You\'ve met the requirements! Complete any more drill to unlock scenarios.'
            : 'Complete 3 or more drills with 80%+ accuracy to unlock Stage 3 scenarios.'}
        </p>
        <a href="#/drills" class="btn btn--primary btn--lg">Go to Drills</a>
      </div>
    </div>
  `;
}

/**
 * Render scenario cards
 */
function renderScenarioCards(progress, currentScenario, category = 'all') {
  const order = getScenarioOrder();

  return order
    .filter(id => {
      if (category === 'all') return true;
      return SCENARIOS[id].category === category;
    })
    .map((id, index) => {
      const scenario = SCENARIOS[id];
      const scenarioProgress = progress[id] || {};
      const isUnlocked = scenarioProgress.unlocked !== false;
      const isCompleted = scenarioProgress.completed || false;
      const isCurrent = id === currentScenario;
      const threshold = getScenarioThreshold(id);

      return `
        <div class="scenario-card ${!isUnlocked ? 'scenario-card--locked' : ''} ${isCompleted ? 'scenario-card--completed' : ''} ${isCurrent ? 'drill-card--current' : ''} animate-fade-in-up stagger-${index + 1}"
             data-scenario="${id}"
             ${isUnlocked ? `onclick="window.location.hash='#/scenario/${id}'"` : ''}>
          ${scenario.badge ? `<span class="scenario-card__badge scenario-card__badge--${scenario.badge}">${scenario.badge}</span>` : ''}
          ${!isUnlocked ? '<span class="drill-card__lock">&#x1F512;</span>' : ''}
          <div class="scenario-card__icon">${scenario.icon}</div>
          <div class="scenario-card__title">${scenario.title}</div>
          <div class="scenario-card__description">
            ${!isUnlocked ? 'Complete more Tier 1 scenarios to unlock' : scenario.description}
          </div>
          ${isUnlocked ? `
            <div class="scenario-card__stats">
              <div>
                <div class="scenario-card__stat-value">${scenarioProgress.bestScore || 0}%</div>
                <div class="scenario-card__stat-label">Best</div>
              </div>
              <div>
                <div class="scenario-card__stat-value">${scenarioProgress.attempts || 0}</div>
                <div class="scenario-card__stat-label">Attempts</div>
              </div>
              <div>
                <div class="scenario-card__stat-value">${threshold}%</div>
                <div class="scenario-card__stat-label">To Pass</div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
}

/**
 * Render achievements section
 */
function renderAchievementsSection(earnedAchievements) {
  const allAchievements = Object.entries(ACHIEVEMENT_DEFS);

  return `
    <div class="drills-hub__achievements animate-fade-in-up stagger-5">
      <h3 class="drills-hub__section-title">Achievements</h3>
      <div class="drills-hub__achievement-grid">
        ${allAchievements.map(([id, achievement]) => {
          const earned = earnedAchievements.includes(id);
          return `
            <div class="achievement ${earned ? 'achievement--earned' : ''}" title="${achievement.description}">
              <span class="achievement__icon">${achievement.icon}</span>
              <span class="achievement__name">${achievement.name}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Bind hub events
 */
function bindHubEvents(container, progress) {
  // Category tabs
  const tabs = container.querySelectorAll('.scenarios-hub__tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('scenarios-hub__tab--active'));
      tab.classList.add('scenarios-hub__tab--active');

      const category = tab.dataset.category;
      const grid = container.querySelector('#scenarios-grid');
      grid.innerHTML = renderScenarioCards(progress, getCurrentScenario(), category);
    });
  });

  // Random scenario button
  const randomBtn = container.querySelector('#random-scenario-btn');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      const unlockedScenarios = getScenarioOrder().filter(id => {
        const p = progress[id];
        return p && p.unlocked !== false;
      });

      if (unlockedScenarios.length > 0) {
        const randomId = unlockedScenarios[Math.floor(Math.random() * unlockedScenarios.length)];
        window.location.hash = `#/scenario/${randomId}`;
      }
    });
  }
}

/**
 * Get scenario metadata by ID
 */
export function getScenarioMetadata(id) {
  return SCENARIOS[id] || null;
}

/**
 * Get all scenario metadata
 */
export function getAllScenarioMetadata() {
  return { ...SCENARIOS };
}
