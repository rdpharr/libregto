/**
 * Module 1.3: Equity
 * Understanding and estimating preflop equity
 */

import { getEquity, getCardsForHand, PREFLOP_EQUITY, normalizeHand } from '../data/hands.js';
import { createHandDisplay } from '../components/PlayingCard.js';
import { createEquitySlider, createProgressIndicator } from '../components/Quiz.js';
import { completeModule, getModuleProgress, updateStats, isModuleUnlocked } from '../storage.js';

const MODULE_ID = 'equity';
const QUIZ_LENGTH = 10;
const PASSING_SCORE = 70;
const TOLERANCE = 10; // ±10% is considered correct

/**
 * Render the Equity module
 */
export function renderEquityModule(container) {
  const progress = getModuleProgress('foundations', MODULE_ID);
  const isUnlocked = isModuleUnlocked('foundations', MODULE_ID);

  if (!isUnlocked) {
    container.innerHTML = `
      <div class="container" style="padding-top: var(--space-16); text-align: center;">
        <h1 class="display-md mb-4">Module Locked</h1>
        <p class="text-lg text-secondary mb-8">Complete the Position module first to unlock this content.</p>
        <a href="#/module/position" class="btn btn--primary">Go to Position</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="module container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <a href="#/foundations" class="breadcrumb__link">Foundations</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Equity</span>
        </nav>
        <h1 class="page-header__title">Module 1.3: Equity</h1>
        <p class="page-header__subtitle">Calculate your winning chances preflop</p>
      </div>

      <div class="module__content">
        <div class="module__main">
          <!-- Lesson Content -->
          <div class="lesson" id="lesson-content">
            ${renderLessonContent()}
          </div>

          <!-- Interactive Equity Demo -->
          <div class="quiz-section mt-8" id="equity-demo">
            <h3 class="quiz-section__title mb-4">Equity Examples</h3>
            <div id="equity-examples"></div>
          </div>

          <!-- Quiz Section -->
          <div class="quiz-section mt-8" id="quiz-section">
            <div class="quiz-section__header">
              <h3 class="quiz-section__title">Equity Estimation Quiz</h3>
              <span class="quiz-section__badge" id="quiz-progress">0/${QUIZ_LENGTH}</span>
            </div>
            <div id="quiz-container">
              <p class="text-secondary mb-4">
                Estimate the preflop equity of hands against a random opponent.
                You need to be within ±${TOLERANCE}% to be considered correct.
              </p>
              <button class="btn btn--primary" id="start-quiz-btn">Start Quiz</button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="module__sidebar">
          <div class="module__progress-card">
            <div class="module__progress-title">Your Progress</div>
            <div class="module__progress-score" id="best-score">${progress?.bestScore || 0}%</div>
            <div class="module__progress-label">Best Score</div>
            <div class="progress mt-4">
              <div class="progress__bar" style="width: ${progress?.bestScore || 0}%"></div>
            </div>
            <p class="text-sm text-secondary mt-4">
              ${progress?.completed ? 'Completed! ' : ''}Score ${PASSING_SCORE}% or higher to complete this module.
            </p>
          </div>

          <!-- Equity Reference -->
          <div class="module__progress-card mt-4">
            <div class="module__progress-title">Equity Reference</div>
            <div class="flex flex-col gap-2 mt-4 text-sm">
              <div class="flex justify-between">
                <span class="mono">AA</span>
                <span class="text-primary-500 font-semibold">85%</span>
              </div>
              <div class="flex justify-between">
                <span class="mono">KK</span>
                <span class="text-primary-500 font-semibold">82%</span>
              </div>
              <div class="flex justify-between">
                <span class="mono">AKs</span>
                <span class="text-primary-500 font-semibold">67%</span>
              </div>
              <div class="flex justify-between">
                <span class="mono">JJ</span>
                <span class="text-primary-500 font-semibold">78%</span>
              </div>
              <div class="flex justify-between">
                <span class="mono">22</span>
                <span class="text-primary-500 font-semibold">50%</span>
              </div>
              <div class="flex justify-between">
                <span class="mono">72o</span>
                <span class="text-primary-500 font-semibold">35%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Module Navigation -->
      <div class="module__nav">
        <a href="#/module/position" class="btn btn--ghost module__nav-btn">
          ← Previous: Position
        </a>
        <a href="#/module/ranges" class="btn btn--secondary module__nav-btn">
          Next: Ranges →
        </a>
      </div>
    </div>
  `;

  // Set up examples and quiz
  setupEquityExamples();
  setupQuiz();
}

/**
 * Render lesson content
 */
function renderLessonContent() {
  return `
    <div class="lesson__section animate-fade-in-up">
      <h2 class="lesson__title">What is Equity?</h2>
      <p class="lesson__text">
        Equity is your share of the pot based on your chances of winning. If you have 60% equity,
        you expect to win the pot 60% of the time on average. Understanding equity helps you make
        mathematically sound decisions.
      </p>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-1">
      <h3 class="lesson__subtitle">Preflop Equity vs Random Hand</h3>
      <p class="lesson__text">
        Preflop equity measures how often your hand will win against a completely random hand
        (any two cards). This is useful for understanding the raw strength of starting hands.
      </p>
      <div class="lesson__highlight">
        <strong>Key insight:</strong> AA has ~85% equity vs random, meaning it wins 85% of the time heads-up.
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-2">
      <h3 class="lesson__subtitle">Factors Affecting Equity</h3>
      <ul class="lesson__text" style="list-style: disc; padding-left: var(--space-6);">
        <li><strong>High cards:</strong> AA beats random ~85%, 72o only ~35%</li>
        <li><strong>Pairs:</strong> Any pair has ~50%+ equity vs random</li>
        <li><strong>Suitedness:</strong> Suited hands have ~3-4% more equity than offsuit</li>
        <li><strong>Connectedness:</strong> Connected cards can make more straights</li>
      </ul>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-3">
      <h3 class="lesson__subtitle">Equity Ranges</h3>
      <p class="lesson__text">
        Here's how equity generally breaks down for starting hand categories:
      </p>
      <div class="lesson__highlight">
        <div class="grid gap-2" style="grid-template-columns: auto 1fr;">
          <span class="mono font-semibold">Premium pairs (AA-JJ):</span>
          <span>77-85%</span>
          <span class="mono font-semibold">Medium pairs (TT-77):</span>
          <span>66-75%</span>
          <span class="mono font-semibold">Small pairs (66-22):</span>
          <span>50-63%</span>
          <span class="mono font-semibold">Strong broadways:</span>
          <span>60-67%</span>
          <span class="mono font-semibold">Suited connectors:</span>
          <span>45-55%</span>
          <span class="mono font-semibold">Weak offsuit:</span>
          <span>30-45%</span>
        </div>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-4">
      <h3 class="lesson__subtitle">Why Equity Matters</h3>
      <p class="lesson__text">
        Understanding equity helps you:
      </p>
      <ul class="lesson__text" style="list-style: disc; padding-left: var(--space-6);">
        <li>Decide whether to call, raise, or fold</li>
        <li>Calculate pot odds and expected value</li>
        <li>Understand which hands to include in your ranges</li>
        <li>Make better decisions in marginal spots</li>
      </ul>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-5">
      <h3 class="lesson__subtitle">Memorize Key Benchmarks</h3>
      <p class="lesson__text">
        You don't need to memorize exact equities, but knowing rough benchmarks helps:
      </p>
      <div class="lesson__highlight">
        <strong>50% = breakeven</strong> | <strong>60% = solid favorite</strong> | <strong>70%+ = big favorite</strong>
      </div>
    </div>
  `;
}

/**
 * Set up interactive equity examples
 */
function setupEquityExamples() {
  const container = document.getElementById('equity-examples');
  if (!container) return;

  const examples = [
    { hand: 'AA', equity: 85 },
    { hand: 'AKs', equity: 67 },
    { hand: 'JTs', equity: 58 },
    { hand: '22', equity: 50 },
    { hand: '72o', equity: 35 }
  ];

  container.innerHTML = `
    <div class="flex flex-wrap gap-6 justify-center">
      ${examples.map(({ hand, equity }) => `
        <div class="flex flex-col items-center gap-2">
          <div id="example-${hand}" class="flex gap-1"></div>
          <div class="mono text-xl font-bold text-accent">${equity}%</div>
          <div class="text-xs text-secondary">${hand}</div>
        </div>
      `).join('')}
    </div>
    <p class="text-sm text-secondary text-center mt-4">
      Equity shown is vs a random hand (any two cards)
    </p>
  `;

  // Add hand displays
  examples.forEach(({ hand }) => {
    const displayContainer = document.getElementById(`example-${hand}`);
    if (displayContainer) {
      const handDisplay = createHandDisplay(hand, { size: 'sm' });
      displayContainer.appendChild(handDisplay);
    }
  });
}

/**
 * Set up the quiz functionality
 */
function setupQuiz() {
  const startBtn = document.getElementById('start-quiz-btn');
  const quizContainer = document.getElementById('quiz-container');

  startBtn?.addEventListener('click', () => {
    startQuiz(quizContainer);
  });
}

/**
 * Get random hands for the quiz
 */
function getQuizHands(count) {
  const allHands = Object.keys(PREFLOP_EQUITY);
  const shuffled = allHands.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Start the quiz
 */
function startQuiz(container) {
  const hands = getQuizHands(QUIZ_LENGTH);
  let currentIndex = 0;
  let correctCount = 0;

  function showQuestion() {
    const hand = hands[currentIndex];
    const correctEquity = Math.round(getEquity(hand));

    // Update progress
    document.getElementById('quiz-progress').textContent = `${currentIndex + 1}/${QUIZ_LENGTH}`;

    container.innerHTML = '';

    // Progress indicator
    const progressEl = createProgressIndicator(currentIndex + 1, QUIZ_LENGTH, correctCount);
    container.appendChild(progressEl);

    // Question prompt
    const promptEl = document.createElement('p');
    promptEl.className = 'text-lg text-center mt-6 mb-4';
    promptEl.textContent = 'Estimate the equity of this hand vs a random opponent:';
    container.appendChild(promptEl);

    // Hand display
    const handContainer = document.createElement('div');
    handContainer.className = 'flex justify-center my-6';
    const handDisplay = createHandDisplay(hand, { size: 'lg', animate: true });
    handContainer.appendChild(handDisplay);

    const handLabel = document.createElement('div');
    handLabel.className = 'text-center mono text-xl font-bold mt-2';
    handLabel.textContent = hand;
    handContainer.appendChild(handLabel);

    container.appendChild(handContainer);

    // Slider
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'quiz__slider-container';
    sliderContainer.style.maxWidth = '400px';
    sliderContainer.style.margin = '0 auto';

    // Value display
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'quiz__slider-value';
    valueDisplay.textContent = '50%';

    // Slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'quiz__slider';
    slider.min = 20;
    slider.max = 90;
    slider.value = 50;

    slider.addEventListener('input', () => {
      valueDisplay.textContent = `${slider.value}%`;
    });

    // Labels
    const labels = document.createElement('div');
    labels.className = 'quiz__slider-labels';
    labels.innerHTML = '<span>20%</span><span>55%</span><span>90%</span>';

    sliderContainer.appendChild(valueDisplay);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(labels);
    container.appendChild(sliderContainer);

    // Submit button
    const actions = document.createElement('div');
    actions.className = 'quiz__actions mt-6';
    actions.style.justifyContent = 'center';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn--primary';
    submitBtn.textContent = 'Submit';

    let answered = false;

    submitBtn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const userValue = parseInt(slider.value);
      const diff = Math.abs(userValue - correctEquity);
      const isCorrect = diff <= TOLERANCE;

      updateStats({ correctAnswer: isCorrect });

      if (isCorrect) {
        correctCount++;
      }

      // Disable slider
      slider.disabled = true;
      submitBtn.disabled = true;

      // Show result
      const result = document.createElement('div');
      result.className = 'flex flex-col items-center gap-2 mt-4 animate-fade-in-up';

      const feedback = document.createElement('div');
      feedback.className = `text-lg font-semibold ${isCorrect ? 'text-success' : 'text-error'}`;
      feedback.textContent = isCorrect ? 'Correct!' : 'Not quite!';

      const actual = document.createElement('div');
      actual.className = 'text-secondary';
      actual.innerHTML = `Actual equity: <span class="mono font-bold text-accent">${correctEquity}%</span> (you guessed ${userValue}%)`;

      const diffEl = document.createElement('div');
      diffEl.className = 'text-sm text-tertiary';
      diffEl.textContent = `Difference: ${diff}% ${isCorrect ? '(within ±' + TOLERANCE + '%)' : ''}`;

      result.appendChild(feedback);
      result.appendChild(actual);
      result.appendChild(diffEl);
      sliderContainer.appendChild(result);

      // Continue button
      const continueBtn = document.createElement('button');
      continueBtn.className = 'btn btn--secondary mt-4';
      continueBtn.textContent = currentIndex < QUIZ_LENGTH - 1 ? 'Next Hand' : 'See Results';
      continueBtn.addEventListener('click', () => {
        currentIndex++;
        if (currentIndex < QUIZ_LENGTH) {
          showQuestion();
        } else {
          showResults();
        }
      });
      result.appendChild(continueBtn);
    });

    actions.appendChild(submitBtn);
    container.appendChild(actions);
  }

  function showResults() {
    const score = Math.round((correctCount / QUIZ_LENGTH) * 100);
    const passed = score >= PASSING_SCORE;

    // Save progress
    if (passed) {
      completeModule('foundations', MODULE_ID, score);
    }

    // Update sidebar
    const bestScoreEl = document.getElementById('best-score');
    if (bestScoreEl) {
      const currentBest = parseInt(bestScoreEl.textContent);
      if (score > currentBest) {
        bestScoreEl.textContent = `${score}%`;
      }
    }

    container.innerHTML = `
      <div class="flex flex-col items-center gap-6 py-8 animate-fade-in-up">
        <div class="feedback-modal__icon" style="background-color: ${passed ? 'var(--color-success-soft)' : 'var(--color-error-soft)'}; color: ${passed ? 'var(--color-success)' : 'var(--color-error)'};">
          ${passed ? '✓' : '✗'}
        </div>
        <h3 class="h2">${passed ? 'Great Job!' : 'Keep Practicing'}</h3>
        <div class="feedback-modal__stat">${score}%</div>
        <p class="text-secondary text-center">
          You estimated ${correctCount} out of ${QUIZ_LENGTH} hands within ±${TOLERANCE}%.
          ${passed ? 'You\'ve completed this module!' : `Score ${PASSING_SCORE}% or higher to complete.`}
        </p>
        <div class="flex gap-4">
          <button class="btn btn--secondary" onclick="location.reload()">Try Again</button>
          ${passed ? '<a href="#/module/ranges" class="btn btn--primary">Next Module →</a>' : ''}
        </div>
      </div>
    `;
  }

  showQuestion();
}

export default { renderEquityModule };
