/**
 * Scenario 3.2: BB Defense vs Opens
 * Setup: Villain opens from various positions, you're in BB
 * Decisions: Call / 3-bet / Fold
 *
 * Sources: GTO Wizard, Upswing Poker, PokerCoaching.com
 */

import { ScenarioEngine, randomPick, formatTime } from './ScenarioEngine.js';
import { renderScenarioQuestion, showScenarioFeedback } from '../components/ScenarioDisplay.js';
import { generateOpenActions } from '../components/ActionHistory.js';
import { isScenarioUnlocked, getScenarioProgress, getScenarioThreshold } from '../storage.js';
import { BB_DEFENSE, getCorrectAction, getRangeBreakdown, isHandInRange } from '../data/scenarioRanges.js';
import { getRandomHand } from '../data/hands.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = 'bb-defense';
const SCENARIO_NAME = 'BB Defense';
const TOTAL_QUESTIONS = 20;

// Opener positions to practice against
const OPENER_POSITIONS = [
  { position: 'BTN', key: 'vs_BTN', openSize: 2.5 },
  { position: 'CO', key: 'vs_CO', openSize: 2.5 },
  { position: 'MP', key: 'vs_MP', openSize: 2.5 },
  { position: 'UTG', key: 'vs_UTG', openSize: 2.5 },
  { position: 'SB', key: 'vs_SB', openSize: 2.5 }
];

let engine = null;
let container = null;

/**
 * Render the BB defense scenario
 */
export function renderBBDefenseScenario(containerElement) {
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
        <p class="page-header__subtitle">Villain opens, you're in BB. Defend or fold?</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">&#x1F6E1;</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            You're in the big blind facing an open raise. Decide whether to <strong>Call</strong>,
            <strong>3-bet</strong>, or <strong>Fold</strong> based on the opener's position and your hand.
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
 * Show countdown overlay
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
  // Pick a random opener position
  const opener = randomPick(OPENER_POSITIONS);
  const rangeData = BB_DEFENSE[opener.key];

  // Generate a balanced hand selection
  let hand;
  const roll = Math.random();

  if (roll < 0.20 && rangeData.threeBet.length > 0) {
    // Pick a 3-bet hand
    hand = randomPick(rangeData.threeBet);
  } else if (roll < 0.55 && rangeData.call.length > 0) {
    // Pick a call hand
    hand = randomPick(rangeData.call);
  } else {
    // Pick a fold hand
    hand = generateFoldHand(rangeData);
  }

  // Calculate pot size
  const potSize = opener.openSize + 0.5 + 1; // open + SB + BB

  return {
    opener,
    hand,
    rangeKey: opener.key,
    rangeData,
    potSize,
    effectiveStack: 99, // 100 - 1BB posted
    category: opener.key
  };
}

/**
 * Generate a hand that should be folded
 */
function generateFoldHand(rangeData) {
  const allThreeBet = rangeData.threeBet || [];
  const allCall = rangeData.call || [];
  const notFold = [...allThreeBet, ...allCall];

  const foldHands = [
    'K5o', 'K4o', 'K3o', 'K2o',
    'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
    'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
    'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
    '95o', '94o', '93o', '92o',
    '84o', '83o', '82o',
    '73o', '72o',
    '62o', '63o',
    '52o',
    '42o', '43o',
    '32o',
    'K4s', 'K3s', 'K2s',
    'Q5s', 'Q4s', 'Q3s', 'Q2s',
    'J5s', 'J4s', 'J3s', 'J2s',
    'T4s', 'T3s', 'T2s',
    '93s', '92s',
    '83s', '82s',
    '72s', '73s',
    '62s', '63s',
    '52s'
  ];

  const actualFolds = foldHands.filter(h => !notFold.includes(h));

  if (actualFolds.length > 0) {
    return randomPick(actualFolds);
  }

  return randomPick(['K3o', 'Q4o', 'J5o', 'T4o', '94o']);
}

/**
 * Validate an answer
 */
function validateAnswer(answer, questionData) {
  const { hand, rangeData } = questionData;
  const correctAction = getCorrectAction(hand, rangeData);

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
  if (lower === 'call') return 'call';
  if (lower === 'fold') return 'fold';
  return lower;
}

/**
 * Get explanation for the answer
 */
function getExplanation(questionData, validation) {
  const { hand, opener, rangeData } = questionData;
  const { correctAnswer } = validation;

  const explanations = {
    '3-bet': {
      text: `${hand} is strong enough to 3-bet for value/protection against ${opener.position}'s open.`,
      points: [
        'Premium hands and some blockers should 3-bet to build pots',
        '3-betting takes initiative and can win the pot preflop',
        'Blocker hands (like A5s-A2s) make good bluff 3-bets'
      ]
    },
    'Call': {
      text: `${hand} is playable but not strong enough to 3-bet vs ${opener.position}.`,
      points: [
        'Good pot odds from the BB (already invested 1BB)',
        'Playable hands that can flop well',
        'Position disadvantage makes 3-betting riskier'
      ]
    },
    'Fold': {
      text: `${hand} isn't strong enough to defend against ${opener.position}'s range.`,
      points: [
        `${opener.position} has a ${opener.position === 'UTG' ? 'tight' : opener.position === 'BTN' ? 'wide' : 'medium'} opening range`,
        'This hand doesn\'t have enough equity or playability',
        'Even with pot odds, some hands are unprofitable to play'
      ]
    }
  };

  return explanations[correctAnswer] || { text: `The correct action is ${correctAnswer}.` };
}

/**
 * Get range display for feedback
 */
function getRangeDisplay(questionData) {
  const { rangeData, opener } = questionData;

  return {
    title: `BB vs ${opener.position} Open`,
    items: getRangeBreakdown(rangeData)
  };
}

/**
 * Handle question ready event
 */
function onQuestionReady(data) {
  const { questionNumber, totalQuestions, questionData } = data;

  const actions = generateOpenActions(questionData.opener.position, questionData.opener.openSize);

  renderScenarioQuestion(container, {
    scenarioName: SCENARIO_NAME,
    questionNumber,
    totalQuestions,
    heroPosition: 'BB',
    heroHand: questionData.hand,
    actionHistory: actions,
    potSize: questionData.potSize,
    effectiveStack: questionData.effectiveStack,
    decisions: [
      { action: 'Call', label: 'CALL', detail: `${questionData.opener.openSize - 1}BB more` },
      { action: '3-bet', label: '3-BET', detail: '~10BB' },
      { action: 'Fold', label: 'FOLD' }
    ],
    prompt: `${questionData.opener.position} opens to ${questionData.opener.openSize}BB. You're in the BB. What's your action?`,
    whyItMatters: `
      <p class="scenario-why-text">
        BB defense is one of the most important skills in poker. You've already invested 1BB, so you're
        getting good pot odds to defend. But defending too wide against tight openers or folding too much
        against steals both hurt your win rate.
      </p>
    `,
    onDecision: handleDecision,
    onQuit: quitScenario
  });
}

/**
 * Handle player's decision
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

/**
 * Handle answer result
 */
function onAnswerResult(result) {
  // Additional tracking if needed
}

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
    onPlayAgain: () => renderBBDefenseScenario(container),
    onNextDrill: () => { window.location.hash = '#/scenario/3bet-value'; },
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
 * Add opener breakdown to results
 */
function addOpenerBreakdown(categoryStats) {
  const resultsContent = container.querySelector('.drill-results__content');
  if (!resultsContent) return;

  const categories = Object.entries(categoryStats);
  if (categories.length === 0) return;

  const breakdownHtml = `
    <div class="drill-results__breakdown">
      <h4 class="drill-results__breakdown-title">Accuracy by Opener Position</h4>
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

/**
 * Quit the scenario
 */
function quitScenario() {
  if (engine) {
    engine.stop();
  }
  window.location.hash = '#/scenarios';
}
