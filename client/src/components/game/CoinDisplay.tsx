import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CoinDisplayProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({ count, size = 'md' }) => {
  const [displayCount, setDisplayCount] = useState(count);
  const [animating, setAnimating] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count !== prevCount.current) {
      setAnimating(true);
      // Animate count
      const diff = count - prevCount.current;
      const steps = Math.min(Math.abs(diff), 10);
      const stepDuration = 300 / steps;
      let current = prevCount.current;
      const step = diff > 0 ? 1 : -1;

      const interval = setInterval(() => {
        current += step;
        setDisplayCount(current);
        if (current === count) {
          clearInterval(interval);
          setTimeout(() => setAnimating(false), 200);
        }
      }, stepDuration);

      prevCount.current = count;
      return () => clearInterval(interval);
    }
  }, [count]);

  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-lg gap-1.5',
    lg: 'text-2xl gap-2',
  };

  const coinSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <motion.div
      className={`inline-flex items-center ${sizeClasses[size]} font-bold`}
      animate={animating ? { scale: [1, 1.2, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`${coinSize[size]} rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border border-yellow-700
                     shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)]
                     flex items-center justify-center`}
      >
        <span className="text-[0.5em] text-yellow-900 font-black">$</span>
      </div>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={displayCount}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`text-yellow-300 tabular-nums ${
            animating ? 'glow-text-gold' : ''
          }`}
        >
          {displayCount}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
};
