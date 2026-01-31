/**
 * Scenario 3.3: 3-Bet for Value
 * Setup: Villain opens, should you 3-bet for value?
 * Decisions: 3-bet / Call / Fold
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
import { VALUE_3BET, isHandInRange } from '../data/scenarioRanges.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = '3bet-value';
const SCENARIO_NAME = '3-Bet for Value';

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  easy: {
    totalQuestions: 20,
    value3betChance: 0.35,
    callChance: 0.20,
    // Remaining ~45% are fold hands
    passThreshold: 75
  },
  hard: {
    totalQuestions: 25,
    value3betChance: 0.30,  // Lower - more borderline hands
    callChance: 0.30,       // More call hands (harder to distinguish)
    useMarginalHands: true,
    passThreshold: 80
  }
};

let selectedDifficulty = 'easy';

// Spot configurations
const SPOTS = [
  { hero: 'BB', opener: 'BTN', key: 'BB_vs_steal', openSize: 2.5 },
  { hero: 'BB', opener: 'CO', key: 'BB_vs_steal', openSize: 2.5 },
  { hero: 'SB', opener: 'BTN', key: 'SB_vs_BTN', openSize: 2.5 },
  { hero: 'CO', opener: 'UTG', key: 'CO_vs_EP', openSize: 2.5 },
  { hero: 'CO', opener: 'MP', key: 'CO_vs_EP', openSize: 2.5 },
  { hero: 'BTN', opener: 'CO', key: 'BTN_vs_open', openSize: 2.5 },
  { hero: 'BTN', opener: 'MP', key: 'BTN_vs_open', openSize: 2.5 }
];

let engine = null;
let container = null;

/**
 * Render the 3-bet for value scenario
 */
export function render3BetValueScenario(containerElement) {
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
        <p class="page-header__subtitle">Identify when to 3-bet for value</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">&#x1F4B8;</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            Villain opens. Identify which hands to <strong>3-bet for value</strong> vs
            which to <strong>call</strong> or <strong>fold</strong>. Focus on building pots with premiums.
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
  const spot = randomPick(SPOTS);
  const rangeData = VALUE_3BET[spot.key];

  let hand;
  let correctAction;
  const roll = Math.random();

  const value3betThreshold = config.value3betChance;
  const callThreshold = value3betThreshold + config.callChance;

  // Mix of value 3-bets, calls, and folds
  if (roll < value3betThreshold && rangeData.value3bet.length > 0) {
    hand = randomPick(rangeData.value3bet);
    correctAction = '3-bet';
  } else if (roll < callThreshold) {
    // Call hands - decent hands that aren't value 3-bets
    hand = randomPick(getCallHands(spot, config.useMarginalHands));
    correctAction = 'Call';
  } else {
    // Fold hands
    hand = randomPick(getFoldHands(config.useMarginalHands));
    correctAction = 'Fold';
  }

  const potSize = spot.openSize + 0.5 + 1;

  return {
    spot,
    hand,
    rangeData,
    correctAction,
    potSize,
    effectiveStack: spot.hero === 'BB' ? 99 : spot.hero === 'SB' ? 99.5 : 100,
    category: spot.key
  };
}

/**
 * Get call hands based on spot
 * @param {Object} spot - The spot configuration
 * @param {boolean} useMarginalHands - If true, include more borderline hands (harder)
 */
function getCallHands(spot, useMarginalHands = false) {
  // Standard call hands
  const standardCallHands = [
    'TT', '99', '88', '77', '66',
    'AJs', 'ATs', 'A9s',
    'KQs', 'KJs', 'KTs',
    'QJs', 'QTs',
    'JTs', 'J9s',
    'T9s', 'T8s',
    '98s', '97s',
    '87s', '86s',
    '76s',
    'AQo', 'AJo', 'ATo',
    'KQo', 'KJo'
  ];

  // Marginal call hands (harder to categorize)
  const marginalCallHands = [
    'A8s', 'A7s', 'A6s',
    'K9s', 'K8s',
    'Q9s', 'Q8s',
    'J8s',
    'T7s',
    '97s', '96s',
    '86s', '85s',
    '75s', '74s',
    '65s', '64s',
    '55', '44',
    'KTo', 'QJo', 'QTo'
  ];

  if (useMarginalHands) {
    return [...standardCallHands, ...marginalCallHands];
  }

  return standardCallHands;
}

/**
 * Get fold hands
 * @param {boolean} useMarginalHands - If true, only use marginal fold hands (harder)
 */
function getFoldHands(useMarginalHands = false) {
  // Marginal fold hands (close to calling range - harder)
  const marginalFoldHands = [
    'K9o', 'K8o', 'K7o',
    'Q9o', 'Q8o',
    'J9o', 'J8o',
    'T8o', 'T7o',
    '98o', '97o',
    '87o', '86o',
    'K7s', 'K6s',
    'Q7s', 'Q6s',
    'J7s', 'J6s',
    'T6s', 'T5s'
  ];

  // Clear fold hands (easier)
  const clearFoldHands = [
    'K6o', 'K5o', 'K4o',
    'Q7o', 'Q6o', 'Q5o',
    'J7o', 'J6o', 'J5o',
    'T6o', 'T5o',
    '96o', '95o',
    '85o', '84o',
    '74o', '73o',
    '63o', '62o',
    '52o', '53o',
    '42o', '43o',
    'K5s', 'K4s',
    'Q5s', 'Q4s',
    'J5s', 'J4s',
    'T4s', 'T3s',
    '94s', '93s',
    '84s', '83s',
    '33', '22'
  ];

  if (useMarginalHands) {
    return marginalFoldHands;
  }

  return [...marginalFoldHands, ...clearFoldHands];
}

/**
 * Validate an answer
 */
function validateAnswer(answer, questionData) {
  const normalizedAnswer = normalizeAction(answer);
  const normalizedCorrect = normalizeAction(questionData.correctAction);

  return {
    correct: normalizedAnswer === normalizedCorrect,
    correctAnswer: questionData.correctAction
  };
}

/**
 * Normalize action names
 */
function normalizeAction(action) {
  const lower = action.toLowerCase().replace(/[- ]/g, '');
  if (lower === '3bet' || lower === 'threebet') return '3bet';
  if (lower === 'call') return 'call';
  if (lower === 'fold') return 'fold';
  return lower;
}

/**
 * Get explanation
 */
function getExplanation(questionData, validation) {
  const { hand, spot, correctAction } = questionData;

  const explanations = {
    '3-bet': {
      text: `${hand} is strong enough to 3-bet for value from ${spot.hero} vs ${spot.opener}'s open.`,
      points: [
        'Premium hands should build pots by 3-betting',
        'Value 3-betting denies equity to weaker hands',
        'You\'ll often get called by worse or fold out hands with equity'
      ]
    },
    'Call': {
      text: `${hand} is playable but not strong enough to 3-bet for value.`,
      points: [
        'This hand has value but doesn\'t dominate opener\'s calling range',
        'Calling keeps in hands you beat while avoiding bloating the pot',
        'Postflop playability is important for calling hands'
      ]
    },
    'Fold': {
      text: `${hand} isn't strong enough to continue vs ${spot.opener}'s opening range.`,
      points: [
        'This hand doesn\'t have enough equity against opener\'s range',
        'Calling leads to difficult postflop situations',
        'Save chips for better spots'
      ]
    }
  };

  return explanations[correctAction] || { text: `The correct action is ${correctAction}.` };
}

/**
 * Get range display
 */
function getRangeDisplay(questionData) {
  const { rangeData, spot } = questionData;

  return {
    title: `${spot.hero} vs ${spot.opener} Open`,
    items: [
      { action: '3-bet Value', hands: rangeData.value3bet.join(', ') },
      { action: '3-bet Bluff', hands: (rangeData.bluff3bet || []).join(', ') || 'A5s-A2s (blockers)' },
      { action: 'Call/Fold', hands: 'Everything else' }
    ]
  };
}

/**
 * Handle question ready
 */
function onQuestionReady(data) {
  const { questionNumber, totalQuestions, questionData } = data;

  const actions = generateOpenActions(questionData.spot.opener, questionData.spot.openSize);

  renderScenarioQuestion(container, {
    scenarioName: SCENARIO_NAME,
    questionNumber,
    totalQuestions,
    heroPosition: questionData.spot.hero,
    heroHand: questionData.hand,
    actionHistory: actions,
    potSize: questionData.potSize,
    effectiveStack: questionData.effectiveStack,
    difficulty: selectedDifficulty,
    decisions: [
      { action: '3-bet', label: '3-BET', detail: 'For value' },
      { action: 'Call', label: 'CALL' },
      { action: 'Fold', label: 'FOLD' }
    ],
    prompt: `${questionData.spot.opener} opens. Should you 3-bet ${questionData.hand} for value?`,
    whyItMatters: `
      <p class="scenario-why-text">
        Knowing which hands to 3-bet for value is crucial. 3-betting too wide turns value hands into bluffs,
        while 3-betting too tight misses value with premiums. The correct range depends on your position
        and the opener's range.
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
    onPlayAgain: () => render3BetValueScenario(container),
    onNextDrill: () => { window.location.hash = '#/scenario/sb-3bet-fold'; },
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
}

function quitScenario() {
  if (engine) engine.stop();
  window.location.hash = '#/scenarios';
}
