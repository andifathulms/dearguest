// Wraps every rendered asset slot. Pass-through for now; the ?slots=1 debug
// overlay hooks in here.
export function SlotFrame({ filled, children }) {
  return filled ? children : null
}
