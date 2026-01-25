/**
 * Timer Component
 * Provides countdown and stopwatch functionality for drills
 */

export class Timer {
  constructor(options = {}) {
    this.mode = options.mode || 'countdown'; // 'countdown' or 'stopwatch'
    this.duration = options.duration || 30000; // Default 30 seconds for countdown
    this.onTick = options.onTick || null;
    this.onComplete = options.onComplete || null;
    this.onUrgent = options.onUrgent || null;
    this.urgentThreshold = options.urgentThreshold || 5000; // 5 seconds warning

    this.elapsed = 0;
    this.remaining = this.duration;
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedTime = 0;
    this.animationFrame = null;

    // Per-question tracking
    this.questionTimes = [];
    this.questionStartTime = null;

    this.element = null;
    this.urgentTriggered = false;
  }

  /**
   * Render the timer display
   */
  render(container) {
    this.element = document.createElement('div');
    this.element.className = 'timer';
    this.element.innerHTML = `
      <div class="timer__display">
        <span class="timer__time">${this.formatTime(this.mode === 'countdown' ? this.duration : 0)}</span>
      </div>
      <div class="timer__progress">
        <div class="timer__progress-bar"></div>
      </div>
    `;

    if (typeof container === 'string') {
      document.querySelector(container).appendChild(this.element);
    } else {
      container.appendChild(this.element);
    }

    return this.element;
  }

  /**
   * Format milliseconds to MM:SS or SS.s display
   */
  formatTime(ms, showDecimals = false) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const deciseconds = Math.floor((ms % 1000) / 100);

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (showDecimals && totalSeconds < 10) {
      return `${seconds}.${deciseconds}`;
    }

    return seconds.toString();
  }

  /**
   * Update the timer display
   */
  updateDisplay() {
    if (!this.element) return;

    const timeElement = this.element.querySelector('.timer__time');
    const progressBar = this.element.querySelector('.timer__progress-bar');

    if (this.mode === 'countdown') {
      const showDecimals = this.remaining < 10000;
      timeElement.textContent = this.formatTime(this.remaining, showDecimals);

      // Update progress bar
      const progress = (this.remaining / this.duration) * 100;
      progressBar.style.width = `${progress}%`;

      // Add urgency classes
      if (this.remaining <= this.urgentThreshold) {
        this.element.classList.add('timer--urgent');
        if (!this.urgentTriggered && this.onUrgent) {
          this.urgentTriggered = true;
          this.onUrgent(this.remaining);
        }
      }

      if (this.remaining <= 3000) {
        this.element.classList.add('timer--critical');
      }
    } else {
      // Stopwatch mode
      timeElement.textContent = this.formatTime(this.elapsed, true);
      progressBar.style.width = '100%';
    }
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.startTime = performance.now() - this.pausedTime;
    this.urgentTriggered = false;

    if (this.element) {
      this.element.classList.remove('timer--urgent', 'timer--critical', 'timer--paused');
      this.element.classList.add('timer--running');
    }

    this.tick();
  }

  /**
   * Main tick loop
   */
  tick() {
    if (!this.isRunning || this.isPaused) return;

    const now = performance.now();
    this.elapsed = now - this.startTime;

    if (this.mode === 'countdown') {
      this.remaining = Math.max(0, this.duration - this.elapsed);

      if (this.remaining <= 0) {
        this.stop();
        if (this.onComplete) {
          this.onComplete();
        }
        return;
      }
    }

    this.updateDisplay();

    if (this.onTick) {
      this.onTick(this.mode === 'countdown' ? this.remaining : this.elapsed);
    }

    this.animationFrame = requestAnimationFrame(() => this.tick());
  }

  /**
   * Pause the timer
   */
  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    this.pausedTime = this.elapsed;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    if (this.element) {
      this.element.classList.add('timer--paused');
      this.element.classList.remove('timer--running');
    }
  }

  /**
   * Resume a paused timer
   */
  resume() {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.startTime = performance.now() - this.pausedTime;

    if (this.element) {
      this.element.classList.remove('timer--paused');
      this.element.classList.add('timer--running');
    }

    this.tick();
  }

  /**
   * Stop the timer
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.element) {
      this.element.classList.remove('timer--running', 'timer--paused');
    }
  }

  /**
   * Reset the timer to initial state
   */
  reset() {
    this.stop();
    this.elapsed = 0;
    this.remaining = this.duration;
    this.pausedTime = 0;
    this.urgentTriggered = false;
    this.questionTimes = [];
    this.questionStartTime = null;

    if (this.element) {
      this.element.classList.remove('timer--urgent', 'timer--critical');
    }

    this.updateDisplay();
  }

  /**
   * Start timing a new question
   */
  startQuestion() {
    this.questionStartTime = performance.now();
  }

  /**
   * End timing for current question and record the time
   */
  endQuestion() {
    if (this.questionStartTime === null) return 0;

    const questionTime = performance.now() - this.questionStartTime;
    this.questionTimes.push(questionTime);
    this.questionStartTime = null;

    return questionTime;
  }

  /**
   * Get the time for the last completed question
   */
  getLastQuestionTime() {
    if (this.questionTimes.length === 0) return 0;
    return this.questionTimes[this.questionTimes.length - 1];
  }

  /**
   * Get average time per question
   */
  getAverageTime() {
    if (this.questionTimes.length === 0) return 0;
    const sum = this.questionTimes.reduce((a, b) => a + b, 0);
    return sum / this.questionTimes.length;
  }

  /**
   * Get fastest question time
   */
  getFastestTime() {
    if (this.questionTimes.length === 0) return 0;
    return Math.min(...this.questionTimes);
  }

  /**
   * Get slowest question time
   */
  getSlowestTime() {
    if (this.questionTimes.length === 0) return 0;
    return Math.max(...this.questionTimes);
  }

  /**
   * Get all question times
   */
  getQuestionTimes() {
    return [...this.questionTimes];
  }

  /**
   * Get current elapsed time
   */
  getElapsed() {
    return this.elapsed;
  }

  /**
   * Get remaining time (countdown mode)
   */
  getRemaining() {
    return this.remaining;
  }

  /**
   * Check if timer is currently running
   */
  getIsRunning() {
    return this.isRunning && !this.isPaused;
  }

  /**
   * Clean up the timer
   */
  destroy() {
    this.stop();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

export default Timer;
