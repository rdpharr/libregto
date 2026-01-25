/**
 * Hold'em Trainer - Main Application
 * Initializes routing and renders pages
 */

import { router } from './router.js';
import { loadProgress, getStageProgress, isStageUnlocked, getCurrentModule, getOverallProgress } from './storage.js';
import { renderHandStrengthModule } from './modules/handStrength.js';
import { renderPositionModule } from './modules/position.js';
import { renderEquityModule } from './modules/equity.js';
import { renderRangesModule } from './modules/ranges.js';

// Main content container
const mainContent = document.getElementById('main-content');

/**
 * Render the home page
 */
function renderHomePage() {
  const progress = loadProgress();
  const overallProgress = getOverallProgress();

  mainContent.innerHTML = `
    <div class="home container">
      <div class="home__hero animate-fade-in-up">
        <h1 class="home__logo">Hold'em<span class="home__logo-accent">Trainer</span></h1>
        <p class="home__tagline">Master GTO poker strategy through interactive lessons and real-time practice</p>
        <div class="home__cta">
          <a href="#/foundations" class="btn btn--primary btn--lg">Start Learning</a>
          <button class="btn btn--secondary btn--lg" onclick="window.location.hash='#/about'">How it Works</button>
        </div>
      </div>

      <div class="home__stages">
        ${renderStageCard(1, 'Foundations', 'Master the fundamentals: hand strength, position, equity, and ranges.', 'foundations', progress)}
        ${renderStageCard(2, 'Drills', 'Practice with rapid-fire exercises to build muscle memory.', 'drills', progress)}
        ${renderStageCard(3, 'Scenarios', 'Apply your knowledge in realistic multi-street situations.', 'scenarios', progress)}
        ${renderStageCard(4, 'Full Hands', 'Play complete hands with GTO feedback on every decision.', 'full-hands', progress)}
      </div>

      <div class="home__progress-summary animate-fade-in-up stagger-3">
        <div class="home__stat">
          <div class="home__stat-value">${overallProgress}%</div>
          <div class="home__stat-label">Overall Progress</div>
        </div>
        <div class="home__stat">
          <div class="home__stat-value">${progress.stats.totalQuizzes}</div>
          <div class="home__stat-label">Quizzes Completed</div>
        </div>
        <div class="home__stat">
          <div class="home__stat-value">${progress.stats.bestStreak}</div>
          <div class="home__stat-label">Best Streak</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a stage card
 */
function renderStageCard(number, title, description, stageId, progress) {
  const unlocked = isStageUnlocked(stageId);
  const stageProgress = getStageProgress(stageId);
  const completed = stageProgress === 100;

  return `
    <div class="stage-card ${!unlocked ? 'stage-card--locked' : ''} ${completed ? 'stage-card--completed' : ''} animate-fade-in-up stagger-${number}"
         ${unlocked ? `onclick="window.location.hash='#/${stageId}'"` : ''}>
      ${!unlocked ? '<span class="stage-card__lock-icon">🔒</span>' : ''}
      <div class="stage-card__number">${number}</div>
      <div class="stage-card__title">${title}</div>
      <div class="stage-card__description">${description}</div>
      <div class="stage-card__progress">
        <div class="progress">
          <div class="progress__bar" style="width: ${stageProgress}%"></div>
        </div>
        <div class="text-sm text-secondary mt-2">${stageProgress}% complete</div>
      </div>
    </div>
  `;
}

/**
 * Render the foundations hub page
 */
function renderFoundationsPage() {
  const progress = loadProgress();
  const foundationsProgress = progress.stages.foundations;
  const currentModule = getCurrentModule('foundations');

  const modules = [
    { id: 'hand-strength', title: 'Hand Strength', subtitle: 'Learn to evaluate starting hands' },
    { id: 'position', title: 'Position', subtitle: 'Understand positional advantage' },
    { id: 'equity', title: 'Equity', subtitle: 'Calculate your winning chances' },
    { id: 'ranges', title: 'Ranges', subtitle: 'Build and read hand ranges' }
  ];

  mainContent.innerHTML = `
    <div class="foundations container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Foundations</span>
        </nav>
        <h1 class="page-header__title">Stage 1: Foundations</h1>
        <p class="page-header__subtitle">Master the core concepts of GTO poker</p>
        <div class="page-header__progress">
          <div class="progress">
            <div class="progress__bar" style="width: ${getStageProgress('foundations')}%"></div>
          </div>
        </div>
      </div>

      <div class="foundations__intro">
        <p class="foundations__intro-text">
          Before you can make optimal decisions at the poker table, you need to understand the fundamentals.
          Complete these four modules to build a solid foundation for GTO play.
        </p>
      </div>

      <div class="foundations__modules">
        ${modules.map((module, index) => {
          const moduleData = foundationsProgress.modules[module.id];
          const isUnlocked = moduleData?.unlocked || false;
          const isCompleted = moduleData?.completed || false;
          const isCurrent = module.id === currentModule;

          return `
            <div class="module-card ${!isUnlocked ? 'module-card--locked' : ''} ${isCompleted ? 'module-card--completed' : ''} animate-fade-in-up stagger-${index + 1}"
                 ${isUnlocked ? `onclick="window.location.hash='#/module/${module.id}'"` : ''}>
              <div class="module-card__number">${isCompleted ? '✓' : index + 1}</div>
              <div class="module-card__content">
                <div class="module-card__title">${module.title}</div>
                <div class="module-card__subtitle">
                  ${!isUnlocked ? '🔒 Locked' : isCompleted ? `Best: ${moduleData.bestScore}%` : module.subtitle}
                </div>
              </div>
              <div class="module-card__arrow">${isUnlocked ? '→' : ''}</div>
            </div>
          `;
        }).join('')}
      </div>

      ${currentModule ? `
        <div class="foundations__continue animate-fade-in-up stagger-5">
          <a href="#/module/${currentModule}" class="btn btn--primary btn--lg">
            Continue Learning
          </a>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render a module page
 */
function renderModulePage(params) {
  const moduleId = params.id;

  switch (moduleId) {
    case 'hand-strength':
      renderHandStrengthModule(mainContent);
      break;
    case 'position':
      renderPositionModule(mainContent);
      break;
    case 'equity':
      renderEquityModule(mainContent);
      break;
    case 'ranges':
      renderRangesModule(mainContent);
      break;
    default:
      render404();
  }
}

/**
 * Render settings page
 */
function renderSettingsPage() {
  mainContent.innerHTML = `
    <div class="container" style="padding-top: var(--space-8);">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Settings</span>
        </nav>
        <h1 class="page-header__title">Settings</h1>
      </div>

      <div class="lesson__section">
        <h3 class="lesson__subtitle">Progress</h3>
        <p class="lesson__text mb-4">Reset your progress to start over from the beginning.</p>
        <button class="btn btn--secondary" onclick="if(confirm('Are you sure? This will delete all your progress.')) { localStorage.removeItem('holdem-trainer-progress'); location.reload(); }">
          Reset All Progress
        </button>
      </div>

      <div class="divider"></div>

      <div class="lesson__section">
        <h3 class="lesson__subtitle">About</h3>
        <p class="lesson__text">
          Hold'em Trainer is a free educational tool for learning GTO (Game Theory Optimal) poker strategy.
          The concepts taught here are simplified for learning purposes and represent a starting point
          for understanding poker fundamentals.
        </p>
      </div>
    </div>
  `;
}

/**
 * Render about page
 */
function renderAboutPage() {
  mainContent.innerHTML = `
    <div class="container" style="padding-top: var(--space-8);">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">How it Works</span>
        </nav>
        <h1 class="page-header__title">How Hold'em Trainer Works</h1>
      </div>

      <div class="lesson">
        <div class="lesson__section">
          <h3 class="lesson__subtitle">Layered Learning</h3>
          <p class="lesson__text">
            Our curriculum is designed to build your skills progressively. Each stage builds on the previous one,
            ensuring you have a solid foundation before moving to more advanced concepts.
          </p>
        </div>

        <div class="lesson__section">
          <h3 class="lesson__subtitle">Stage 1: Foundations</h3>
          <p class="lesson__text">
            Learn the core concepts: hand strength evaluation, positional advantage, equity calculation,
            and range construction. These fundamentals are essential for every decision you'll make at the table.
          </p>
        </div>

        <div class="lesson__section">
          <h3 class="lesson__subtitle">Stage 2: Drills</h3>
          <p class="lesson__text">
            Practice makes perfect. Our rapid-fire drills help you internalize the concepts until they become
            second nature. Build the muscle memory needed for quick, accurate decisions.
          </p>
        </div>

        <div class="lesson__section">
          <h3 class="lesson__subtitle">Stage 3: Scenarios</h3>
          <p class="lesson__text">
            Apply your knowledge in realistic multi-street situations. Learn how decisions on the flop,
            turn, and river are interconnected and how to think through complex spots.
          </p>
        </div>

        <div class="lesson__section">
          <h3 class="lesson__subtitle">Stage 4: Full Hands</h3>
          <p class="lesson__text">
            Put it all together by playing complete hands with real-time GTO feedback. See how your
            decisions compare to optimal play and identify areas for improvement.
          </p>
        </div>

        <div class="mt-8">
          <a href="#/foundations" class="btn btn--primary btn--lg">Start Learning</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render 404 page
 */
function render404() {
  mainContent.innerHTML = `
    <div class="container" style="padding-top: var(--space-16); text-align: center;">
      <h1 class="display-lg mb-4">404</h1>
      <p class="text-lg text-secondary mb-8">Page not found</p>
      <a href="#/" class="btn btn--primary">Go Home</a>
    </div>
  `;
}

/**
 * Render coming soon page for locked stages
 */
function renderComingSoon(stageName) {
  mainContent.innerHTML = `
    <div class="container" style="padding-top: var(--space-16); text-align: center;">
      <h1 class="display-md mb-4">${stageName}</h1>
      <p class="text-lg text-secondary mb-8">Complete the previous stage to unlock this content.</p>
      <a href="#/foundations" class="btn btn--primary">Go to Foundations</a>
    </div>
  `;
}

// Register routes
router.register('/', renderHomePage);
router.register('/foundations', renderFoundationsPage);
router.register('/module/:id', renderModulePage);
router.register('/settings', renderSettingsPage);
router.register('/about', renderAboutPage);
router.register('/drills', () => renderComingSoon('Drills'));
router.register('/scenarios', () => renderComingSoon('Scenarios'));
router.register('/full-hands', () => renderComingSoon('Full Hands'));
router.register('*', render404);

// Set up navigation callback for transitions
router.setOnNavigate((newRoute, oldRoute) => {
  // Scroll to top on navigation
  window.scrollTo(0, 0);

  // Add transition class
  mainContent.style.opacity = '0';
  setTimeout(() => {
    mainContent.style.opacity = '1';
  }, 50);
});

// Initialize
console.log('Hold\'em Trainer initialized');
