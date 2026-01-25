/**
 * StreakCounter Component
 * Tracks and displays answer streaks with milestone celebrations
 */

export class StreakCounter {
  constructor(options = {}) {
    this.currentStreak = 0;
    this.bestStreak = options.bestStreak || 0;
    this.onMilestone = options.onMilestone || null;
    this.onStreakBreak = options.onStreakBreak || null;

    // Milestone thresholds
    this.milestones = [5, 10, 15, 25, 50, 75, 100];
    this.lastMilestone = 0;

    this.element = null;
  }

  /**
   * Render the streak counter
   */
  render(container) {
    this.element = document.createElement('div');
    this.element.className = 'streak-counter';
    this.element.innerHTML = `
      <div class="streak-counter__current">
        <span class="streak-counter__flames"></span>
        <span class="streak-counter__value">0</span>
        <span class="streak-counter__label">streak</span>
      </div>
      <div class="streak-counter__best">
        Best: <span class="streak-counter__best-value">${this.bestStreak}</span>
      </div>
      <div class="streak-counter__milestone-popup"></div>
    `;

    if (typeof container === 'string') {
      document.querySelector(container).appendChild(this.element);
    } else {
      container.appendChild(this.element);
    }

    this.updateDisplay();
    return this.element;
  }

  /**
   * Get flame emoji string based on streak level
   */
  getFlameEmoji() {
    if (this.currentStreak === 0) return '';
    if (this.currentStreak < 5) return '🔥';
    if (this.currentStreak < 10) return '🔥🔥';
    if (this.currentStreak < 25) return '🔥🔥🔥';
    if (this.currentStreak < 50) return '💥🔥🔥🔥';
    if (this.currentStreak < 100) return '⚡💥🔥🔥🔥';
    return '🌟⚡💥🔥🔥🔥';
  }

  /**
   * Get tier class based on streak level
   */
  getTierClass() {
    if (this.currentStreak === 0) return '';
    if (this.currentStreak < 5) return 'streak-counter--tier-1';
    if (this.currentStreak < 10) return 'streak-counter--tier-2';
    if (this.currentStreak < 25) return 'streak-counter--tier-3';
    if (this.currentStreak < 50) return 'streak-counter--tier-4';
    if (this.currentStreak < 100) return 'streak-counter--tier-5';
    return 'streak-counter--tier-6';
  }

  /**
   * Update the streak display
   */
  updateDisplay() {
    if (!this.element) return;

    const valueElement = this.element.querySelector('.streak-counter__value');
    const flamesElement = this.element.querySelector('.streak-counter__flames');
    const bestValueElement = this.element.querySelector('.streak-counter__best-value');

    valueElement.textContent = this.currentStreak;
    flamesElement.textContent = this.getFlameEmoji();
    bestValueElement.textContent = this.bestStreak;

    // Update tier class
    this.element.className = 'streak-counter ' + this.getTierClass();

    // Add active class if streak > 0
    if (this.currentStreak > 0) {
      this.element.classList.add('streak-counter--active');
    } else {
      this.element.classList.remove('streak-counter--active');
    }
  }

  /**
   * Increment streak on correct answer
   */
  increment() {
    this.currentStreak++;

    // Check for new best
    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
      this.showNewBestAnimation();
    }

    // Check for milestone
    const milestone = this.checkMilestone();
    if (milestone) {
      this.showMilestoneAnimation(milestone);
      if (this.onMilestone) {
        this.onMilestone(milestone, this.currentStreak);
      }
    }

    this.updateDisplay();
    this.showIncrementAnimation();

    return this.currentStreak;
  }

  /**
   * Break streak on wrong answer
   */
  break() {
    const brokenStreak = this.currentStreak;

    if (brokenStreak > 0) {
      this.showBreakAnimation();
      if (this.onStreakBreak) {
        this.onStreakBreak(brokenStreak);
      }
    }

    this.currentStreak = 0;
    this.lastMilestone = 0;
    this.updateDisplay();

    return brokenStreak;
  }

  /**
   * Check if current streak hit a milestone
   */
  checkMilestone() {
    for (const milestone of this.milestones) {
      if (this.currentStreak === milestone && milestone > this.lastMilestone) {
        this.lastMilestone = milestone;
        return milestone;
      }
    }
    return null;
  }

  /**
   * Show increment animation
   */
  showIncrementAnimation() {
    if (!this.element) return;

    const valueElement = this.element.querySelector('.streak-counter__value');
    valueElement.classList.remove('streak-counter__value--pop');

    // Force reflow
    void valueElement.offsetWidth;

    valueElement.classList.add('streak-counter__value--pop');
  }

  /**
   * Show streak break animation
   */
  showBreakAnimation() {
    if (!this.element) return;

    this.element.classList.add('streak-counter--breaking');

    setTimeout(() => {
      if (this.element) {
        this.element.classList.remove('streak-counter--breaking');
      }
    }, 600);
  }

  /**
   * Show new best streak animation
   */
  showNewBestAnimation() {
    if (!this.element) return;

    const bestElement = this.element.querySelector('.streak-counter__best');
    bestElement.classList.add('streak-counter__best--new');

    setTimeout(() => {
      if (bestElement) {
        bestElement.classList.remove('streak-counter__best--new');
      }
    }, 1000);
  }

  /**
   * Show milestone celebration animation
   */
  showMilestoneAnimation(milestone) {
    if (!this.element) return;

    const popup = this.element.querySelector('.streak-counter__milestone-popup');

    let message = '';
    let emoji = '';

    switch (milestone) {
      case 5:
        message = 'Nice start!';
        emoji = '👍';
        break;
      case 10:
        message = 'On fire!';
        emoji = '🔥';
        break;
      case 15:
        message = 'Keep it up!';
        emoji = '💪';
        break;
      case 25:
        message = 'Incredible!';
        emoji = '🌟';
        break;
      case 50:
        message = 'Legendary!';
        emoji = '👑';
        break;
      case 75:
        message = 'Unstoppable!';
        emoji = '⚡';
        break;
      case 100:
        message = 'PERFECT!';
        emoji = '🏆';
        break;
      default:
        message = `${milestone} streak!`;
        emoji = '🎯';
    }

    popup.innerHTML = `
      <span class="streak-counter__milestone-emoji">${emoji}</span>
      <span class="streak-counter__milestone-text">${message}</span>
    `;

    popup.classList.add('streak-counter__milestone-popup--visible');

    // Add celebration class to main element
    this.element.classList.add('streak-counter--celebrating');

    setTimeout(() => {
      if (popup) {
        popup.classList.remove('streak-counter__milestone-popup--visible');
      }
      if (this.element) {
        this.element.classList.remove('streak-counter--celebrating');
      }
    }, 2000);
  }

  /**
   * Get current streak value
   */
  getCurrentStreak() {
    return this.currentStreak;
  }

  /**
   * Get best streak value
   */
  getBestStreak() {
    return this.bestStreak;
  }

  /**
   * Set the best streak (for loading from storage)
   */
  setBestStreak(value) {
    this.bestStreak = value;
    this.updateDisplay();
  }

  /**
   * Reset streak counter
   */
  reset() {
    this.currentStreak = 0;
    this.lastMilestone = 0;
    this.updateDisplay();
  }

  /**
   * Full reset including best streak
   */
  fullReset() {
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.lastMilestone = 0;
    this.updateDisplay();
  }

  /**
   * Get stats object
   */
  getStats() {
    return {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak
    };
  }

  /**
   * Clean up the component
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

export default StreakCounter;
