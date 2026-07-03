import React, { useMemo } from 'react';
import Svg, { Circle, Path, G } from 'react-native-svg';

interface DecorativeElement {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

const generateElements = (): DecorativeElement[] => [
  { x: 8, y: 12, size: 6, opacity: 0.2 },
  { x: 28, y: 6, size: 10, opacity: 0.18 },
  { x: 62, y: 10, size: 7, opacity: 0.25 },
  { x: 82, y: 22, size: 5, opacity: 0.15 },
  { x: 48, y: 18, size: 6, opacity: 0.2 },
  { x: 18, y: 28, size: 4, opacity: 0.12 },
  { x: 88, y: 6, size: 3, opacity: 0.18 },
  { x: 42, y: 4, size: 5, opacity: 0.12 },
  { x: 72, y: 26, size: 4, opacity: 0.1 },
  { x: 35, y: 30, size: 8, opacity: 0.08 },
];

interface DecorativeBackgroundProps {
  accentColor?: string;
  style?: any;
}

/** 页面氛围背景装饰 — 漂浮的抽象圆点光晕 */
export function DecorativeBackground({
  accentColor = '#F36F3C',
  style,
}: DecorativeBackgroundProps) {
  const elements = useMemo(() => generateElements(), []);

  return (
    <Svg
      width="100%"
      height="100%"
      style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, style]}
      viewBox="0 0 100 40"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* 背景光晕层 */}
      <Circle cx="20" cy="10" r="28" fill={accentColor} opacity={0.05} />
      <Circle cx="75" cy="5" r="32" fill={accentColor} opacity={0.04} />
      <Circle cx="50" cy="22" r="22" fill={accentColor} opacity={0.03} />

      {/* 漂浮装饰圆点 */}
      {elements.map((el, i) => (
        <Circle
          key={i}
          cx={el.x}
          cy={el.y}
          r={el.size}
          fill={accentColor}
          opacity={el.opacity}
        />
      ))}
    </Svg>
  );
}
