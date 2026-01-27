/**
 * Module 1.1: Hand Strength
 * Learn to evaluate starting hand strength
 */

import { HAND_TIERS, getHandTier, getEquity, getCardsForHand, normalizeHand, getRandomQuizHands } from '../data/hands.js';
import { createHandDisplay } from '../components/PlayingCard.js';
import { createTierSort, createFeedbackModal, createProgressIndicator } from '../components/Quiz.js';
import { completeModule, getModuleProgress, updateStats } from '../storage.js';

const MODULE_ID = 'hand-strength';
const QUIZ_LENGTH = 10;
const PASSING_SCORE = 70;

/**
 * Render the Hand Strength module
 */
export function renderHandStrengthModule(container) {
  const progress = getModuleProgress('foundations', MODULE_ID);

  container.innerHTML = `
    <div class="module container">
      <div class="page-header">
        <nav class="breadcrumb page-header__breadcrumb">
          <a href="#/" class="breadcrumb__link">Home</a>
          <span class="breadcrumb__separator">/</span>
          <a href="#/foundations" class="breadcrumb__link">Foundations</a>
          <span class="breadcrumb__separator">/</span>
          <span class="breadcrumb__current">Hand Strength</span>
        </nav>
        <h1 class="page-header__title">Module 1.1: Hand Strength</h1>
        <p class="page-header__subtitle">Learn to evaluate the strength of your starting hands</p>
      </div>

      <div class="module__content">
        <div class="module__main">
          <!-- Lesson Content -->
          <div class="lesson" id="lesson-content">
            ${renderLessonContent()}
          </div>

          <!-- Quiz Section -->
          <div class="quiz-section mt-8" id="quiz-section">
            <div class="quiz-section__header">
              <h3 class="quiz-section__title">Practice Quiz</h3>
              <span class="quiz-section__badge" id="quiz-progress">0/${QUIZ_LENGTH}</span>
            </div>
            <div id="quiz-container">
              <p class="text-secondary mb-4">Test your knowledge by categorizing hands into the correct tier.</p>
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

          <!-- Hand Tier Reference -->
          <div class="module__progress-card mt-4">
            <div class="module__progress-title">Hand Tiers</div>
            <div class="flex flex-col gap-2 mt-4">
              ${Object.entries(HAND_TIERS).map(([tier, data]) => `
                <div class="flex items-center gap-2">
                  <span class="tier-badge tier-badge--${tier}">${data.name}</span>
                  <span class="text-xs text-tertiary">${data.hands.length > 0 ? data.hands.slice(0, 3).join(', ') + '...' : 'Other hands'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Module Navigation -->
      <div class="module__nav">
        <a href="#/foundations" class="btn btn--ghost module__nav-btn">
          ← Back to Foundations
        </a>
        <a href="#/module/position" class="btn btn--secondary module__nav-btn">
          Next: Position →
        </a>
      </div>
    </div>
  `;

  // Set up quiz
  setupQuiz();
}

/**
 * Render lesson content
 */
function renderLessonContent() {
  return `
    <div class="lesson__section animate-fade-in-up">
      <h2 class="lesson__title">Understanding Starting Hand Strength</h2>
      <p class="lesson__text">
        Not all starting hands are created equal. Understanding which hands are strong and which are weak
        is the foundation of good poker strategy. We categorize hands into five tiers based on their
        preflop equity and playability.
      </p>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-1">
      <h3 class="lesson__subtitle">Premium Hands</h3>
      <p class="lesson__text">
        These are the best starting hands in poker. You should almost always raise with these hands
        from any position. They have the highest equity against random hands.
      </p>
      <div class="lesson__highlight">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex gap-2" id="premium-hands-display"></div>
          <div class="text-sm text-secondary">
            <strong>Examples:</strong> AA, KK, QQ, JJ, TT, AKs, AKo, AQs
          </div>
        </div>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-2">
      <h3 class="lesson__subtitle">Strong Hands</h3>
      <p class="lesson__text">
        Very playable hands that you can open from most positions. These include medium-high pairs
        and strong suited broadways.
      </p>
      <div class="lesson__highlight">
        <div class="text-sm text-secondary">
          <strong>Examples:</strong> 99, 88, 77, AQo, AJs, ATs, KQs, KJs, QJs, JTs
        </div>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-3">
      <h3 class="lesson__subtitle">Playable Hands</h3>
      <p class="lesson__text">
        Good hands in position. Open these from late position (cutoff, button) but be more selective
        from early position. Includes small pairs, suited connectors, and suited aces.
      </p>
      <div class="lesson__highlight">
        <div class="text-sm text-secondary">
          <strong>Examples:</strong> 66-22, A9s-A2s, KQo, suited connectors (87s, 76s)
        </div>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-4">
      <h3 class="lesson__subtitle">Marginal Hands</h3>
      <p class="lesson__text">
        Only playable in late position or specific situations. These hands can be profitable
        when you have position and fold equity, but lose money when played too often.
      </p>
      <div class="lesson__highlight">
        <div class="text-sm text-secondary">
          <strong>Examples:</strong> A9o-A2o, K9o, weak suited connectors (53s, 43s)
        </div>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-5">
      <h3 class="lesson__subtitle">Trash Hands</h3>
      <p class="lesson__text">
        Fold these hands. They have negative expected value when played. Even if they occasionally
        win, playing them consistently will lose you money over time.
      </p>
      <div class="lesson__highlight">
        <div class="text-sm text-secondary">
          <strong>Examples:</strong> 72o, 83o, 94o, J4o, and most offsuit unconnected hands
        </div>
      </div>
    </div>

    <div class="lesson__section animate-fade-in-up stagger-5">
      <h3 class="lesson__subtitle">Key Factors in Hand Strength</h3>
      <ul class="lesson__text" style="list-style: disc; padding-left: var(--space-6);">
        <li><strong>High cards:</strong> Aces and Kings are more valuable than low cards</li>
        <li><strong>Pairs:</strong> Starting with a pair gives you a head start</li>
        <li><strong>Suited:</strong> Same suit cards can make flushes (adds ~3% equity)</li>
        <li><strong>Connected:</strong> Cards close in rank can make straights</li>
      </ul>
    </div>
  `;
}

/**
 * Set up the quiz functionality
 */
function setupQuiz() {
  const startBtn = document.getElementById('start-quiz-btn');
  const quizContainer = document.getElementById('quiz-container');

  // Add hand displays to lesson
  setTimeout(() => {
    const premiumDisplay = document.getElementById('premium-hands-display');
    if (premiumDisplay) {
      const hand = createHandDisplay('AA', { size: 'sm', animate: true });
      premiumDisplay.appendChild(hand);
    }
  }, 100);

  startBtn?.addEventListener('click', () => {
    startQuiz(quizContainer);
  });
}

/**
 * Start the quiz
 */
function startQuiz(container) {
  const hands = getRandomQuizHands(QUIZ_LENGTH);
  let currentIndex = 0;
  let correctCount = 0;

  function showQuestion() {
    const hand = hands[currentIndex];
    const correctTier = getHandTier(hand);

    // Update progress
    document.getElementById('quiz-progress').textContent = `${currentIndex + 1}/${QUIZ_LENGTH}`;

    container.innerHTML = '';

    // Progress indicator
    const progressEl = createProgressIndicator(currentIndex + 1, QUIZ_LENGTH, correctCount);
    container.appendChild(progressEl);

    // Hand display
    const handContainer = document.createElement('div');
    handContainer.className = 'flex justify-center my-6';
    const handDisplay = createHandDisplay(hand, { size: 'lg', animate: true });
    handContainer.appendChild(handDisplay);
    container.appendChild(handContainer);

    // Question
    const questionEl = document.createElement('p');
    questionEl.className = 'text-lg text-center mb-6';
    questionEl.textContent = `What tier is ${hand}?`;
    container.appendChild(questionEl);

    // Tier options
    const tierSort = createTierSort({
      hand,
      correctTier,
      onAnswer: (result) => {
        updateStats({ correctAnswer: result.isCorrect });

        if (result.isCorrect) {
          correctCount++;
        }

        // Show feedback briefly then move on
        setTimeout(() => {
          currentIndex++;
          if (currentIndex < QUIZ_LENGTH) {
            showQuestion();
          } else {
            showResults();
          }
        }, 1000);
      }
    });

    // Style the tier sort container
    const sortContainer = document.createElement('div');
    sortContainer.className = 'flex flex-col items-center gap-4';

    const optionsRow = document.createElement('div');
    optionsRow.className = 'flex flex-wrap justify-center gap-2';

    // Create tier buttons
    const tiers = ['premium', 'strong', 'playable', 'marginal', 'trash'];
    const tierLabels = {
      premium: 'Premium',
      strong: 'Strong',
      playable: 'Playable',
      marginal: 'Marginal',
      trash: 'Trash'
    };

    let answered = false;

    tiers.forEach(tier => {
      const btn = document.createElement('button');
      btn.className = `tier-badge tier-badge--${tier}`;
      btn.style.cursor = 'pointer';
      btn.style.padding = 'var(--space-2) var(--space-4)';
      btn.style.fontSize = 'var(--text-sm)';
      btn.textContent = tierLabels[tier];

      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const isCorrect = tier === correctTier;
        updateStats({ correctAnswer: isCorrect });

        if (isCorrect) {
          correctCount++;
          btn.style.boxShadow = '0 0 0 3px var(--color-success)';
        } else {
          btn.style.boxShadow = '0 0 0 3px var(--color-error)';
          // Highlight correct answer
          const correctBtn = optionsRow.querySelector(`[data-tier="${correctTier}"]`);
          if (correctBtn) {
            correctBtn.style.boxShadow = '0 0 0 3px var(--color-success)';
          }
        }

        setTimeout(() => {
          currentIndex++;
          if (currentIndex < QUIZ_LENGTH) {
            showQuestion();
          } else {
            showResults();
          }
        }, 1200);
      });

      btn.dataset.tier = tier;
      optionsRow.appendChild(btn);
    });

    sortContainer.appendChild(optionsRow);
    container.appendChild(sortContainer);
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
        <h3 class="h2">${passed ? 'Well Done!' : 'Keep Practicing'}</h3>
        <div class="feedback-modal__stat">${score}%</div>
        <p class="text-secondary text-center">
          You got ${correctCount} out of ${QUIZ_LENGTH} correct.
          ${passed ? 'You\'ve completed this module!' : `Score ${PASSING_SCORE}% or higher to complete.`}
        </p>
        <div class="flex gap-4">
          <button class="btn btn--secondary" onclick="location.reload()">Try Again</button>
          ${passed ? '<a href="#/module/position" class="btn btn--primary">Next Module →</a>' : ''}
        </div>
        <div class="feedback-links">
          <p class="text-sm text-tertiary">
            Found a problem? <a href="https://github.com/rdpharr/libregto/issues" target="_blank" rel="noopener" class="link">Report it on GitHub</a>
          </p>
          <p class="text-sm text-tertiary">
            Did this improve your skills? <a href="https://buymeacoffee.com/rdpharr" target="_blank" rel="noopener" class="link link--coffee">Buy me a coffee ☕</a>
          </p>
        </div>
      </div>
    `;
  }

  showQuestion();
}

export default { renderHandStrengthModule };
