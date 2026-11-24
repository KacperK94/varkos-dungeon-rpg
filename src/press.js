// A captured pointer owns a press until release, cancellation, or a UI transition.
// Pointer-generated clicks must not trigger a second action after a long hold.
export function bindPress(element, { start, end, activate }) {
  let pointer = null;
  let beganAt = 0;
  function release(cancelled = true) {
    if (pointer === null) return;
    const id = pointer;
    pointer = null;
    element.classList.remove("pressed");
    end?.({ cancelled, duration: performance.now() - beganAt });
    if (element.hasPointerCapture?.(id)) element.releasePointerCapture(id);
  }
  element.addEventListener("pointerdown", (event) => {
    if (pointer !== null || event.button !== 0 || element.disabled) return;
    event.preventDefault();
    if (start?.() === false) return;
    pointer = event.pointerId;
    beganAt = performance.now();
    element.classList.add("pressed");
    element.setPointerCapture(pointer);
  });
  element.addEventListener("pointerup", (event) => {
    if (event.pointerId === pointer) release(false);
  });
  for (const type of ["pointercancel", "lostpointercapture"]) {
    element.addEventListener(type, (event) => {
      if (event.pointerId === pointer) release(true);
    });
  }
  element.addEventListener("click", (event) => {
    if (event.detail === 0 && !element.disabled) activate?.();
  });
  return release;
}
