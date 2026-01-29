/**
 * Scenario 3.6: Board Texture Recognition
 * Setup: Show a flop, categorize the texture
 * Decisions: Dry / Wet / Paired / Monotone
 *
 * This is an EDUCATIONAL/HEURISTIC scenario.
 * It teaches board reading without disputed ranges.
 */

import { ScenarioEngine, randomPick, shuffleArray } from './ScenarioEngine.js';
import { isScenarioUnlocked, getScenarioProgress, getScenarioThreshold } from '../storage.js';
import { generateBoardWithTexture, analyzeBoardTexture, BOARD_TEXTURES } from '../data/scenarioRanges.js';
import { PlayingCard } from '../components/PlayingCard.js';
import { DrillResults } from '../components/DrillResults.js';

const SCENARIO_ID = 'board-texture';
const SCENARIO_NAME = 'Board Texture';
const TOTAL_QUESTIONS = 20;

const TEXTURES = ['dry', 'wet', 'paired', 'monotone'];

let engine = null;
let container = null;

/**
 * Render the board texture scenario
 */
export function renderBoardTextureScenario(containerElement) {
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
        <p class="page-header__subtitle">Learn to read board textures</p>
      </div>

      <div class="drill-start__content animate-fade-in-up">
        <div class="drill-start__icon">&#x1F0CF;</div>
        <div class="drill-start__info">
          <p class="drill-start__description">
            Board texture affects how you should play postflop. Learn to identify:
          </p>
          <ul class="scenario-texture-list">
            <li><strong>Dry</strong> - Few draws possible (K72 rainbow)</li>
            <li><strong>Wet</strong> - Many draws available (JT9 two-tone)</li>
            <li><strong>Paired</strong> - Board has a pair (KK4)</li>
            <li><strong>Monotone</strong> - All one suit (9h 6h 3h)</li>
          </ul>
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
      getExplanation: getExplanation
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
  // Pick a random texture to test
  const texture = randomPick(TEXTURES);
  const board = generateBoardWithTexture(texture, []);

  return {
    board,
    correctTexture: texture,
    category: texture
  };
}

/**
 * Validate an answer
 */
function validateAnswer(answer, questionData) {
  const normalizedAnswer = answer.toLowerCase();
  const normalizedCorrect = questionData.correctTexture.toLowerCase();

  return {
    correct: normalizedAnswer === normalizedCorrect,
    correctAnswer: capitalizeFirst(questionData.correctTexture)
  };
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get explanation
 */
function getExplanation(questionData, validation) {
  const { board, correctTexture } = questionData;
  const textureInfo = BOARD_TEXTURES[correctTexture];

  const boardStr = board.map(c => `${c.rank}${getSuitSymbol(c.suit)}`).join(' ');

  return {
    text: `${boardStr} is a ${correctTexture.toUpperCase()} board.`,
    points: textureInfo.characteristics
  };
}

/**
 * Get suit symbol
 */
function getSuitSymbol(suit) {
  const symbols = { h: '\u2665', d: '\u2666', c: '\u2663', s: '\u2660' };
  return symbols[suit] || suit;
}

/**
 * Handle question ready
 */
function onQuestionReady(data) {
  const { questionNumber, totalQuestions, questionData } = data;

  container.innerHTML = `
    <div class="scenario-active">
      <div class="scenario-header">
        <div class="scenario-header__left">
          <button class="btn btn--ghost" id="quit-scenario">&larr; Quit</button>
        </div>
        <div class="scenario-header__center">
          <div class="scenario-header__progress">
            <span>${questionNumber}</span>/<span>${totalQuestions}</span>
          </div>
        </div>
        <div class="scenario-header__right">
          <span class="scenario-header__name">${SCENARIO_NAME}</span>
        </div>
      </div>

      <div class="scenario-question">
        <div class="scenario-question__prompt">What type of board is this?</div>

        <div class="board-display board-display--centered">
          <div class="board-display__cards" id="board-cards"></div>
        </div>

        <div class="texture-options" id="texture-options">
          <button class="texture-option" data-texture="dry">
            <span class="texture-option__label">Dry</span>
            <span class="texture-option__description">Few draws possible</span>
          </button>
          <button class="texture-option" data-texture="wet">
            <span class="texture-option__label">Wet</span>
            <span class="texture-option__description">Many draws available</span>
          </button>
          <button class="texture-option" data-texture="paired">
            <span class="texture-option__label">Paired</span>
            <span class="texture-option__description">Board has a pair</span>
          </button>
          <button class="texture-option" data-texture="monotone">
            <span class="texture-option__label">Monotone</span>
            <span class="texture-option__description">All one suit</span>
          </button>
        </div>
      </div>

      <div class="scenario-feedback" id="feedback-overlay"></div>
    </div>
  `;

  // Render the board cards
  const boardContainer = container.querySelector('#board-cards');
  questionData.board.forEach(card => {
    const playingCard = new PlayingCard(card.rank, card.suit, { size: 'lg' });
    playingCard.render(boardContainer);
  });

  // Bind events
  document.getElementById('quit-scenario').addEventListener('click', quitScenario);

  const options = container.querySelectorAll('.texture-option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      if (option.disabled) return;
      handleDecision(option.dataset.texture);
    });
  });
}

/**
 * Handle decision
 */
function handleDecision(texture) {
  if (!engine || !engine.isActive()) return;

  const result = engine.submitAnswer(texture);

  if (result) {
    // Disable all options
    const options = container.querySelectorAll('.texture-option');
    options.forEach(option => {
      option.disabled = true;
      const optionTexture = option.dataset.texture;

      if (optionTexture === texture) {
        option.classList.add(result.isCorrect ? 'texture-option--correct' : 'texture-option--wrong');
      }

      if (optionTexture === result.correctAnswer.toLowerCase() && !result.isCorrect) {
        option.classList.add('texture-option--correct');
      }
    });

    // Show feedback overlay
    showFeedback(result);
  }
}

/**
 * Show feedback
 */
function showFeedback(result) {
  const overlay = container.querySelector('#feedback-overlay');

  overlay.innerHTML = `
    <div class="scenario-feedback__content">
      <div class="scenario-feedback__icon">${result.isCorrect ? '&#10003;' : '&#10007;'}</div>
      <div class="scenario-feedback__title scenario-feedback__title--${result.isCorrect ? 'correct' : 'wrong'}">
        ${result.isCorrect ? 'Correct!' : 'Incorrect'}
      </div>

      <div class="scenario-feedback__explanation">
        <div class="scenario-feedback__explanation-title">${result.explanation.text}</div>
        <ul class="scenario-feedback__explanation-list">
          ${result.explanation.points.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>

      <div class="scenario-feedback__actions">
        <button class="btn btn--primary scenario-feedback__btn" id="next-question">
          ${result.isCorrect ? 'Next Question' : 'Continue'}
        </button>
      </div>
    </div>
  `;

  overlay.classList.add('scenario-feedback--visible');

  document.getElementById('next-question').addEventListener('click', () => {
    overlay.classList.remove('scenario-feedback--visible');
    setTimeout(() => {
      engine.nextQuestion();
    }, 300);
  });
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
    onPlayAgain: () => renderBoardTextureScenario(container),
    onNextDrill: null, // This is the last scenario
    onBackToHub: () => { window.location.hash = '#/scenarios'; },
    nextLabel: null
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

  addTextureBreakdown(categoryStats);
}

/**
 * Add texture breakdown
 */
function addTextureBreakdown(categoryStats) {
  const resultsContent = container.querySelector('.drill-results__content');
  if (!resultsContent) return;

  const categories = Object.entries(categoryStats);
  if (categories.length === 0) return;

  const breakdownHtml = `
    <div class="drill-results__breakdown">
      <h4 class="drill-results__breakdown-title">Accuracy by Texture Type</h4>
      <div class="drill-results__breakdown-grid">
        ${categories.map(([texture, stats]) => {
          const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
          return `
            <div class="drill-results__breakdown-item">
              <span class="drill-results__breakdown-pos">${capitalizeFirst(texture)}</span>
              <span class="drill-results__breakdown-value ${pct >= 80 ? 'drill-results__breakdown-value--good' : ''}">${pct}%</span>
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
