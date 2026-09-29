import React from 'react';
import Svg, { Circle, Polygon, Rect, Path } from 'react-native-svg';
import { ICONS, IconName } from './icons';

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export default function Icon({ name, size = 20, color = '#1e1b2e', strokeWidth = 2 }: Props) {
  const shapes = ICONS[name];
  if (!shapes) return null;
  const round = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      {shapes.map((shape, i) => {
        const [kind, rest] = [shape.slice(0, 2), shape.slice(2)];
        if (kind === 'p:') return <Path key={i} d={rest} {...round} />;
        if (kind === 'c:') {
          const [cx, cy, r] = rest.split(',').map(Number);
          return <Circle key={i} cx={cx} cy={cy} r={r} />;
        }
        if (kind === 'r:') {
          const [x, y, w, h, rx] = rest.split(',').map(Number);
          return <Rect key={i} x={x} y={y} width={w} height={h} rx={rx} />;
        }
        if (kind === 'g:') {
          return <Polygon key={i} points={rest} {...round} />;
        }
        return null;
      })}
    </Svg>
  );
}
