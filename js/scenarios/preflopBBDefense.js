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
import { createDifficultySelector } from '../components/DifficultySelector.js';
import { showCountdown } from '../components/Countdown.js';
import { updateStartScreenForDifficulty } from '../utils/difficultyUtils.js';
import { isScenarioUnlocked, getScenarioProgress, getScenarioThreshold, isScenarioHardModeUnlocked } from '../storage.js';
import { BB_DEFENSE, getCorrectAction, getRangeBreakdown, isHandInRange } from '../data/scenarioRanges.js';
import { getRandomHand } from '../data/hands.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = 'bb-defense';
const SCENARIO_NAME = 'BB Defense';

// Difficulty configuration
const DIFFICULTY_CONFIG = {
  easy: {
    totalQuestions: 20,
    threeBetChance: 0.20,
    callChance: 0.35,
    // Remaining ~45% are fold hands
    passThreshold: 75
  },
  hard: {
    totalQuestions: 25,
    threeBetChance: 0.28,  // More 3-bet hands
    callChance: 0.32,
    // Variable open sizes in hard mode
    variableOpenSizes: true,
    useMarginalFolds: true,
    passThreshold: 80
  }
};

let selectedDifficulty = 'easy';

// Opener positions to practice against
const OPENER_POSITIONS = [
  { position: 'BTN', key: 'vs_BTN', openSize: 2.5 },
  { position: 'CO', key: 'vs_CO', openSize: 2.5 },
  { position: 'MP', key: 'vs_MP', openSize: 2.5 },
  { position: 'UTG', key: 'vs_UTG', openSize: 2.5 },
  { position: 'SB', key: 'vs_SB', openSize: 2.5 }
];

// Variable open sizes for hard mode
const VARIABLE_OPEN_SIZES = [2.0, 2.25, 2.5, 2.75, 3.0];

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
        <p class="page-header__subtitle">Villain opens, you're in BB. Defend or fold?</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">&#x1F6E1;</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            You're in the big blind facing an open raise. Decide whether to <strong>Call</strong>,
            <strong>3-bet</strong>, or <strong>Fold</strong> based on the opener's position and your hand.
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

  // Pick a random opener position
  const baseOpener = randomPick(OPENER_POSITIONS);
  const rangeData = BB_DEFENSE[baseOpener.key];

  // Determine open size (variable in hard mode)
  const openSize = config.variableOpenSizes
    ? randomPick(VARIABLE_OPEN_SIZES)
    : baseOpener.openSize;

  const opener = { ...baseOpener, openSize };

  // Generate hand based on difficulty config
  let hand;
  const roll = Math.random();

  const threeBetThreshold = config.threeBetChance;
  const callThreshold = threeBetThreshold + config.callChance;

  if (roll < threeBetThreshold && rangeData.threeBet.length > 0) {
    // Pick a 3-bet hand
    hand = randomPick(rangeData.threeBet);
  } else if (roll < callThreshold && rangeData.call.length > 0) {
    // Pick a call hand
    hand = randomPick(rangeData.call);
  } else {
    // Pick a fold hand
    hand = generateFoldHand(rangeData, config.useMarginalFolds);
  }

  // Calculate pot size
  const potSize = openSize + 0.5 + 1; // open + SB + BB

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
 * @param {Object} rangeData - The range data for this matchup
 * @param {boolean} useMarginalFolds - If true, only use marginal fold hands (harder)
 */
function generateFoldHand(rangeData, useMarginalFolds = false) {
  const allThreeBet = rangeData.threeBet || [];
  const allCall = rangeData.call || [];
  const notFold = [...allThreeBet, ...allCall];

  // Marginal fold hands - close to the defending range (harder)
  const marginalFoldHands = [
    'K5o', 'K4o', 'K3o',
    'Q6o', 'Q5o', 'Q4o',
    'J6o', 'J5o',
    'T6o', 'T5o',
    '95o', '94o',
    '85o', '84o',
    '75o', '74o',
    '65o', '64o',
    'K5s', 'K4s',
    'Q5s', 'Q4s',
    'J5s', 'J4s',
    'T4s', 'T3s'
  ];

  // Clear fold hands (easier)
  const clearFoldHands = [
    'K2o',
    'Q3o', 'Q2o',
    'J4o', 'J3o', 'J2o',
    'T4o', 'T3o', 'T2o',
    '93o', '92o',
    '83o', '82o',
    '73o', '72o',
    '62o', '63o',
    '52o',
    '42o', '43o',
    '32o',
    'K3s', 'K2s',
    'Q3s', 'Q2s',
    'J3s', 'J2s',
    'T2s',
    '93s', '92s',
    '83s', '82s',
    '72s', '73s',
    '62s', '63s',
    '52s'
  ];

  // Use marginal hands only in hard mode, otherwise mix both
  const foldPool = useMarginalFolds ? marginalFoldHands : [...marginalFoldHands, ...clearFoldHands];

  const actualFolds = foldPool.filter(h => !notFold.includes(h));

  if (actualFolds.length > 0) {
    return randomPick(actualFolds);
  }

  return randomPick(['K4o', 'Q5o', 'J5o', 'T5o', '94o']);
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
    difficulty: selectedDifficulty,
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
