/**
 * DrillResults Component
 * End-of-drill summary showing stats, performance rating, and actions
 */

export class DrillResults {
  constructor(options = {}) {
    this.drillId = options.drillId || 'unknown';
    this.drillName = options.drillName || 'Drill';
    this.onPlayAgain = options.onPlayAgain || null;
    this.onNextDrill = options.onNextDrill || null;
    this.onBackToHub = options.onBackToHub || null;

    this.element = null;
    this.stats = null;
    this.previousBest = options.previousBest || null;
  }

  /**
   * Render the results screen
   */
  render(container, stats) {
    this.stats = stats;

    const rating = this.calculateRating(stats);
    const isNewRecord = this.checkNewRecords(stats);

    this.element = document.createElement('div');
    this.element.className = 'drill-results';
    this.element.innerHTML = `
      <div class="drill-results__content">
        <div class="drill-results__header">
          <h2 class="drill-results__title">Drill Complete!</h2>
          <div class="drill-results__drill-name">${this.drillName}</div>
        </div>

        <div class="drill-results__rating">
          ${this.renderStars(rating.stars)}
          <div class="drill-results__grade">${rating.grade}</div>
          <div class="drill-results__message">${rating.message}</div>
        </div>

        <div class="drill-results__stats">
          <div class="drill-results__stat">
            <div class="drill-results__stat-value ${stats.accuracy >= 80 ? 'drill-results__stat-value--good' : ''}">${Math.round(stats.accuracy)}%</div>
            <div class="drill-results__stat-label">Accuracy</div>
            ${stats.correct !== undefined ? `<div class="drill-results__stat-detail">${stats.correct}/${stats.total} correct</div>` : ''}
          </div>

          <div class="drill-results__stat">
            <div class="drill-results__stat-value ${stats.avgTime <= 2000 ? 'drill-results__stat-value--good' : ''}">${this.formatTime(stats.avgTime)}</div>
            <div class="drill-results__stat-label">Avg Time</div>
            ${stats.fastestTime ? `<div class="drill-results__stat-detail">Best: ${this.formatTime(stats.fastestTime)}</div>` : ''}
          </div>

          <div class="drill-results__stat">
            <div class="drill-results__stat-value ${stats.bestStreak >= 10 ? 'drill-results__stat-value--good' : ''}">${stats.bestStreak}</div>
            <div class="drill-results__stat-label">Best Streak</div>
            ${isNewRecord.streak ? '<div class="drill-results__stat-detail drill-results__stat-detail--new">New Record!</div>' : ''}
          </div>
        </div>

        ${this.renderComparison(stats)}

        <div class="drill-results__actions">
          <button class="btn btn--primary drill-results__btn drill-results__btn--again">
            Play Again
          </button>
          <button class="btn btn--secondary drill-results__btn drill-results__btn--next">
            Next Drill
          </button>
          <button class="btn btn--ghost drill-results__btn drill-results__btn--hub">
            Back to Drills
          </button>
        </div>

        ${stats.passed ? this.renderPassBadge() : this.renderEncouragement(stats)}

        ${this.renderFeedbackLinks()}
      </div>
    `;

    // Bind event listeners
    this.element.querySelector('.drill-results__btn--again').addEventListener('click', () => {
      if (this.onPlayAgain) this.onPlayAgain();
    });

    this.element.querySelector('.drill-results__btn--next').addEventListener('click', () => {
      if (this.onNextDrill) this.onNextDrill();
    });

    this.element.querySelector('.drill-results__btn--hub').addEventListener('click', () => {
      if (this.onBackToHub) this.onBackToHub();
    });

    if (typeof container === 'string') {
      document.querySelector(container).appendChild(this.element);
    } else {
      container.appendChild(this.element);
    }

    // Trigger entrance animation
    requestAnimationFrame(() => {
      this.element.classList.add('drill-results--visible');
    });

    return this.element;
  }

  /**
   * Calculate performance rating
   */
  calculateRating(stats) {
    const accuracy = stats.accuracy;
    const avgTimeScore = stats.avgTime <= 1500 ? 100 : stats.avgTime <= 2000 ? 80 : stats.avgTime <= 3000 ? 60 : 40;
    const streakBonus = Math.min(stats.bestStreak * 2, 20);

    const score = (accuracy * 0.7) + (avgTimeScore * 0.2) + streakBonus;

    if (score >= 95) {
      return { stars: 5, grade: 'S', message: 'Perfect! You\'re a master!' };
    } else if (score >= 85) {
      return { stars: 4, grade: 'A', message: 'Excellent performance!' };
    } else if (score >= 75) {
      return { stars: 3, grade: 'B', message: 'Great job! Keep practicing!' };
    } else if (score >= 65) {
      return { stars: 2, grade: 'C', message: 'Good effort! Room to improve.' };
    } else if (score >= 50) {
      return { stars: 1, grade: 'D', message: 'Keep practicing!' };
    } else {
      return { stars: 0, grade: 'F', message: 'Try again, you\'ll get it!' };
    }
  }

  /**
   * Render star rating
   */
  renderStars(count) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      if (i < count) {
        stars += '<span class="drill-results__star drill-results__star--filled">★</span>';
      } else {
        stars += '<span class="drill-results__star">☆</span>';
      }
    }
    return `<div class="drill-results__stars">${stars}</div>`;
  }

  /**
   * Check for new records
   */
  checkNewRecords(stats) {
    if (!this.previousBest) {
      return { accuracy: true, time: true, streak: true };
    }

    return {
      accuracy: stats.accuracy > (this.previousBest.accuracy || 0),
      time: stats.avgTime < (this.previousBest.avgTime || Infinity),
      streak: stats.bestStreak > (this.previousBest.bestStreak || 0)
    };
  }

  /**
   * Render comparison to previous best
   */
  renderComparison(stats) {
    if (!this.previousBest) return '';

    const accuracyDiff = stats.accuracy - (this.previousBest.accuracy || 0);
    const timeDiff = (this.previousBest.avgTime || stats.avgTime) - stats.avgTime;
    const streakDiff = stats.bestStreak - (this.previousBest.bestStreak || 0);

    if (accuracyDiff === 0 && timeDiff === 0 && streakDiff === 0) return '';

    return `
      <div class="drill-results__comparison">
        <div class="drill-results__comparison-title">vs. Previous Best</div>
        <div class="drill-results__comparison-items">
          ${accuracyDiff !== 0 ? `
            <div class="drill-results__comparison-item ${accuracyDiff > 0 ? 'drill-results__comparison-item--better' : 'drill-results__comparison-item--worse'}">
              ${accuracyDiff > 0 ? '↑' : '↓'} ${Math.abs(Math.round(accuracyDiff))}% accuracy
            </div>
          ` : ''}
          ${timeDiff !== 0 ? `
            <div class="drill-results__comparison-item ${timeDiff > 0 ? 'drill-results__comparison-item--better' : 'drill-results__comparison-item--worse'}">
              ${timeDiff > 0 ? '↓' : '↑'} ${this.formatTime(Math.abs(timeDiff))} faster
            </div>
          ` : ''}
          ${streakDiff > 0 ? `
            <div class="drill-results__comparison-item drill-results__comparison-item--better">
              ↑ ${streakDiff} streak
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render pass badge
   */
  renderPassBadge() {
    return `
      <div class="drill-results__badge drill-results__badge--passed">
        <span class="drill-results__badge-icon">✓</span>
        <span class="drill-results__badge-text">Drill Passed!</span>
      </div>
    `;
  }

  /**
   * Render encouragement for not passing
   */
  renderEncouragement(stats) {
    const threshold = stats.passThreshold || 70;
    const needed = threshold - stats.accuracy;

    return `
      <div class="drill-results__encouragement">
        <div class="drill-results__encouragement-text">
          Need ${Math.round(needed)}% more accuracy to pass this drill.
        </div>
        <div class="drill-results__encouragement-tip">
          Tip: Focus on accuracy first, speed comes with practice!
        </div>
      </div>
    `;
  }

  /**
   * Render feedback links (report issues / support)
   */
  renderFeedbackLinks() {
    return `
      <div class="drill-results__feedback">
        <p class="drill-results__feedback-text">
          Found a problem? <a href="https://github.com/rdpharr/libregto/issues" target="_blank" rel="noopener" class="drill-results__feedback-link">Report it on GitHub</a>
        </p>
        <p class="drill-results__feedback-text">
          Did this improve your skills? <a href="https://buymeacoffee.com/rdpharr" target="_blank" rel="noopener" class="drill-results__feedback-link drill-results__feedback-link--coffee">Buy me a coffee ☕</a>
        </p>
      </div>
    `;
  }

  /**
   * Format time in milliseconds to display string
   */
  formatTime(ms) {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  }

  /**
   * Get stats summary for storage
   */
  getStatsSummary() {
    if (!this.stats) return null;

    return {
      accuracy: this.stats.accuracy,
      avgTime: this.stats.avgTime,
      bestStreak: this.stats.bestStreak,
      passed: this.stats.passed,
      timestamp: Date.now()
    };
  }

  /**
   * Show the results (for delayed rendering)
   */
  show() {
    if (this.element) {
      this.element.classList.add('drill-results--visible');
    }
  }

  /**
   * Hide the results
   */
  hide() {
    if (this.element) {
      this.element.classList.remove('drill-results--visible');
    }
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

export default DrillResults;
