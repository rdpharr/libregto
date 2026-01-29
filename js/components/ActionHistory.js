/**
 * ActionHistory Component
 * Displays preflop/postflop action timeline
 */

/**
 * Render action history timeline
 * @param {Object} options - Configuration options
 * @param {Array} options.actions - Array of action objects
 * @param {string} options.heroPosition - Hero's position
 * @param {string} [options.layout='horizontal'] - 'horizontal' or 'vertical'
 * @returns {string} HTML string
 */
export function renderActionHistory(options) {
  const {
    actions = [],
    heroPosition,
    layout = 'horizontal'
  } = options;

  if (actions.length === 0) {
    return '';
  }

  const layoutClass = layout === 'horizontal' ? 'action-history--horizontal' : '';

  return `
    <div class="action-history ${layoutClass}">
      <div class="action-history__title">Preflop Action</div>
      <div class="action-history__positions">
        ${actions.map((action, index) => renderActionStep(action, heroPosition, index, actions.length)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a single action step
 * @param {Object} action - Action object
 * @param {string} heroPosition - Hero's position
 * @param {number} index - Step index
 * @param {number} total - Total number of steps
 * @returns {string} HTML string
 */
function renderActionStep(action, heroPosition, index, total) {
  const isHero = action.position === heroPosition;
  const positionClass = `action-history__position--${action.position.toLowerCase()}`;
  const heroClass = isHero ? 'action-history__position--hero' : '';
  const actionClass = getActionClass(action.action);
  const heroActionClass = isHero ? 'action-history__action--hero' : '';

  return `
    <div class="action-history__seat">
      <div class="action-history__position ${positionClass} ${heroClass}">
        ${action.position}
      </div>
      <div class="action-history__action ${actionClass} ${heroActionClass}">
        ${formatAction(action)}
      </div>
    </div>
  `;
}

/**
 * Get CSS class for action type
 * @param {string} action - Action type
 * @returns {string} CSS class
 */
function getActionClass(action) {
  const actionLower = action.toLowerCase();
  if (actionLower === 'fold') return 'action-history__action--fold';
  if (actionLower === 'call') return 'action-history__action--call';
  if (actionLower === 'raise' || actionLower === 'open') return 'action-history__action--raise';
  if (actionLower === '3bet' || actionLower === '3-bet') return 'action-history__action--3bet';
  if (actionLower === '4bet' || actionLower === '4-bet') return 'action-history__action--4bet';
  return '';
}

/**
 * Format action for display
 * @param {Object} action - Action object
 * @returns {string} Formatted action string
 */
function formatAction(action) {
  const actionLower = action.action.toLowerCase();

  if (actionLower === 'fold') {
    return 'fold';
  }

  if (action.amount) {
    if (actionLower === 'open' || actionLower === 'raise') {
      return `${action.amount}BB`;
    }
    if (actionLower === '3bet' || actionLower === '3-bet') {
      return `3bet ${action.amount}BB`;
    }
    if (actionLower === '4bet' || actionLower === '4-bet') {
      return `4bet ${action.amount}BB`;
    }
    if (actionLower === 'call') {
      return `call`;
    }
    return `${action.action} ${action.amount}BB`;
  }

  return action.action;
}

/**
 * Render compact action summary
 * @param {Object} options - Configuration options
 * @returns {string} HTML string
 */
export function renderActionSummary(options) {
  const {
    openerPosition,
    openerAction = 'opens',
    openerAmount = '2.5BB',
    villainPosition,
    villainAction,
    villainAmount,
    heroPosition
  } = options;

  let summary = `<strong>${openerPosition}</strong> ${openerAction} ${openerAmount}`;

  if (villainPosition && villainAction) {
    summary += `, <strong>${villainPosition}</strong> ${villainAction}`;
    if (villainAmount) {
      summary += ` to ${villainAmount}`;
    }
  }

  if (heroPosition) {
    summary += `. Action to <strong>you (${heroPosition})</strong>`;
  }

  return `
    <div class="action-history">
      <div class="action-history__title">Situation</div>
      <p class="action-history__summary" style="color: var(--color-text-secondary); font-size: var(--text-sm); margin: 0;">
        ${summary}
      </p>
    </div>
  `;
}

/**
 * Create action object helper
 * @param {string} position - Position (UTG, MP, CO, BTN, SB, BB)
 * @param {string} action - Action type (fold, call, raise, 3bet, 4bet)
 * @param {number|null} amount - Amount in BB
 * @returns {Object} Action object
 */
export function createAction(position, action, amount = null) {
  return { position, action, amount };
}

/**
 * Generate standard preflop open actions
 * @param {string} openerPosition - Position of opener
 * @param {number} openSize - Open size in BB
 * @returns {Array} Array of fold actions up to opener, then opener's raise
 */
export function generateOpenActions(openerPosition, openSize = 2.5) {
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const openerIndex = positions.indexOf(openerPosition);

  if (openerIndex === -1) return [];

  const actions = [];

  // Add folds before opener
  for (let i = 0; i < openerIndex; i++) {
    actions.push(createAction(positions[i], 'fold'));
  }

  // Add opener's raise
  actions.push(createAction(openerPosition, 'open', openSize));

  return actions;
}

/**
 * Generate actions for 3-bet scenario
 * @param {string} openerPosition - Position of opener
 * @param {string} threeBetPosition - Position of 3-bettor
 * @param {number} openSize - Open size in BB
 * @param {number} threeBetSize - 3-bet size in BB
 * @returns {Array} Array of actions
 */
export function generateThreeBetActions(openerPosition, threeBetPosition, openSize = 2.5, threeBetSize = 8) {
  const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
  const openerIndex = positions.indexOf(openerPosition);
  const threeBetIndex = positions.indexOf(threeBetPosition);

  if (openerIndex === -1 || threeBetIndex === -1) return [];

  const actions = [];

  // Add folds before opener
  for (let i = 0; i < openerIndex; i++) {
    actions.push(createAction(positions[i], 'fold'));
  }

  // Add opener's raise
  actions.push(createAction(openerPosition, 'open', openSize));

  // Add folds between opener and 3-bettor
  for (let i = openerIndex + 1; i < threeBetIndex; i++) {
    actions.push(createAction(positions[i], 'fold'));
  }

  // Add 3-bet
  actions.push(createAction(threeBetPosition, '3bet', threeBetSize));

  return actions;
}
