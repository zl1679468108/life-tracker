import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export interface LogoProps {
  size?: number;
}

// LifeTracker 应用 Logo
// 基于 favicon.ico：浅蓝圆角方形 + 深蓝 V 形（顶点向左下、右下分叉），寓意"从一点出发，追踪多个方向"
export function Logo({ size = 64 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Rect width="48" height="48" rx={10} fill="#E6F4FE" />
      <Path
        d="M 12 37 L 24 10 L 36 37"
        stroke="#0072DE"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
