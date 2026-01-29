/**
 * Scenario 3.1: Defend vs 3-Bet
 * Setup: You open from CO/BTN, villain 3-bets
 * Decisions: Call / 4-bet / Fold
 *
 * Sources: GTO Wizard, Upswing Poker, PokerCoaching.com
 */

import { ScenarioEngine, randomPick, formatTime } from './ScenarioEngine.js';
import { renderScenarioQuestion, showScenarioFeedback, updateQuestionNumber } from '../components/ScenarioDisplay.js';
import { generateThreeBetActions } from '../components/ActionHistory.js';
import { isScenarioUnlocked, getScenarioProgress, getScenarioThreshold } from '../storage.js';
import { DEFEND_VS_3BET, getCorrectAction, getRangeBreakdown, isHandInRange } from '../data/scenarioRanges.js';
import { getRandomHand } from '../data/hands.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = 'defend-3bet';
const SCENARIO_NAME = 'Defend vs 3-Bet';
const TOTAL_QUESTIONS = 20;

// Position matchups to use
const MATCHUPS = [
  { hero: 'CO', villain: 'BTN', key: 'CO_vs_BTN' },
  { hero: 'CO', villain: 'SB', key: 'CO_vs_SB' },
  { hero: 'CO', villain: 'BB', key: 'CO_vs_BB' },
  { hero: 'BTN', villain: 'SB', key: 'BTN_vs_SB' },
  { hero: 'BTN', villain: 'BB', key: 'BTN_vs_BB' }
];

let engine = null;
let container = null;

/**
 * Render the defend vs 3-bet scenario
 */
export function renderDefendVs3BetScenario(containerElement) {
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
        <p class="page-header__subtitle">You open, villain 3-bets. What's your play?</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">&#x1F4B0;</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            You've opened from CO or BTN and face a 3-bet. Decide whether to <strong>Call</strong>,
            <strong>4-bet</strong>, or <strong>Fold</strong> based on your hand and the positions involved.
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

  // Show countdown then start
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
  // Pick a random matchup
  const matchup = randomPick(MATCHUPS);
  const rangeData = DEFEND_VS_3BET[matchup.key];

  // Generate a balanced hand selection
  // ~25% 4-bet hands, ~35% call hands, ~40% fold hands
  let hand;
  const roll = Math.random();

  if (roll < 0.25 && rangeData.fourBet.length > 0) {
    // Pick a 4-bet hand
    hand = randomPick(rangeData.fourBet);
  } else if (roll < 0.60 && rangeData.call.length > 0) {
    // Pick a call hand
    hand = randomPick(rangeData.call);
  } else {
    // Pick a fold hand - generate hands not in any action range
    hand = generateFoldHand(rangeData);
  }

  // Calculate pot size and effective stack
  const openSize = 2.5;
  const threeBetSize = matchup.villain === 'BB' || matchup.villain === 'SB' ? 10 : 8;
  const potSize = openSize + threeBetSize + 0.5 + 1; // open + 3bet + SB + BB

  return {
    matchup,
    hand,
    rangeKey: matchup.key,
    rangeData,
    potSize,
    effectiveStack: 100 - openSize, // after our open
    openSize,
    threeBetSize,
    category: matchup.key // For tracking stats by matchup
  };
}

/**
 * Generate a hand that should be folded
 */
function generateFoldHand(rangeData) {
  const allFourBet = rangeData.fourBet || [];
  const allCall = rangeData.call || [];
  const notFold = [...allFourBet, ...allCall];

  // Common fold hands
  const foldHands = [
    'K9o', 'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
    'Q9o', 'Q8o', 'Q7o', 'Q6o', 'Q5o',
    'J9o', 'J8o', 'J7o',
    'T8o', 'T7o',
    '97o', '96o',
    '86o', '85o',
    '75o', '74o',
    '64o', '63o',
    '53o', '52o',
    '42o', '43o',
    'K8s', 'K7s', 'K6s', 'K5s',
    'Q8s', 'Q7s', 'Q6s',
    'J7s', 'J6s',
    'T6s', 'T5s',
    '96s', '95s',
    '85s', '84s',
    '74s', '73s',
    '88', '77', '66', '55', '44', '33', '22'  // Small pairs often folds
  ];

  // Filter out any that are actually playable in this matchup
  const actualFolds = foldHands.filter(h => !notFold.includes(h));

  if (actualFolds.length > 0) {
    return randomPick(actualFolds);
  }

  // Fallback
  return randomPick(['K7o', 'Q8o', 'J7o', 'T6o', '95o']);
}

/**
 * Validate an answer
 */
function validateAnswer(answer, questionData) {
  const { hand, rangeData } = questionData;
  const correctAction = getCorrectAction(hand, rangeData);

  // Normalize answers for comparison
  const normalizedAnswer = normalizeAction(answer);
  const normalizedCorrect = normalizeAction(correctAction);

  return {
    correct: normalizedAnswer === normalizedCorrect,
    correctAnswer: correctAction
  };
}

/**
 * Normalize action names for comparison
 */
function normalizeAction(action) {
  const lower = action.toLowerCase().replace(/[- ]/g, '');
  if (lower === '4bet' || lower === 'fourbet') return '4bet';
  if (lower === 'call') return 'call';
  if (lower === 'fold') return 'fold';
  return lower;
}

/**
 * Get explanation for the answer
 */
function getExplanation(questionData, validation) {
  const { hand, matchup, rangeData } = questionData;
  const { correctAnswer } = validation;

  const explanations = {
    '4-bet': {
      text: `${hand} is strong enough to 4-bet for value against ${matchup.villain}'s 3-bet range.`,
      points: [
        'Premium hands build pots better by 4-betting',
        'You want to get more money in preflop with strong holdings',
        'Calling risks playing a multiway pot or letting villain realize equity'
      ]
    },
    'Call': {
      text: `${hand} has good playability but isn't strong enough to 4-bet for value.`,
      points: [
        'Strong enough to continue but not to bloat the pot',
        'Good implied odds and postflop playability',
        'You can outplay villain postflop with position (if CO vs BTN excluded)'
      ]
    },
    'Fold': {
      text: `${hand} isn't strong enough to profitably continue against ${matchup.villain}'s 3-bet.`,
      points: [
        'This hand doesn\'t have enough equity vs a 3-bet range',
        'Calling leads to tough spots postflop',
        'Better spots will come - don\'t burn money on marginal hands'
      ]
    }
  };

  return explanations[correctAnswer] || { text: `The correct action is ${correctAnswer}.` };
}

/**
 * Get range display for feedback
 */
function getRangeDisplay(questionData) {
  const { rangeData, matchup } = questionData;

  return {
    title: `${matchup.hero} vs ${matchup.villain} 3-bet`,
    items: getRangeBreakdown(rangeData)
  };
}

/**
 * Handle question ready event
 */
function onQuestionReady(data) {
  const { questionNumber, totalQuestions, questionData } = data;

  // Build action history
  const actions = generateThreeBetActions(
    questionData.matchup.hero,
    questionData.matchup.villain,
    questionData.openSize,
    questionData.threeBetSize
  );

  // Add folds for positions after 3-bettor and before hero
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const villainIndex = positions.indexOf(questionData.matchup.villain);

  renderScenarioQuestion(container, {
    scenarioName: SCENARIO_NAME,
    questionNumber,
    totalQuestions,
    heroPosition: questionData.matchup.hero,
    heroHand: questionData.hand,
    actionHistory: actions,
    potSize: questionData.potSize,
    effectiveStack: questionData.effectiveStack,
    decisions: [
      { action: 'Call', label: 'CALL', detail: `${questionData.threeBetSize}BB` },
      { action: '4-bet', label: '4-BET', detail: '~20BB' },
      { action: 'Fold', label: 'FOLD' }
    ],
    prompt: `You opened from ${questionData.matchup.hero}, ${questionData.matchup.villain} 3-bets. What's your action?`,
    whyItMatters: `
      <p class="scenario-why-text">
        Facing a 3-bet is one of the most important preflop decisions. Responding incorrectly costs you money:
        calling too wide loses to their strong range, folding too much lets them steal, and 4-betting incorrectly
        commits chips with weak hands.
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
 * Handle answer result (for stats tracking)
 */
function onAnswerResult(result) {
  // Can be used for additional feedback or tracking
}

/**
 * Handle scenario end
 */
function onScenarioEnd(data) {
  const { stats, previousBest, passed, passThreshold, categoryStats } = data;

  // Clear container and show results
  container.innerHTML = '<div class="drill-results-container"></div>';

  const results = new DrillResults({
    drillId: SCENARIO_ID,
    drillName: SCENARIO_NAME,
    previousBest,
    onPlayAgain: () => renderDefendVs3BetScenario(container),
    onNextDrill: () => { window.location.hash = '#/scenario/bb-defense'; },
    onBackToHub: () => { window.location.hash = '#/scenarios'; },
    nextLabel: 'Next Scenario'
  });

  results.render(container.querySelector('.drill-results-container'), {
    accuracy: stats.accuracy,
    avgTime: stats.avgTime,
    fastestTime: stats.fastestTime,
    bestStreak: 0, // Scenarios don't track streaks
    correct: stats.correct,
    total: stats.total,
    passed,
    passThreshold
  });

  // Add matchup breakdown
  addMatchupBreakdown(categoryStats);
}

/**
 * Add matchup breakdown to results
 */
function addMatchupBreakdown(categoryStats) {
  const resultsContent = container.querySelector('.drill-results__content');
  if (!resultsContent) return;

  const categories = Object.entries(categoryStats);
  if (categories.length === 0) return;

  const breakdownHtml = `
    <div class="drill-results__breakdown">
      <h4 class="drill-results__breakdown-title">Accuracy by Matchup</h4>
      <div class="drill-results__breakdown-grid" style="flex-wrap: wrap;">
        ${categories.map(([key, stats]) => {
          const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
          const [hero, _, villain] = key.split('_');
          return `
            <div class="drill-results__breakdown-item" style="min-width: 80px;">
              <span class="drill-results__breakdown-pos">${hero} vs ${villain}</span>
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
