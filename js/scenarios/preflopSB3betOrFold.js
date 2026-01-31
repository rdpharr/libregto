/**
 * Scenario 3.4: SB 3-Bet or Fold
 * Setup: Villain opens, you're in SB
 * Decisions: 3-bet / Fold (NO calling option - per GTO consensus)
 *
 * Key concept: From the SB, you should rarely call. Either 3-bet or fold.
 * Calling from SB is -EV due to playing OOP with no closing action.
 *
 * Sources: GTO Wizard, Upswing Poker, PokerCoaching.com
 */

import { ScenarioEngine, randomPick } from './ScenarioEngine.js';
import { renderScenarioQuestion, showScenarioFeedback } from '../components/ScenarioDisplay.js';
import { generateOpenActions } from '../components/ActionHistory.js';
import { createDifficultySelector } from '../components/DifficultySelector.js';
import { showCountdown } from '../components/Countdown.js';
import { updateStartScreenForDifficulty } from '../utils/difficultyUtils.js';
import { isScenarioUnlocked, getScenarioProgress, getScenarioThreshold, isScenarioHardModeUnlocked } from '../storage.js';
import { SB_3BET_OR_FOLD, isHandInRange, getRangeBreakdown } from '../data/scenarioRanges.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = 'sb-3bet-fold';
const SCENARIO_NAME = 'SB: 3-Bet or Fold';

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  easy: {
    totalQuestions: 20,
    threeBetChance: 0.45,
    // Remaining ~55% are fold hands
    passThreshold: 75
  },
  hard: {
    totalQuestions: 25,
    threeBetChance: 0.55,  // More 3-bet hands (harder decisions)
    useMarginalFolds: true,
    passThreshold: 80
  }
};

let selectedDifficulty = 'easy';

// Opener positions
const OPENERS = [
  { position: 'BTN', key: 'vs_BTN', openSize: 2.5 },
  { position: 'CO', key: 'vs_CO', openSize: 2.5 },
  { position: 'MP', key: 'vs_MP', openSize: 2.5 },
  { position: 'UTG', key: 'vs_UTG', openSize: 2.5 }
];

let engine = null;
let container = null;

/**
 * Render the SB 3-bet or fold scenario
 */
export function renderSB3BetOrFoldScenario(containerElement) {
  container = containerElement;

  if (!isScenarioUnlocked(SCENARIO_ID)) {
    renderLockedState();
    return;
  }

  renderStartScreen();
}

/**
 * Render locked state
 */
function renderLockedState() {
  container.innerHTML = `
    <div class="container scenario-locked">
      <h1 class="display-md mb-4">Scenario Locked</h1>
      <p class="text-lg text-secondary mb-8">Unlock the Scenarios stage to access this content.</p>
      <a href="#/scenarios" class="btn btn--primary">Back to Scenarios</a>
    </div>
  `;
}

/**
 * Render start screen
 */
function renderStartScreen() {
  const progress = getScenarioProgress(SCENARIO_ID);
  const hardUnlocked = isScenarioHardModeUnlocked(SCENARIO_ID);
  const config = DIFFICULTY_CONFIG[selectedDifficulty];
  const threshold = config.passThreshold;

  const currentStats = selectedDifficulty === 'hard' && progress?.hard
    ? progress.hard
    : progress;

  container.innerHTML = `
    <div class="drill-start container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <a href="#/scenarios" class="breadcrumb__link">Scenarios</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">${SCENARIO_NAME}</span>
        </nav>
        <h1 class="page-header__title">${SCENARIO_NAME}</h1>
        <p class="page-header__subtitle">From the SB: 3-bet or fold (rarely call)</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">&#x1F3AF;</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            From the small blind, GTO strategy recommends <strong>3-betting or folding</strong>.
            Calling is rarely correct because you'll play OOP against both the opener and BB.
            This scenario teaches the binary SB decision.
          </p>
          <div class="drill-start__meta" id="drill-meta">
            <span>${config.totalQuestions} questions</span>
            <span>Pass: ${threshold}%</span>
          </div>
        </div>

        <div id="difficulty-selector-container"></div>

        ${currentStats && (currentStats.attempts > 0 || (progress?.hard?.attempts > 0)) ? `
          <div class="drill-start__best" id="best-stats">
            <div class="drill-start__best-title">Your Best</div>
            <div class="drill-start__best-stats">
              <span>Score: ${Math.round(currentStats.bestScore || 0)}%</span>
              <span>Attempts: ${currentStats.attempts || 0}</span>
            </div>
          </div>
        ` : ''}

        <button class="btn btn--primary btn--lg drill-start__btn" id="start-scenario-btn">
          Start Scenario
        </button>
      </div>
    </div>
  `;

  // Render difficulty selector
  const selectorContainer = document.getElementById('difficulty-selector-container');
  const selector = createDifficultySelector({
    selected: selectedDifficulty,
    hardUnlocked: hardUnlocked,
    easyStats: progress ? { bestScore: progress.bestScore } : null,
    hardStats: progress?.hard ? { bestScore: progress.hard.bestScore } : null,
    onSelect: (difficulty) => {
      selectedDifficulty = difficulty;
      updateStartScreenForDifficulty(DIFFICULTY_CONFIG[difficulty], difficulty, progress, { showStreak: false, showTime: false, showAttempts: true });
    }
  });
  selectorContainer.appendChild(selector);

  document.getElementById('start-scenario-btn').addEventListener('click', startScenario);
}

/**
 * Start the scenario
 */
function startScenario() {
  const config = DIFFICULTY_CONFIG[selectedDifficulty];

  engine = new ScenarioEngine(
    {
      id: SCENARIO_ID,
      name: SCENARIO_NAME,
      totalQuestions: config.totalQuestions,
      generateQuestion: generateQuestion,
      validateAnswer: validateAnswer,
      getExplanation: getExplanation,
      getRangeDisplay: getRangeDisplay
    },
    {
      onQuestionReady: onQuestionReady,
      onAnswerResult: onAnswerResult,
      onScenarioEnd: onScenarioEnd
    },
    selectedDifficulty
  );

  showCountdown(container, () => {
    engine.start();
  });
}

/**
 * Generate a question
 */
function generateQuestion(state) {
  const config = DIFFICULTY_CONFIG[selectedDifficulty];
  const opener = randomPick(OPENERS);
  const rangeData = SB_3BET_OR_FOLD[opener.key];

  let hand;
  const roll = Math.random();

  // Balance between 3-bet hands and fold hands based on difficulty
  if (roll < config.threeBetChance && rangeData.threeBet.length > 0) {
    hand = randomPick(rangeData.threeBet);
  } else {
    hand = generateFoldHand(rangeData, config.useMarginalFolds);
  }

  const potSize = opener.openSize + 0.5 + 1;

  return {
    opener,
    hand,
    rangeData,
    potSize,
    effectiveStack: 99.5, // 100 - 0.5BB posted
    category: opener.key
  };
}

/**
 * Generate a fold hand
 * @param {Object} rangeData - The range data for this matchup
 * @param {boolean} useMarginalFolds - If true, only use marginal fold hands (harder)
 */
function generateFoldHand(rangeData, useMarginalFolds = false) {
  const threeBetHands = rangeData.threeBet || [];

  // Marginal fold hands (close to 3-betting range - harder)
  const marginalFoldHands = [
    'KTo', 'K9o', 'K8o',
    'QJo', 'QTo', 'Q9o',
    'JTo', 'J9o',
    'T9o', 'T8o',
    '98o', '97o',
    '87o', '86o',
    'K9s', 'K8s',
    'Q9s', 'Q8s',
    'J8s', 'J7s',
    'T7s', 'T6s',
    '97s', '96s',
    '86s', '85s',
    '99', '88', '77'
  ];

  // Clear fold hands (easier)
  const clearFoldHands = [
    'K7o', 'K6o', 'K5o',
    'Q8o', 'Q7o', 'Q6o',
    'J8o', 'J7o', 'J6o',
    'T7o', 'T6o',
    '96o', '95o',
    '76o', '75o',
    '65o', '64o',
    '54o', '53o',
    'K7s', 'K6s',
    'Q7s', 'Q6s',
    'J6s', 'J5s',
    'T5s', 'T4s',
    '95s', '94s',
    '84s', '83s',
    '75s', '74s',
    '64s', '63s',
    '53s', '52s',
    '66', '55', '44', '33', '22'
  ];

  // Use marginal hands only in hard mode, otherwise mix both
  const foldPool = useMarginalFolds ? marginalFoldHands : [...marginalFoldHands, ...clearFoldHands];

  const actualFolds = foldPool.filter(h => !threeBetHands.includes(h));

  if (actualFolds.length > 0) {
    return randomPick(actualFolds);
  }

  return randomPick(['K8o', 'Q9o', 'J9o', 'T8o', '97o']);
}

/**
 * Validate an answer
 */
function validateAnswer(answer, questionData) {
  const { hand, rangeData } = questionData;

  const is3Bet = isHandInRange(hand, rangeData.threeBet);
  const correctAction = is3Bet ? '3-bet' : 'Fold';

  const normalizedAnswer = normalizeAction(answer);
  const normalizedCorrect = normalizeAction(correctAction);

  return {
    correct: normalizedAnswer === normalizedCorrect,
    correctAnswer: correctAction
  };
}

/**
 * Normalize action names
 */
function normalizeAction(action) {
  const lower = action.toLowerCase().replace(/[- ]/g, '');
  if (lower === '3bet' || lower === 'threebet') return '3bet';
  if (lower === 'fold') return 'fold';
  return lower;
}

/**
 * Get explanation
 */
function getExplanation(questionData, validation) {
  const { hand, opener, rangeData } = questionData;
  const { correctAnswer } = validation;

  const explanations = {
    '3-bet': {
      text: `${hand} is strong enough to 3-bet from SB vs ${opener.position}.`,
      points: [
        'This hand has enough equity to 3-bet and isolate',
        'Blockers (like Ax hands) reduce opponent\'s strong holdings',
        '3-betting allows you to take initiative despite being OOP'
      ]
    },
    'Fold': {
      text: `${hand} isn't strong enough to 3-bet from SB vs ${opener.position}.`,
      points: [
        'This hand plays poorly OOP against the opener\'s range',
        'Calling from SB is rarely correct - you\'ll be OOP vs everyone',
        `Against ${opener.position}'s ${opener.position === 'UTG' ? 'tight' : opener.position === 'BTN' ? 'wide' : 'medium'} range, fold is correct`
      ]
    }
  };

  return explanations[correctAnswer] || { text: `The correct action is ${correctAnswer}.` };
}

/**
 * Get range display
 */
function getRangeDisplay(questionData) {
  const { rangeData, opener } = questionData;

  return {
    title: `SB vs ${opener.position} Open`,
    items: [
      { action: '3-bet', hands: rangeData.threeBet.join(', ') },
      { action: 'Fold', hands: 'Everything else (rarely call!)' }
    ]
  };
}

/**
 * Handle question ready
 */
function onQuestionReady(data) {
  const { questionNumber, totalQuestions, questionData } = data;

  const actions = generateOpenActions(questionData.opener.position, questionData.opener.openSize);

  renderScenarioQuestion(container, {
    scenarioName: SCENARIO_NAME,
    questionNumber,
    totalQuestions,
    heroPosition: 'SB',
    heroHand: questionData.hand,
    actionHistory: actions,
    potSize: questionData.potSize,
    effectiveStack: questionData.effectiveStack,
    difficulty: selectedDifficulty,
    decisions: [
      { action: '3-bet', label: '3-BET', detail: '~10BB' },
      { action: 'Fold', label: 'FOLD' }
    ],
    prompt: `${questionData.opener.position} opens. You're in SB. 3-bet or fold?`,
    whyItMatters: `
      <p class="scenario-why-text">
        <strong>Why no call option?</strong> From the SB, calling is almost always -EV. You'll be out of
        position against both the opener and the BB (who can squeeze). GTO solvers show SB should
        3-bet or fold almost always. This simplified approach is much more profitable than flatting.
      </p>
    `,
    onDecision: handleDecision,
    onQuit: quitScenario
  });
}

/**
 * Handle decision
 */
function handleDecision(action) {
  if (!engine || !engine.isActive()) return;

  const result = engine.submitAnswer(action);

  if (result) {
    showScenarioFeedback(container, {
      ...result,
      onNext: () => {
        engine.nextQuestion();
      }
    });
  }
}

function onAnswerResult(result) {}

/**
 * Handle scenario end
 */
function onScenarioEnd(data) {
  const { stats, previousBest, passed, passThreshold, categoryStats } = data;

  container.innerHTML = '<div class="drill-results-container"></div>';

  const results = new DrillResults({
    drillId: SCENARIO_ID,
    drillName: SCENARIO_NAME,
    previousBest,
    onPlayAgain: () => renderSB3BetOrFoldScenario(container),
    onNextDrill: () => { window.location.hash = '#/scenario/cold-4bet'; },
    onBackToHub: () => { window.location.hash = '#/scenarios'; },
    nextLabel: 'Next Scenario'
  });

  results.render(container.querySelector('.drill-results-container'), {
    accuracy: stats.accuracy,
    avgTime: stats.avgTime,
    fastestTime: stats.fastestTime,
    bestStreak: 0,
    correct: stats.correct,
    total: stats.total,
    passed,
    passThreshold
  });

  addOpenerBreakdown(categoryStats);
}

/**
 * Add opener breakdown
 */
function addOpenerBreakdown(categoryStats) {
  const resultsContent = container.querySelector('.drill-results__content');
  if (!resultsContent) return;

  const categories = Object.entries(categoryStats);
  if (categories.length === 0) return;

  const breakdownHtml = `
    <div class="drill-results__breakdown">
      <h4 class="drill-results__breakdown-title">Accuracy by Opener</h4>
      <div class="drill-results__breakdown-grid">
        ${categories.map(([key, stats]) => {
          const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
          const pos = key.replace('vs_', '');
          return `
            <div class="drill-results__breakdown-item">
              <span class="drill-results__breakdown-pos">vs ${pos}</span>
              <span class="drill-results__breakdown-value ${pct >= 75 ? 'drill-results__breakdown-value--good' : ''}">${pct}%</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  const actions = resultsContent.querySelector('.drill-results__actions');
  if (actions) {
    actions.insertAdjacentHTML('beforebegin', breakdownHtml);
  }
}

function quitScenario() {
  if (engine) engine.stop();
  window.location.hash = '#/scenarios';
}
