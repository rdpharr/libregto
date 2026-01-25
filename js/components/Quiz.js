/**
 * Quiz Component
 * Handles multiple choice, slider, and sorting quiz types
 */

/**
 * Create a multiple choice quiz
 * @param {object} options - Quiz options
 * @param {string} options.question - Question text
 * @param {Array} options.options - Array of {label, value, correct?} options
 * @param {boolean} options.multiSelect - Allow multiple selections
 * @param {Function} options.onAnswer - Callback when answered
 * @param {boolean} options.showFeedback - Show immediate feedback
 */
export function createMultipleChoice(options = {}) {
  const {
    question,
    options: choices,
    multiSelect = false,
    onAnswer = null,
    showFeedback = true
  } = options;

  const container = document.createElement('div');
  container.className = 'quiz';

  // Question
  const questionEl = document.createElement('div');
  questionEl.className = 'quiz__question';
  questionEl.textContent = question;
  container.appendChild(questionEl);

  // Options
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'quiz__options';

  const selectedValues = new Set();
  let answered = false;

  choices.forEach((choice, index) => {
    const option = document.createElement('div');
    option.className = 'quiz__option';
    option.dataset.value = choice.value;
    option.dataset.correct = choice.correct || false;

    // Marker (A, B, C, D)
    const marker = document.createElement('div');
    marker.className = 'quiz__option-marker';
    marker.textContent = String.fromCharCode(65 + index);

    // Text
    const text = document.createElement('div');
    text.className = 'quiz__option-text';
    text.textContent = choice.label;

    option.appendChild(marker);
    option.appendChild(text);

    option.addEventListener('click', () => {
      if (answered && showFeedback) return;

      if (multiSelect) {
        option.classList.toggle('quiz__option--selected');
        if (selectedValues.has(choice.value)) {
          selectedValues.delete(choice.value);
        } else {
          selectedValues.add(choice.value);
        }
      } else {
        // Single select - clear others
        optionsContainer.querySelectorAll('.quiz__option').forEach(opt => {
          opt.classList.remove('quiz__option--selected');
        });
        option.classList.add('quiz__option--selected');
        selectedValues.clear();
        selectedValues.add(choice.value);

        // Auto-submit on single select if showFeedback
        if (showFeedback && !multiSelect) {
          submitAnswer();
        }
      }
    });

    optionsContainer.appendChild(option);
  });

  container.appendChild(optionsContainer);

  // Submit button for multi-select
  if (multiSelect) {
    const actions = document.createElement('div');
    actions.className = 'quiz__actions';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn--primary';
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', submitAnswer);

    actions.appendChild(submitBtn);
    container.appendChild(actions);
  }

  function submitAnswer() {
    if (answered) return;
    answered = true;

    const selected = Array.from(selectedValues);
    const correctValues = choices.filter(c => c.correct).map(c => c.value);
    const isCorrect = arraysEqual(selected.sort(), correctValues.sort());

    if (showFeedback) {
      // Show feedback on options
      optionsContainer.querySelectorAll('.quiz__option').forEach(opt => {
        opt.classList.add('quiz__option--disabled');

        if (opt.dataset.correct === 'true') {
          opt.classList.add('quiz__option--correct');
        } else if (opt.classList.contains('quiz__option--selected')) {
          opt.classList.add('quiz__option--incorrect');
        }
      });
    }

    if (onAnswer) {
      onAnswer({
        selected,
        correct: correctValues,
        isCorrect
      });
    }
  }

  // Expose methods
  container.submit = submitAnswer;
  container.reset = () => {
    answered = false;
    selectedValues.clear();
    optionsContainer.querySelectorAll('.quiz__option').forEach(opt => {
      opt.classList.remove(
        'quiz__option--selected',
        'quiz__option--correct',
        'quiz__option--incorrect',
        'quiz__option--disabled'
      );
    });
  };

  return container;
}

/**
 * Create an equity slider quiz
 * @param {object} options - Quiz options
 * @param {string} options.question - Question text
 * @param {number} options.correctValue - Correct equity percentage
 * @param {number} options.tolerance - Acceptable tolerance (default 10)
 * @param {Function} options.onAnswer - Callback when answered
 */
export function createEquitySlider(options = {}) {
  const {
    question,
    correctValue,
    tolerance = 10,
    onAnswer = null
  } = options;

  const container = document.createElement('div');
  container.className = 'quiz';

  // Question
  const questionEl = document.createElement('div');
  questionEl.className = 'quiz__question';
  questionEl.textContent = question;
  container.appendChild(questionEl);

  // Slider container
  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'quiz__slider-container';

  // Value display
  const valueDisplay = document.createElement('div');
  valueDisplay.className = 'quiz__slider-value';
  valueDisplay.textContent = '50%';

  // Slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'quiz__slider';
  slider.min = 0;
  slider.max = 100;
  slider.value = 50;

  slider.addEventListener('input', () => {
    valueDisplay.textContent = `${slider.value}%`;
  });

  // Labels
  const labels = document.createElement('div');
  labels.className = 'quiz__slider-labels';
  labels.innerHTML = '<span>0%</span><span>50%</span><span>100%</span>';

  sliderContainer.appendChild(valueDisplay);
  sliderContainer.appendChild(slider);
  sliderContainer.appendChild(labels);
  container.appendChild(sliderContainer);

  // Submit button
  const actions = document.createElement('div');
  actions.className = 'quiz__actions';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn--primary';
  submitBtn.textContent = 'Submit';

  let answered = false;

  submitBtn.addEventListener('click', () => {
    if (answered) return;
    answered = true;

    const userValue = parseInt(slider.value);
    const diff = Math.abs(userValue - correctValue);
    const isCorrect = diff <= tolerance;

    // Disable slider
    slider.disabled = true;
    submitBtn.disabled = true;

    // Show result
    const result = document.createElement('div');
    result.className = 'equity-exercise__result mt-4';

    const feedback = document.createElement('div');
    feedback.className = isCorrect ? 'text-success' : 'text-error';
    feedback.textContent = isCorrect ? 'Correct!' : 'Not quite!';

    const actual = document.createElement('div');
    actual.className = 'equity-exercise__actual';
    actual.textContent = `Actual equity: ${correctValue}% (you guessed ${userValue}%)`;

    result.appendChild(feedback);
    result.appendChild(actual);
    sliderContainer.appendChild(result);

    if (onAnswer) {
      onAnswer({
        userValue,
        correctValue,
        difference: diff,
        isCorrect
      });
    }
  });

  actions.appendChild(submitBtn);
  container.appendChild(actions);

  // Expose methods
  container.getValue = () => parseInt(slider.value);
  container.reset = () => {
    answered = false;
    slider.value = 50;
    slider.disabled = false;
    submitBtn.disabled = false;
    valueDisplay.textContent = '50%';
    const result = sliderContainer.querySelector('.equity-exercise__result');
    if (result) result.remove();
  };

  return container;
}

/**
 * Create a hand tier sorting quiz
 * @param {object} options - Quiz options
 * @param {string} options.hand - Hand notation to categorize
 * @param {Array} options.tiers - Available tier options
 * @param {string} options.correctTier - Correct tier
 * @param {Function} options.onAnswer - Callback when answered
 */
export function createTierSort(options = {}) {
  const {
    hand,
    tiers = ['premium', 'strong', 'playable', 'marginal', 'trash'],
    correctTier,
    onAnswer = null
  } = options;

  const container = document.createElement('div');
  container.className = 'tier-sort__hand';

  // Hand display
  const handDisplay = document.createElement('div');
  handDisplay.className = 'tier-sort__hand-display';
  handDisplay.textContent = hand;
  handDisplay.style.fontFamily = 'var(--font-mono)';
  handDisplay.style.fontSize = 'var(--text-xl)';
  handDisplay.style.fontWeight = 'var(--font-bold)';
  handDisplay.style.minWidth = '60px';

  // Options
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'tier-sort__options';

  let selectedTier = null;
  let answered = false;

  const tierLabels = {
    premium: 'Premium',
    strong: 'Strong',
    playable: 'Playable',
    marginal: 'Marginal',
    trash: 'Trash'
  };

  tiers.forEach(tier => {
    const option = document.createElement('button');
    option.className = 'tier-sort__option';
    option.textContent = tierLabels[tier] || tier;
    option.dataset.tier = tier;

    option.addEventListener('click', () => {
      if (answered) return;

      // Toggle selection
      optionsContainer.querySelectorAll('.tier-sort__option').forEach(opt => {
        opt.classList.remove('tier-sort__option--selected');
      });
      option.classList.add('tier-sort__option--selected');
      selectedTier = tier;

      // Auto-submit
      answered = true;
      const isCorrect = tier === correctTier;

      // Show feedback
      if (isCorrect) {
        option.style.borderColor = 'var(--color-success)';
        option.style.backgroundColor = 'var(--color-success-soft)';
      } else {
        option.style.borderColor = 'var(--color-error)';
        option.style.backgroundColor = 'var(--color-error-soft)';

        // Highlight correct answer
        const correctOption = optionsContainer.querySelector(`[data-tier="${correctTier}"]`);
        if (correctOption) {
          correctOption.style.borderColor = 'var(--color-success)';
          correctOption.style.backgroundColor = 'var(--color-success-soft)';
        }
      }

      if (onAnswer) {
        onAnswer({
          hand,
          selected: tier,
          correct: correctTier,
          isCorrect
        });
      }
    });

    optionsContainer.appendChild(option);
  });

  container.appendChild(handDisplay);
  container.appendChild(optionsContainer);

  return container;
}

/**
 * Create a feedback modal
 * @param {object} options - Modal options
 * @param {boolean} options.correct - Was the answer correct
 * @param {string} options.title - Modal title
 * @param {string} options.message - Feedback message
 * @param {string} options.stat - Optional stat to display
 * @param {Function} options.onContinue - Continue button callback
 */
export function createFeedbackModal(options = {}) {
  const {
    correct = true,
    title = correct ? 'Correct!' : 'Not quite!',
    message = '',
    stat = null,
    onContinue = null
  } = options;

  const modal = document.createElement('div');
  modal.className = `feedback-modal feedback-modal--${correct ? 'correct' : 'incorrect'}`;

  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'feedback-modal__backdrop';
  backdrop.addEventListener('click', close);

  // Content
  const content = document.createElement('div');
  content.className = 'feedback-modal__content';

  // Icon
  const icon = document.createElement('div');
  icon.className = 'feedback-modal__icon';
  icon.textContent = correct ? '\u2713' : '\u2717'; // Checkmark or X

  // Title
  const titleEl = document.createElement('div');
  titleEl.className = 'feedback-modal__title';
  titleEl.textContent = title;

  // Message
  const messageEl = document.createElement('div');
  messageEl.className = 'feedback-modal__message';
  messageEl.textContent = message;

  // Stat (if provided)
  if (stat) {
    const statEl = document.createElement('div');
    statEl.className = 'feedback-modal__stat';
    statEl.textContent = stat;
    content.appendChild(statEl);
  }

  // Continue button
  const continueBtn = document.createElement('button');
  continueBtn.className = 'btn btn--primary btn--full mt-4';
  continueBtn.textContent = 'Continue';
  continueBtn.addEventListener('click', close);

  content.appendChild(icon);
  content.appendChild(titleEl);
  content.appendChild(messageEl);
  content.appendChild(continueBtn);

  modal.appendChild(backdrop);
  modal.appendChild(content);

  function close() {
    modal.classList.remove('feedback-modal--visible');
    setTimeout(() => {
      modal.remove();
      if (onContinue) onContinue();
    }, 200);
  }

  // Show method
  modal.show = () => {
    document.body.appendChild(modal);
    // Trigger reflow for animation
    modal.offsetHeight;
    modal.classList.add('feedback-modal--visible');
  };

  modal.close = close;

  return modal;
}

/**
 * Create a progress indicator for quizzes
 * @param {number} current - Current question number
 * @param {number} total - Total questions
 * @param {number} correct - Number correct so far
 */
export function createProgressIndicator(current, total, correct = 0) {
  const container = document.createElement('div');
  container.className = 'quiz__progress';

  // Progress text
  const text = document.createElement('span');
  text.className = 'quiz__progress-text';
  text.textContent = `${current}/${total}`;

  // Progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'progress progress--sm';
  progressBar.style.flex = '1';

  const progressFill = document.createElement('div');
  progressFill.className = 'progress__bar';
  progressFill.style.width = `${(current / total) * 100}%`;

  progressBar.appendChild(progressFill);

  // Score
  const score = document.createElement('span');
  score.className = 'quiz__progress-text text-success';
  score.textContent = `${correct} correct`;

  container.appendChild(text);
  container.appendChild(progressBar);
  container.appendChild(score);

  return container;
}

// Helper function
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default {
  createMultipleChoice,
  createEquitySlider,
  createTierSort,
  createFeedbackModal,
  createProgressIndicator
};
