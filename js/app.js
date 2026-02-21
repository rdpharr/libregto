/**
 * LibreGTO - Main Application
 * Free & Open Source GTO Poker Trainer
 * Initializes routing and renders pages
 */

import { router } from './router.js';
import { loadProgress, getStageProgress, isStageUnlocked, getCurrentModule, getOverallProgress, getDrillStats } from './storage.js';

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
        <h1 class="home__logo">Libre<span class="home__logo-accent">GTO</span></h1>
        <p class="home__tagline">Start learning GTO poker strategy through interactive lessons and real-time practice</p>
        <div class="home__cta">
          <a href="#/foundations" class="btn btn--primary btn--lg">Start Learning</a>
          <button class="btn btn--secondary btn--lg" onclick="window.location.hash='#/about'">How it Works</button>
        </div>
      </div>

      <div class="home__stages">
        ${renderStageCard(1, 'Foundations', 'Master the fundamentals: hand strength, position, equity, and ranges.', 'foundations', progress)}
        ${renderStageCard(2, 'Drills', 'Practice with rapid-fire exercises to build muscle memory.', 'drills', progress)}
        ${renderStageCard(3, 'Scenarios', 'Apply your knowledge in realistic multi-street situations.', 'scenarios', progress)}
        ${renderStageCard(4, 'Full Hands', 'Play complete hands with GTO feedback on every decision.', 'full-hands', progress, true)}
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

      <p class="home__open-source animate-fade-in-up stagger-4">
        Free and open source. No tracking, no ads, no accounts.
        <a href="https://github.com/rdpharr/libregto" target="_blank" rel="noopener noreferrer">View on GitHub</a>
      </p>
    </div>
  `;
}

/**
 * Render a stage card
 */
function renderStageCard(number, title, description, stageId, progress, comingSoon = false) {
  const unlocked = !comingSoon && isStageUnlocked(stageId);
  const stageProgress = comingSoon ? 0 : getStageProgress(stageId);
  const completed = stageProgress === 100;

  return `
    <div class="stage-card ${!unlocked ? 'stage-card--locked' : ''} ${completed ? 'stage-card--completed' : ''} ${comingSoon ? 'stage-card--coming-soon' : ''} animate-fade-in-up stagger-${number}"
         ${unlocked ? `onclick="window.location.hash='#/${stageId}'"` : ''}>
      ${comingSoon ? '<span class="stage-card__badge">Coming Soon</span>' : ''}
      ${!unlocked && !comingSoon ? '<span class="stage-card__lock-icon">🔒</span>' : ''}
      <div class="stage-card__number">${number}</div>
      <div class="stage-card__title">${title}</div>
      <div class="stage-card__description">${description}</div>
      ${comingSoon ? '' : `
      <div class="stage-card__progress">
        <div class="progress">
          <div class="progress__bar" style="width: ${stageProgress}%"></div>
        </div>
        <div class="text-sm text-secondary mt-2">${stageProgress}% complete</div>
      </div>
      `}
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
async function renderModulePage(params) {
  const moduleId = params.id;

  switch (moduleId) {
    case 'hand-strength': {
      const { renderHandStrengthModule } = await import('./modules/handStrength.js');
      renderHandStrengthModule(mainContent);
      break;
    }
    case 'position': {
      const { renderPositionModule } = await import('./modules/position.js');
      renderPositionModule(mainContent);
      break;
    }
    case 'equity': {
      const { renderEquityModule } = await import('./modules/equity.js');
      renderEquityModule(mainContent);
      break;
    }
    case 'ranges': {
      const { renderRangesModule } = await import('./modules/ranges.js');
      renderRangesModule(mainContent);
      break;
    }
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
        <button class="btn btn--secondary" onclick="if(confirm('Are you sure? This will delete all your progress.')) { localStorage.removeItem('libregto-progress'); location.reload(); }">
          Reset All Progress
        </button>
      </div>

      <div class="divider"></div>

      <div class="lesson__section">
        <h3 class="lesson__subtitle">About</h3>
        <p class="lesson__text">
          LibreGTO is a 100% free, open source GTO poker trainer. Unlike paid alternatives like GTO Wizard
          or DTO Poker, LibreGTO has no subscription fees and never will. The concepts taught here help you
          understand GTO (Game Theory Optimal) poker strategy fundamentals.
        </p>
        <p class="lesson__text mt-4">
          <a href="#/methodology" class="link">Our Methodology</a>
          &nbsp;&middot;&nbsp;
          <a href="https://github.com/rdpharr/libregto/issues" target="_blank" rel="noopener" class="link">Report an Issue</a>
          &nbsp;&middot;&nbsp;
          <a href="https://buymeacoffee.com/rdpharr" target="_blank" rel="noopener" class="link link--coffee">Buy me a coffee ☕</a>
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
        <h1 class="page-header__title">How LibreGTO Works</h1>
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
          <a href="#/methodology" class="btn btn--secondary btn--lg" style="margin-left: var(--space-3);">Our Methodology</a>
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

/**
 * Render a drill page
 */
async function renderDrillPage(params) {
  const drillId = params.id;

  switch (drillId) {
    case 'hand-ranking': {
      const { renderHandRankingDrill } = await import('./drills/handRankDrill.js');
      renderHandRankingDrill(mainContent);
      break;
    }
    case 'open-fold': {
      const { renderOpenFoldDrill } = await import('./drills/openFoldDrill.js');
      renderOpenFoldDrill(mainContent);
      break;
    }
    case 'equity-snap': {
      const { renderEquitySnapDrill } = await import('./drills/equitySnapDrill.js');
      renderEquitySnapDrill(mainContent);
      break;
    }
    case 'range-check': {
      const { renderRangeCheckDrill } = await import('./drills/rangeCheckDrill.js');
      renderRangeCheckDrill(mainContent);
      break;
    }
    case 'position-speed': {
      const { renderPositionDrill } = await import('./drills/positionDrill.js');
      renderPositionDrill(mainContent);
      break;
    }
    default:
      render404();
  }
}

/**
 * Render a scenario page
 */
async function renderScenarioPage(params) {
  const scenarioId = params.id;

  switch (scenarioId) {
    case 'defend-3bet': {
      const { renderDefendVs3BetScenario } = await import('./scenarios/preflopDefend3bet.js');
      renderDefendVs3BetScenario(mainContent);
      break;
    }
    case 'bb-defense': {
      const { renderBBDefenseScenario } = await import('./scenarios/preflopBBDefense.js');
      renderBBDefenseScenario(mainContent);
      break;
    }
    case '3bet-value': {
      const { render3BetValueScenario } = await import('./scenarios/preflop3betValue.js');
      render3BetValueScenario(mainContent);
      break;
    }
    case 'sb-3bet-fold': {
      const { renderSB3BetOrFoldScenario } = await import('./scenarios/preflopSB3betOrFold.js');
      renderSB3BetOrFoldScenario(mainContent);
      break;
    }
    case 'cold-4bet': {
      const { renderCold4BetScenario } = await import('./scenarios/preflopCold4bet.js');
      renderCold4BetScenario(mainContent);
      break;
    }
    case 'board-texture': {
      const { renderBoardTextureScenario } = await import('./scenarios/postflopBoardTexture.js');
      renderBoardTextureScenario(mainContent);
      break;
    }
    default:
      render404();
  }
}

// Register routes
router.register('/', renderHomePage);
router.register('/foundations', renderFoundationsPage);
router.register('/module/:id', renderModulePage);
router.register('/drills', async () => {
  const { renderDrillsHub } = await import('./drills/index.js');
  renderDrillsHub(mainContent);
});
router.register('/drill/:id', renderDrillPage);
router.register('/settings', renderSettingsPage);
router.register('/about', renderAboutPage);
router.register('/scenarios', async () => {
  const { renderScenariosHub } = await import('./scenarios/index.js');
  renderScenariosHub(mainContent);
});
router.register('/scenario/:id', renderScenarioPage);
router.register('/methodology', async () => {
  const { renderMethodologyPage } = await import('./pages/methodology.js');
  renderMethodologyPage(mainContent);
});
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
