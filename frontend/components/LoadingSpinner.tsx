import { SpinnerDiamond } from 'spinners-react';

interface LoadingSpinnerProps {
  size?: number;
  thickness?: number;
  speed?: number;
  color?: string;
  secondaryColor?: string;
  className?: string;
}

export default function LoadingSpinner({
  size = 100,
  thickness = 200,
  speed = 75,
  color = '#f97316',
  secondaryColor = 'rgba(249, 115, 22, 0.3)',
  className
}: LoadingSpinnerProps) {
  return (
    <SpinnerDiamond
      size={size}
      thickness={thickness}
      speed={speed}
      color={color}
      secondaryColor={secondaryColor}
      className={className}
    />
  );
}