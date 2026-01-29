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
import { isScenarioUnlocked, getScenarioProgress, getScenarioThreshold } from '../storage.js';
import { VALUE_3BET, isHandInRange } from '../data/scenarioRanges.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = '3bet-value';
const SCENARIO_NAME = '3-Bet for Value';
const TOTAL_QUESTIONS = 20;

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
  const previousBest = getScenarioProgress(SCENARIO_ID);
  const threshold = getScenarioThreshold(SCENARIO_ID);

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
          <div class="drill-start__meta">
            <span>${TOTAL_QUESTIONS} questions</span>
            <span>Pass: ${threshold}%</span>
          </div>
        </div>

        ${previousBest && previousBest.attempts > 0 ? `
          <div class="drill-start__best">
            <div class="drill-start__best-title">Your Best</div>
            <div class="drill-start__best-stats">
              <span>Score: ${Math.round(previousBest.bestScore)}%</span>
              <span>Attempts: ${previousBest.attempts}</span>
            </div>
          </div>
        ` : ''}

        <button class="btn btn--primary btn--lg drill-start__btn" id="start-scenario-btn">
          Start Scenario
        </button>
      </div>
    </div>
  `;

  document.getElementById('start-scenario-btn').addEventListener('click', startScenario);
}

/**
 * Start the scenario
 */
function startScenario() {
  engine = new ScenarioEngine(
    {
      id: SCENARIO_ID,
      name: SCENARIO_NAME,
      totalQuestions: TOTAL_QUESTIONS,
      generateQuestion: generateQuestion,
      validateAnswer: validateAnswer,
      getExplanation: getExplanation,
      getRangeDisplay: getRangeDisplay
    },
    {
      onQuestionReady: onQuestionReady,
      onAnswerResult: onAnswerResult,
      onScenarioEnd: onScenarioEnd
    }
  );

  showCountdown(() => {
    engine.start();
  });
}

/**
 * Show countdown
 */
function showCountdown(callback) {
  const overlay = document.createElement('div');
  overlay.className = 'drill-countdown';
  overlay.innerHTML = '<div class="drill-countdown__number">3</div>';
  container.appendChild(overlay);

  let count = 3;
  const countdownEl = overlay.querySelector('.drill-countdown__number');

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
      countdownEl.classList.remove('drill-countdown__number--pulse');
      void countdownEl.offsetWidth;
      countdownEl.classList.add('drill-countdown__number--pulse');
    } else if (count === 0) {
      countdownEl.textContent = 'GO!';
      countdownEl.classList.add('drill-countdown__number--go');
    } else {
      clearInterval(interval);
      overlay.remove();
      callback();
    }
  }, 800);
}

/**
 * Generate a question
 */
function generateQuestion(state) {
  const spot = randomPick(SPOTS);
  const rangeData = VALUE_3BET[spot.key];

  let hand;
  let correctAction;
  const roll = Math.random();

  // Mix of value 3-bets, calls, and folds
  if (roll < 0.35 && rangeData.value3bet.length > 0) {
    hand = randomPick(rangeData.value3bet);
    correctAction = '3-bet';
  } else if (roll < 0.55) {
    // Call hands - decent hands that aren't value 3-bets
    hand = randomPick(getCallHands(spot));
    correctAction = 'Call';
  } else {
    // Fold hands
    hand = randomPick(getFoldHands());
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
 */
function getCallHands(spot) {
  // Hands that are good enough to continue but not value 3-bet
  const callHands = [
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

  return callHands;
}

/**
 * Get fold hands
 */
function getFoldHands() {
  return [
    'K8o', 'K7o', 'K6o', 'K5o',
    'Q9o', 'Q8o', 'Q7o',
    'J8o', 'J7o', 'J6o',
    'T7o', 'T6o',
    '96o', '95o',
    '85o', '84o',
    '74o', '73o',
    '63o', '62o',
    '52o', '53o',
    '42o', '43o',
    'K6s', 'K5s', 'K4s',
    'Q6s', 'Q5s', 'Q4s',
    'J6s', 'J5s',
    'T5s', 'T4s',
    '94s', '93s',
    '84s', '83s',
    '55', '44', '33', '22' // Small pairs fold vs EP
  ];
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
