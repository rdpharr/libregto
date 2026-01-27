/**
 * PositionTableMini
 * Compact poker table diagram showing seat positions with active highlight.
 * Used as a visual reference in drills that involve table position.
 */

const SEAT_POSITIONS = [
  { id: 'UTG', label: 'UTG' },
  { id: 'MP',  label: 'MP' },
  { id: 'CO',  label: 'CO' },
  { id: 'BTN', label: 'BTN' },
  { id: 'SB',  label: 'SB' },
  { id: 'BB',  label: 'BB' }
];

/**
 * Render a mini poker table with highlighted position(s)
 * @param {string|string[]} activePositions - position(s) to highlight
 * @returns {string} HTML string
 */
export function renderPositionTableMini(activePositions) {
  const active = Array.isArray(activePositions) ? activePositions : [activePositions];

  const seats = SEAT_POSITIONS.map(seat => {
    const isActive = active.includes(seat.id);
    const activeClass = isActive ? ` mini-table__seat--active mini-table__seat--${seat.id.toLowerCase()}` : '';
    return `<div class="mini-table__seat mini-table__seat-pos--${seat.id.toLowerCase()}${activeClass}">${seat.label}</div>`;
  }).join('');

  return `
    <div class="mini-table" role="img" aria-label="Poker table showing ${active.join(', ')} position">
      <div class="mini-table__felt">
        ${seats}
      </div>
    </div>
  `;
}

/**
 * Update an existing mini table's active position without re-rendering
 * @param {HTMLElement} container - element containing the mini table
 * @param {string|string[]} activePositions - position(s) to highlight
 */
export function updatePositionTableMini(container, activePositions) {
  const active = Array.isArray(activePositions) ? activePositions : [activePositions];
  const seats = container.querySelectorAll('.mini-table__seat');

  seats.forEach(seat => {
    // Remove all active/position-color classes
    seat.classList.remove('mini-table__seat--active');
    SEAT_POSITIONS.forEach(p => seat.classList.remove(`mini-table__seat--${p.id.toLowerCase()}`));

    // Check if this seat should be active by matching the text content
    const seatId = seat.textContent.trim();
    if (active.includes(seatId)) {
      seat.classList.add('mini-table__seat--active', `mini-table__seat--${seatId.toLowerCase()}`);
    }
  });

  // Update aria-label
  const table = container.querySelector('.mini-table');
  if (table) {
    table.setAttribute('aria-label', `Poker table showing ${active.join(', ')} position`);
  }
}
