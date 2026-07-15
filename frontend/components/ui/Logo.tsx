import React, { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export interface LogoProps {
  size?: number;
}

// LifeTracker 应用 Logo
// 渐变圆角方形（橙→紫）+ 白色勾选圆环，寓意"追踪与完成"
export function Logo({ size = 64 }: LogoProps) {
  const gradId = `lt-logo-grad-${useId()}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF6B35" />
          <Stop offset="1" stopColor="#7C5CFC" />
        </LinearGradient>
      </Defs>
      <Rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
      <Circle cx="32" cy="32" r="14" fill="none" stroke="#FFFFFF" strokeWidth="3" />
      <Path
        d="M25 32 L30 37 L40 26"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
