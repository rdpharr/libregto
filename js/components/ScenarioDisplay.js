/**
 * ScenarioDisplay Component
 * Main UI component for displaying scenario questions
 */

import { PlayingCard } from './PlayingCard.js';
import { renderActionHistory, renderActionSummary } from './ActionHistory.js';
import { renderPotDisplay } from './PotDisplay.js';
import { renderBoardDisplay } from './BoardDisplay.js';
import { renderPositionTableMini } from './PositionTableMini.js';

// Debounce state to prevent double-submissions
let isProcessingDecision = false;
const DEBOUNCE_DELAY = 500;

/**
 * Reset debounce state (called after feedback is dismissed)
 */
export function resetDecisionDebounce() {
  isProcessingDecision = false;
}

/**
 * Render a complete scenario question
 * @param {HTMLElement} container - Container element
 * @param {Object} options - Scenario options
 */
export function renderScenarioQuestion(container, options) {
  const {
    scenarioName,
    questionNumber,
    totalQuestions,
    heroPosition,
    heroHand,
    actionHistory = null,
    actionSummary = null,
    potSize = null,
    effectiveStack = 100,
    board = null,
    decisions,
    prompt = "What's your action?",
    showPositionTable = true,
    onDecision,
    onQuit
  } = options;

  // Reset debounce when rendering new question
  isProcessingDecision = false;

  container.innerHTML = `
    <div class="scenario-active">
      <!-- Header -->
      <div class="scenario-header">
        <div class="scenario-header__left">
          <button class="btn btn--ghost" id="quit-scenario">&larr; Quit</button>
        </div>
        <div class="scenario-header__center">
          <div class="scenario-header__progress">
            <span id="question-number">${questionNumber}</span>/<span>${totalQuestions}</span>
          </div>
        </div>
        <div class="scenario-header__right">
          <span class="scenario-header__name">${scenarioName}</span>
        </div>
      </div>

      <!-- Main Question Area -->
      <div class="scenario-question">
        <!-- Context Section -->
        <div class="scenario-question__context">
          ${renderContextSection(options)}
        </div>

        <!-- Prompt -->
        <div class="scenario-question__prompt">${prompt}</div>

        <!-- Hero's Hand -->
        <div class="scenario-question__hand">
          <div class="scenario-question__hand-label">Your Hand</div>
          <div class="scenario-question__hand-cards" id="hero-hand"></div>
        </div>

        <!-- Decision Buttons -->
        <div class="scenario-decisions ${decisions.length === 2 ? 'scenario-decisions--binary' : ''}" id="decisions">
          ${renderDecisionButtons(decisions)}
        </div>

        <!-- Expandable Explanation -->
        <div class="expandable" id="expandable-section">
          <button class="expandable__trigger" id="expandable-trigger">
            <span>Why does this matter?</span>
            <span class="expandable__icon">&#9660;</span>
          </button>
          <div class="expandable__content">
            <div class="expandable__inner">
              ${options.whyItMatters || getDefaultWhyItMatters(scenarioName)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render hero's hand cards
  renderHeroHand(container.querySelector('#hero-hand'), heroHand);

  // Render board if present
  if (board && board.length > 0) {
    const boardContainer = container.querySelector('.scenario-question__context');
    const boardSection = document.createElement('div');
    boardSection.id = 'board-section';
    boardContainer.appendChild(boardSection);
    renderBoardDisplay(boardSection, { cards: board });
  }

  // Bind events
  bindScenarioEvents(container, { onDecision, onQuit, decisions });
}

/**
 * Render the context section (action history + pot display + position table)
 */
function renderContextSection(options) {
  const {
    heroPosition,
    actionHistory,
    actionSummary,
    potSize,
    effectiveStack,
    showPositionTable
  } = options;

  let html = '<div class="scenario-context">';

  // Position and action info row
  html += '<div class="scenario-context__row">';

  // Position indicator with mini table
  if (showPositionTable) {
    html += `
      <div class="drill-position-ref">
        <div class="drill-question__position drill-question__position--${heroPosition.toLowerCase()}">
          ${heroPosition}
        </div>
        ${renderPositionTableMini(heroPosition)}
      </div>
    `;
  }

  // Action history or summary
  if (actionHistory) {
    html += `<div class="scenario-context__actions">${renderActionHistory({ actions: actionHistory, heroPosition })}</div>`;
  } else if (actionSummary) {
    html += `<div class="scenario-context__actions">${renderActionSummary(actionSummary)}</div>`;
  }

  html += '</div>';

  // Pot display
  if (potSize !== null) {
    html += renderPotDisplay({
      potSize,
      effectiveStack,
      showSPR: effectiveStack > 0
    });
  }

  html += '</div>';

  return html;
}

/**
 * Render decision buttons with ARIA labels and keyboard support
 */
function renderDecisionButtons(decisions) {
  return decisions.map((decision, index) => {
    const ariaLabel = decision.detail
      ? `${decision.action}: ${decision.detail}`
      : decision.action;

    return `
      <button class="scenario-decision-btn scenario-decision-btn--${decision.action.toLowerCase().replace(/\s+/g, '-')}"
              data-action="${decision.action}"
              data-index="${index}"
              aria-label="${ariaLabel}"
              tabindex="0"
              role="button">
        <span class="scenario-decision-btn__label">${decision.label}</span>
        ${decision.detail ? `<span class="scenario-decision-btn__detail">${decision.detail}</span>` : ''}
      </button>
    `;
  }).join('');
}

/**
 * Render hero's hand
 */
function renderHeroHand(container, hand) {
  if (!container || !hand) return;

  container.innerHTML = '';

  // Hand can be notation (e.g., 'AKs') or cards array
  if (typeof hand === 'string') {
    // Parse notation
    const cards = parseHandNotation(hand);
    cards.forEach(card => {
      const playingCard = new PlayingCard(card.rank, card.suit, { size: 'lg' });
      playingCard.render(container);
    });
  } else if (Array.isArray(hand)) {
    hand.forEach(card => {
      const playingCard = new PlayingCard(card.rank, card.suit, { size: 'lg' });
      playingCard.render(container);
    });
  }
}

/**
 * Parse hand notation to cards
 */
function parseHandNotation(notation) {
  const rank1 = notation[0];
  const rank2 = notation[1];
  const suited = notation.length > 2 && notation[2].toLowerCase() === 's';

  return [
    { rank: rank1, suit: 'h' },
    { rank: rank2, suit: suited ? 'h' : 's' }
  ];
}

/**
 * Bind scenario events with keyboard navigation and debouncing
 */
function bindScenarioEvents(container, { onDecision, onQuit, decisions }) {
  // Quit button
  const quitBtn = container.querySelector('#quit-scenario');
  if (quitBtn && onQuit) {
    quitBtn.addEventListener('click', onQuit);
  }

  // Decision buttons
  const decisionBtns = container.querySelectorAll('.scenario-decision-btn');
  const btnsArray = Array.from(decisionBtns);

  // Handle decision with debouncing
  const handleDecision = (btn) => {
    if (btn.disabled || isProcessingDecision) return;

    isProcessingDecision = true;
    const action = btn.dataset.action;

    // Disable all buttons immediately to prevent double-clicks
    btnsArray.forEach(b => b.disabled = true);

    if (onDecision) {
      onDecision(action);
    }

    // Reset debounce after delay (backup in case feedback doesn't show)
    setTimeout(() => {
      isProcessingDecision = false;
    }, DEBOUNCE_DELAY);
  };

  decisionBtns.forEach((btn, index) => {
    // Click handler
    btn.addEventListener('click', () => handleDecision(btn));

    // Keyboard handler for Enter and Space
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDecision(btn);
      }

      // Arrow key navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (index + 1) % btnsArray.length;
        btnsArray[nextIndex].focus();
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (index - 1 + btnsArray.length) % btnsArray.length;
        btnsArray[prevIndex].focus();
      }
    });
  });

  // Focus first decision button for keyboard users
  if (btnsArray.length > 0) {
    // Delay focus slightly to allow DOM to settle
    requestAnimationFrame(() => {
      btnsArray[0].focus();
    });
  }

  // Expandable section
  const trigger = container.querySelector('#expandable-trigger');
  const expandable = container.querySelector('#expandable-section');
  if (trigger && expandable) {
    trigger.addEventListener('click', () => {
      expandable.classList.toggle('expandable--open');
    });

    // Keyboard support for expandable
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        expandable.classList.toggle('expandable--open');
      }
    });
  }
}

/**
 * Show answer feedback with accessibility support
 */
export function showScenarioFeedback(container, result) {
  const {
    isCorrect,
    playerAnswer,
    correctAnswer,
    explanation,
    rangeDisplay,
    onNext
  } = result;

  // Highlight buttons
  const buttons = container.querySelectorAll('.scenario-decision-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.setAttribute('aria-disabled', 'true');
    const action = btn.dataset.action;

    if (action === playerAnswer) {
      if (isCorrect) {
        btn.classList.add('scenario-decision-btn--correct');
      } else {
        btn.classList.add('scenario-decision-btn--wrong');
      }
    }

    if (action === correctAnswer && !isCorrect) {
      btn.classList.add('scenario-decision-btn--correct-answer');
    }
  });

  // Create feedback overlay with ARIA attributes
  const feedbackOverlay = document.createElement('div');
  feedbackOverlay.className = 'scenario-feedback';
  feedbackOverlay.setAttribute('role', 'dialog');
  feedbackOverlay.setAttribute('aria-modal', 'true');
  feedbackOverlay.setAttribute('aria-labelledby', 'feedback-title');
  feedbackOverlay.innerHTML = `
    <div class="scenario-feedback__content" aria-live="polite">
      <div class="scenario-feedback__icon" aria-hidden="true">${isCorrect ? '&#10003;' : '&#10007;'}</div>
      <div class="scenario-feedback__title scenario-feedback__title--${isCorrect ? 'correct' : 'wrong'}" id="feedback-title">
        ${isCorrect ? 'Correct!' : 'Incorrect'}
      </div>

      <div class="scenario-feedback__answers" role="list" aria-label="Answer comparison">
        <div class="scenario-feedback__answer" role="listitem">
          <span class="scenario-feedback__answer-label">Your answer:</span>
          <span class="scenario-feedback__answer-value">${playerAnswer}</span>
        </div>
        ${!isCorrect ? `
          <div class="scenario-feedback__answer" role="listitem">
            <span class="scenario-feedback__answer-label">GTO answer:</span>
            <span class="scenario-feedback__answer-value">${correctAnswer}</span>
          </div>
        ` : ''}
      </div>

      ${explanation ? `
        <div class="scenario-feedback__explanation" role="region" aria-label="Explanation">
          <div class="scenario-feedback__explanation-title">Why ${correctAnswer}?</div>
          <div class="scenario-feedback__explanation-text">${explanation.text || explanation}</div>
          ${explanation.points ? `
            <ul class="scenario-feedback__explanation-list" role="list">
              ${explanation.points.map(p => `<li role="listitem">${p}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      ` : ''}

      ${rangeDisplay ? `
        <div class="scenario-feedback__range" role="region" aria-label="Range breakdown">
          <div class="scenario-feedback__range-title">${rangeDisplay.title || 'Range Breakdown'}</div>
          <div class="scenario-feedback__range-items">
            ${rangeDisplay.items.map(item => `
              <div class="scenario-feedback__range-item">
                <span class="scenario-feedback__range-action scenario-feedback__range-action--${item.action.toLowerCase().replace(/[- ]/g, '')}">${item.action}:</span>
                <span class="scenario-feedback__range-hands">${item.hands}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="scenario-feedback__methodology">
        How was this determined? <a href="#/methodology" class="scenario-feedback__methodology-link">View Methodology</a>
      </div>

      <div class="scenario-feedback__actions">
        <button class="btn btn--primary scenario-feedback__btn" id="next-question" aria-label="${isCorrect ? 'Continue to next question' : 'Continue'}">
          ${isCorrect ? 'Next Question' : 'Continue'}
        </button>
      </div>
    </div>
  `;

  container.appendChild(feedbackOverlay);

  // Animate in
  requestAnimationFrame(() => {
    feedbackOverlay.classList.add('scenario-feedback--visible');
  });

  // Focus the next button for keyboard users
  const nextBtn = feedbackOverlay.querySelector('#next-question');
  if (nextBtn) {
    requestAnimationFrame(() => {
      nextBtn.focus();
    });

    if (onNext) {
      const handleNext = () => {
        feedbackOverlay.classList.remove('scenario-feedback--visible');
        setTimeout(() => {
          feedbackOverlay.remove();
          resetDecisionDebounce(); // Reset debounce state for next question
          onNext();
        }, 300);
      };

      nextBtn.addEventListener('click', handleNext);

      // Keyboard support
      nextBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNext();
        }
      });
    }
  }
}

/**
 * Update question number display
 */
export function updateQuestionNumber(container, current, total) {
  const numberEl = container.querySelector('#question-number');
  if (numberEl) {
    numberEl.textContent = current;
  }
}

/**
 * Get default "Why it matters" content
 */
function getDefaultWhyItMatters(scenarioName) {
  const defaults = {
    'Defend vs 3-Bet': `
      <p class="scenario-why-text">
        When you open and face a 3-bet, you need to decide: call, 4-bet, or fold.
        The correct response depends on your hand's playability, your position, and the 3-bettor's range.
        Making incorrect decisions here costs you money over time.
      </p>
    `,
    'BB Defense': `
      <p class="scenario-why-text">
        As the big blind, you've already invested 1BB. Getting the right price on defense while avoiding
        dominated situations is crucial for your win rate. Defending too wide or too tight both cost money.
      </p>
    `,
    '3-Bet for Value': `
      <p class="scenario-why-text">
        Value 3-betting builds pots with your strongest hands. Identifying which hands to 3-bet vs call
        affects your ability to extract value and deny equity from marginal holdings.
      </p>
    `
  };

  return defaults[scenarioName] || `
    <p class="scenario-why-text">
      Understanding the correct plays in this situation helps you make profitable decisions at the table.
    </p>
  `;
}
