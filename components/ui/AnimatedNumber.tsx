import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatter?: (value: number) => string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  formatter
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const startValue = useRef(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp;
      }

      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Easing function (ease-out-expo)
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      
      const currentValue = startValue.current + (value - startValue.current) * easeOutExpo;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  const formattedValue = formatter 
    ? formatter(displayValue)
    : displayValue.toFixed(decimals);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default AnimatedNumber;











