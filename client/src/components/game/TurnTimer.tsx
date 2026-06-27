import React, { useEffect, useState, useRef } from 'react';

interface TurnTimerProps {
  endTime: number | null;
  size?: number;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({ endTime, size = 48 }) => {
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!endTime) {
      setRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const rem = Math.max(0, Math.ceil((endTime - now) / 1000));
      setRemaining(rem);
    };

    // Estimate total from initial remaining
    const initialRemaining = Math.ceil((endTime - Date.now()) / 1000);
    setTotal(Math.max(initialRemaining, 1));
    updateTimer();

    intervalRef.current = setInterval(updateTimer, 100);
    return () => clearInterval(intervalRef.current);
  }, [endTime]);

  if (!endTime) return null;

  const progress = total > 0 ? remaining / total : 0;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const color =
    remaining > 20 ? '#22c55e' : remaining > 10 ? '#eab308' : '#ef4444';
  const pulse = remaining <= 5 && remaining > 0;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className={`-rotate-90 ${pulse ? 'animate-pulse' : ''}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease',
            filter: pulse
              ? `drop-shadow(0 0 4px ${color})`
              : 'none',
          }}
        />
      </svg>
      <span
        className="absolute text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {remaining}
      </span>
    </div>
  );
};
