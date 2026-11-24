// Camera zoom is a view span: a smaller value means a closer camera.
export function clampZoom(value) {
  return Math.max(16, Math.min(36, value));
}

export function bindCameraGestures(
  canvas,
  { getZoom, setZoom, onTap, onPinch },
) {
  const pointers = new Map();
  let tap = null;
  let pinch = null;
  let multiTouch = false;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  function rebase() {
    pinch =
      pointers.size === 2 &&
      [...pointers.values()].every((point) => point.type === "touch")
        ? { distance: distance(), zoom: getZoom() }
        : null;
  }
  function down(event) {
    if (event.button !== 0) return;
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      type: event.pointerType,
    });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1 && !multiTouch) {
      tap = { id: event.pointerId, x: event.clientX, y: event.clientY };
    } else {
      tap = null;
      multiTouch = true;
      // Only fingers participate in a pinch, not a mouse held alongside a pen.
      if ([...pointers.values()].every((point) => point.type === "touch")) {
        event.preventDefault();
        onPinch();
        rebase();
      } else pinch = null;
    }
  }
  function move(event) {
    const point = pointers.get(event.pointerId);
    if (!point) return;
    point.x = event.clientX;
    point.y = event.clientY;
    if (tap && Math.hypot(point.x - tap.x, point.y - tap.y) >= 14) tap = null;
    if (pinch && pointers.size === 2) {
      event.preventDefault();
      const current = distance();
      if (current > 0 && pinch.distance > 0)
        setZoom(clampZoom((pinch.zoom * pinch.distance) / current));
      else rebase();
    }
  }
  function finish(event) {
    if (!pointers.has(event.pointerId)) return;
    const shouldTap =
      event.type === "pointerup" &&
      !multiTouch &&
      tap?.id === event.pointerId &&
      Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 14;
    pointers.delete(event.pointerId);
    tap = null;
    rebase();
    if (pointers.size === 0) multiTouch = false;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    if (shouldTap) onTap(event.clientX, event.clientY);
  }
  const listeners = {
    pointerdown: down,
    pointermove: move,
    pointerup: finish,
    pointercancel: finish,
    lostpointercapture: finish,
  };
  for (const [type, listener] of Object.entries(listeners))
    canvas.addEventListener(type, listener);
  function cancel() {
    const ids = [...pointers.keys()];
    pointers.clear();
    tap = pinch = null;
    multiTouch = false;
    for (const id of ids)
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }
  return {
    cancel,
    dispose() {
      cancel();
      for (const [type, listener] of Object.entries(listeners))
        canvas.removeEventListener(type, listener);
    },
  };
}
