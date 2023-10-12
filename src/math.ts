import Animated, { useSharedValue } from 'react-native-reanimated';

/**
 * Clamp value between lowerBound and upperBound.
 *
 * @param value
 * @param lowerBound
 * @param upperBound
 */
export const clamp = (
  value: number,
  lowerBound: number,
  upperBound: number
) => {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
};

export interface Vector<T = number> {
  x: T;
  y: T;
}

/**
 * Create a vector with shared values.
 *
 * @param x1
 * @param y1
 */
export const useVector = (
  x1 = 0,
  y1?: number
): Vector<Animated.SharedValue<number>> => {
  const x = useSharedValue(x1);
  const y = useSharedValue(y1 ?? x1);
  return { x, y };
};
