/**
 * Scenario 3.5: Cold 4-Bet Spots
 * Setup: Player opens, another 3-bets, action to you
 * Decisions: 4-bet / Fold (NO calling - "rarely cold call" per GTO)
 *
 * This is a SIMPLIFIED scenario. Cold 4-bet ranges are ultra-tight.
 * The correct answer is almost always FOLD unless you have AA or KK.
 *
 * Sources: GTO Wizard (consensus: "rarely cold call")
 */

import { ScenarioEngine, randomPick } from './ScenarioEngine.js';
import { renderScenarioQuestion, showScenarioFeedback } from '../components/ScenarioDisplay.js';
import { generateThreeBetActions } from '../components/ActionHistory.js';
import { isScenarioUnlocked, getScenarioProgress, getScenarioThreshold } from '../storage.js';
import { COLD_4BET, isHandInRange } from '../data/scenarioRanges.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = 'cold-4bet';
const SCENARIO_NAME = 'Cold 4-Bet Spots';
const TOTAL_QUESTIONS = 20;

// Cold 4-bet spots
const SPOTS = [
  { opener: 'UTG', threeBetter: 'MP', hero: 'CO', ip: true },
  { opener: 'UTG', threeBetter: 'MP', hero: 'BTN', ip: true },
  { opener: 'MP', threeBetter: 'CO', hero: 'BTN', ip: true },
  { opener: 'CO', threeBetter: 'BTN', hero: 'SB', ip: false },
  { opener: 'CO', threeBetter: 'BTN', hero: 'BB', ip: false },
  { opener: 'BTN', threeBetter: 'SB', hero: 'BB', ip: false }
];

let engine = null;
let container = null;

/**
 * Render the cold 4-bet scenario
 */
export function renderCold4BetScenario(containerElement) {
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
      <p class="text-lg text-secondary mb-8">Complete 2 Tier 1 scenarios at 75%+ to unlock this one.</p>
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
        <p class="page-header__subtitle">Someone opens, another 3-bets. What now?</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">&#x1F525;</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            This is a <strong>simplified scenario</strong>. When facing an open and a 3-bet,
            cold 4-bet or fold. Cold calling is rarely correct.
            <br><br>
            <em>Hint: The answer is almost always FOLD. Only 4-bet with AA/KK.</em>
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
  const rangeKey = spot.ip ? 'IP' : 'OOP';
  const rangeData = COLD_4BET[rangeKey];

  let hand;
  const roll = Math.random();

  // Only ~10% should be 4-bet hands (AA, KK)
  if (roll < 0.10) {
    hand = randomPick(rangeData.fourBet);
  } else {
    // 90% fold hands
    hand = generateFoldHand();
  }

  // Calculate pot size after open + 3-bet
  const openSize = 2.5;
  const threeBetSize = 8;
  const potSize = openSize + threeBetSize + 0.5 + 1;

  return {
    spot,
    hand,
    rangeData,
    rangeKey,
    potSize,
    effectiveStack: 100 - (spot.hero === 'SB' ? 0.5 : spot.hero === 'BB' ? 1 : 0),
    category: spot.ip ? 'IP' : 'OOP'
  };
}

/**
 * Generate a fold hand (vast majority of hands)
 */
function generateFoldHand() {
  // Everything except AA and KK
  const foldHands = [
    // Good hands that still fold
    'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
    'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
    'AKo', 'AQo', 'AJo', 'ATo',
    'KQs', 'KJs', 'KTs', 'K9s',
    'KQo', 'KJo',
    'QJs', 'QTs', 'Q9s',
    'QJo', 'QTo',
    'JTs', 'J9s',
    'JTo',
    'T9s', 'T8s',
    '98s', '97s',
    '87s', '86s',
    '76s', '75s',
    '65s', '64s',
    '54s'
  ];

  return randomPick(foldHands);
}

/**
 * Validate an answer
 */
function validateAnswer(answer, questionData) {
  const { hand, rangeData } = questionData;

  const is4Bet = isHandInRange(hand, rangeData.fourBet);
  const correctAction = is4Bet ? '4-bet' : 'Fold';

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
  if (lower === '4bet' || lower === 'fourbet') return '4bet';
  if (lower === 'fold') return 'fold';
  return lower;
}

/**
 * Get explanation
 */
function getExplanation(questionData, validation) {
  const { hand, spot } = questionData;
  const { correctAnswer } = validation;

  const explanations = {
    '4-bet': {
      text: `${hand} is strong enough to cold 4-bet.`,
      points: [
        'AA and KK are the only hands strong enough to cold 4-bet',
        'You\'re facing both an opener\'s range and a 3-bettor\'s range',
        'These premium hands dominate both ranges'
      ]
    },
    'Fold': {
      text: `${hand} should fold facing an open and 3-bet.`,
      points: [
        'Even strong hands like QQ/AK are often folds in this spot',
        'You\'re facing two strong ranges - the opener and 3-bettor',
        'Cold calling is -EV, and 4-betting would be as a bluff',
        '"If you\'re not sure, fold is rarely wrong here"'
      ]
    }
  };

  return explanations[correctAnswer] || { text: `The correct action is ${correctAnswer}.` };
}

/**
 * Get range display
 */
function getRangeDisplay(questionData) {
  const { rangeData, spot } = questionData;

  return {
    title: `Cold 4-Bet Range (${spot.ip ? 'In Position' : 'Out of Position'})`,
    items: [
      { action: '4-bet', hands: rangeData.fourBet.join(', ') },
      { action: 'Fold', hands: 'Everything else (~95%+ of hands!)' }
    ]
  };
}

/**
 * Handle question ready
 */
function onQuestionReady(data) {
  const { questionNumber, totalQuestions, questionData } = data;

  const actions = generateThreeBetActions(
    questionData.spot.opener,
    questionData.spot.threeBetter,
    2.5,
    8
  );

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
      { action: '4-bet', label: '4-BET', detail: '~22BB' },
      { action: 'Fold', label: 'FOLD' }
    ],
    prompt: `${questionData.spot.opener} opens, ${questionData.spot.threeBetter} 3-bets. You're in ${questionData.spot.hero}.`,
    whyItMatters: `
      <p class="scenario-why-text">
        <strong>Cold 4-betting is rare.</strong> You're facing two strong ranges: the opener (who opened)
        and the 3-bettor (who thought their hand was strong enough to re-raise).
        <br><br>
        Even hands like AK and QQ are often folds here. The only hands strong enough to cold 4-bet
        are typically AA and KK. When in doubt, fold.
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
  const { stats, previousBest, passed, passThreshold } = data;

  container.innerHTML = '<div class="drill-results-container"></div>';

  const results = new DrillResults({
    drillId: SCENARIO_ID,
    drillName: SCENARIO_NAME,
    previousBest,
    onPlayAgain: () => renderCold4BetScenario(container),
    onNextDrill: () => { window.location.hash = '#/scenario/board-texture'; },
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
