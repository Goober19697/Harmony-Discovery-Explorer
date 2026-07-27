import React from "react";

export default function PlaybackControl({
  children,
  className = "vl-play-btn",
  onClick,
  ariaLabel,
  title,
  disabled = false,
}) {
  return (
    <div className="vl-play-group">
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-label={ariaLabel}
        title={title}
        disabled={disabled}
      >
        {children}
      </button>
      <span className="vl-play-label" aria-hidden="true">Tap</span>
    </div>
  );
}
