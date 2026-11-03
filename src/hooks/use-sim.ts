import { useEffect, useRef, useState } from "react";

/** Runs a callback every animation frame with delta seconds. */
export function useFrame(cb: (dt: number, t: number) => void, active = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last = performance.now();
    const start = last;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ref.current(dt, (now - start) / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

/** Smoothly eases a displayed value towards a target (critically-damped feel). */
export function useSmoothed(target: number, speed = 8) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useFrame((dt) => {
    const d = target - cur.current;
    if (Math.abs(d) < 1e-4) return;
    cur.current += d * (1 - Math.exp(-speed * dt));
    setV(cur.current);
  });
  return v;
}
