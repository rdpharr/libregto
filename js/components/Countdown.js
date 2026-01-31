/**
 * Countdown Component
 * Shared countdown overlay for drills and scenarios
 */

/**
 * Show countdown overlay before starting a drill/scenario
 * @param {HTMLElement} container - Container element to append overlay to
 * @param {Function} callback - Function to call when countdown completes
 * @param {Object} options - Optional configuration
 * @param {number} options.startFrom - Number to start countdown from (default: 3)
 * @param {number} options.interval - Interval between counts in ms (default: 800)
 */
export function showCountdown(container, callback, options = {}) {
  const { startFrom = 3, interval = 800 } = options;

  const overlay = document.createElement('div');
  overlay.className = 'drill-countdown';
  overlay.innerHTML = `<div class="drill-countdown__number">${startFrom}</div>`;
  container.appendChild(overlay);

  let count = startFrom;
  const countdownEl = overlay.querySelector('.drill-countdown__number');

  const countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
      countdownEl.classList.remove('drill-countdown__number--pulse');
      void countdownEl.offsetWidth; // Force reflow for animation
      countdownEl.classList.add('drill-countdown__number--pulse');
    } else if (count === 0) {
      countdownEl.textContent = 'GO!';
      countdownEl.classList.add('drill-countdown__number--go');
    } else {
      clearInterval(countdownInterval);
      overlay.remove();
      callback();
    }
  }, interval);

  // Return cleanup function in case we need to cancel
  return () => {
    clearInterval(countdownInterval);
    overlay.remove();
  };
}
