/** Total height of the sticky public navbar in px, including its 1px bottom border. */
export const NAVBAR_HEIGHT = 72;

/**
 * Nex, the corner guide: its size and its distance from the screen edges, in px. Every other
 * fixed element in the same corner stacks relative to these, so they can never overlap it.
 */
export const GUIDE_SIZE = 88;
export const GUIDE_OFFSET = 16;

/** Gap between stacked corner elements. */
const CORNER_GAP = 12;
/** Width of a small floating button (MUI Fab, size small). */
const SMALL_FAB = 40;

/** Where a small floating button (e.g. scroll to top) sits: just above Nex and centered over it. */
export const ABOVE_GUIDE = {
  bottom: GUIDE_OFFSET + GUIDE_SIZE + CORNER_GAP,
  right: GUIDE_OFFSET + GUIDE_SIZE / 2 - SMALL_FAB / 2,
} as const;

/** Bottom offset of a panel that opens from Nex (the chat), clear of the mascot. */
export const PANEL_ABOVE_GUIDE_BOTTOM = GUIDE_OFFSET + GUIDE_SIZE + CORNER_GAP / 2;
