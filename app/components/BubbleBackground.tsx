"use client";

/**
 * BubbleBackground — translucent bubbles rising from bottom to top.
 * Pure CSS keyframe animation, zero JS overhead.
 * Renders behind all content (z-index: 0).
 */
export default function BubbleBackground() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bubble" />
      ))}
    </div>
  );
}
