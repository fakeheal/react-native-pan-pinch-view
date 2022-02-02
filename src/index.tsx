import React, { forwardRef, useImperativeHandle } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureStateChangeEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { clamp, useVector } from 'react-native-redash';
import type { PanPinchViewProps, PanPinchViewRef } from './types';

export default forwardRef(function PanPinchView(
  {
    containerDimensions = { width: 0, height: 0 },
    contentDimensions = { width: 0, height: 0 },
    minScale = 0.5,
    maxScale = 4,
    initialScale = 1,
    children,
  }: PanPinchViewProps,
  ref: React.Ref<PanPinchViewRef>
) {
  const currentMinScale = useSharedValue(minScale);
  const currentMaxScale = useSharedValue(maxScale);

  const scale = useSharedValue(initialScale);
  const lastScale = useSharedValue(initialScale);

  const translation = useVector(0, 0);
  const adjustedFocal = useVector(0, 0);
  const offset = useVector(0, 0);
  const origin = useVector(0, 0);

  const isPinching = useSharedValue(false);
  const isResetting = useSharedValue(false);

  const isAndroidPinchActivated = useSharedValue(false);

  const contentSize = useVector(
    contentDimensions.width,
    contentDimensions.height
  );

  const setContentSize = ({
    width,
    height,
  }: {
    width: number;
    height: number;
  }) => {
    contentSize.x.value = width;
    contentSize.y.value = height;
  };

  const scaleTo = (value: number, animated: boolean) => {
    scale.value = animated ? withTiming(value) : value;
    lastScale.value = value;
  };

  const translateTo = (x: number, y: number, animated: boolean) => {
    translation.x.value = 0;
    translation.y.value = 0;
    offset.x.value = animated ? withTiming(x) : x;
    offset.y.value = animated ? withTiming(y) : y;
  };

  const setMinScale = (value: number) => {
    currentMinScale.value = value;
  };

  const setMaxScale = (value: number) => {
    currentMaxScale.value = value;
  };

  const getScale = (): number => {
    return scale.value;
  };

  useImperativeHandle(ref, () => ({
    scaleTo,
    setContentSize,
    translateTo,
    setMinScale,
    setMaxScale,
    getScale,
  }));

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = offset.x.value + translation.x.value;
    const translateY = offset.y.value + translation.y.value;
    return {
      transform: [{ translateX }, { translateY }, { scale: scale.value }],
    };
  });

  const setAdjustedFocal = ({
    focalX,
    focalY,
  }: {
    focalX: number;
    focalY: number;
  }) => {
    'worklet';

    adjustedFocal.x.value = focalX - (contentSize.x.value / 2 + offset.x.value);
    adjustedFocal.y.value = focalY - (contentSize.y.value / 2 + offset.y.value);
  };

  const getEdges = () => {
    'worklet';
    const newWidth = contentSize.x.value * scale.value;
    const newHeight = contentSize.y.value * scale.value;

    let scaleOffsetX = (newWidth - contentSize.x.value) / 2;
    let scaleOffsetY = (newHeight - contentSize.y.value) / 2;

    const edges = {
      x: { min: scaleOffsetX, max: scaleOffsetX },
      y: { min: scaleOffsetY, max: scaleOffsetY },
    };

    if (newWidth > containerDimensions.width) {
      edges.x.min = Math.round(
        (newWidth - containerDimensions.width) * -1 + scaleOffsetX
      );
      edges.x.max = scaleOffsetX;
    }

    if (newHeight > containerDimensions.height) {
      edges.y.min = Math.round(
        (newHeight - containerDimensions.height) * -1 + scaleOffsetY
      );
      edges.y.max = scaleOffsetY;
    }
    return edges;
  };

  const onGestureStart = () => {
    'worklet';
    offset.x.value = offset.x.value + translation.x.value;
    offset.y.value = offset.y.value + translation.y.value;

    translation.x.value = 0;
    translation.y.value = 0;
  };

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onBegin(() => {
      'worklet';
      onGestureStart();
    })
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      'worklet';
      if (event.numberOfPointers === 1 && !isPinching.value) {
        const edges = getEdges();

        let boundedX = clamp(
          event.translationX,
          edges.x.min - offset.x.value,
          edges.x.max - offset.x.value
        );
        let boundedY = clamp(
          event.translationY,
          edges.y.min - offset.y.value,
          edges.y.max - offset.y.value
        );

        translation.x.value = boundedX;
        translation.y.value = boundedY;
      }
    });

  const pinchGesture = Gesture.Pinch()
    .onBegin(
      (event: GestureStateChangeEvent<PinchGestureHandlerEventPayload>) => {
        'worklet';

        onGestureStart();

        if (Platform.OS === 'android') {
          isAndroidPinchActivated.value = false;
        }

        setAdjustedFocal({ focalX: event.focalX, focalY: event.focalY });
        origin.x.value = adjustedFocal.x.value;
        origin.y.value = adjustedFocal.y.value;

        lastScale.value = scale.value;
      }
    )
    .onChange((event) => {
      'worklet';

      if (event.numberOfPointers !== 2) {
        return;
      }

      if (!isAndroidPinchActivated.value && Platform.OS === 'android') {
        setAdjustedFocal({ focalX: event.focalX, focalY: event.focalY });

        origin.x.value = adjustedFocal.x.value;
        origin.y.value = adjustedFocal.y.value;

        isAndroidPinchActivated.value = true;
      }

      isPinching.value = true;
      scale.value = Math.max(
        scale.value * event.scaleChange,
        currentMinScale.value
      );

      setAdjustedFocal({ focalX: event.focalX, focalY: event.focalY });

      const edges = getEdges();

      let boundedX = clamp(
        adjustedFocal.x.value +
          ((-1 * scale.value) / lastScale.value) * origin.x.value,
        edges.x.min - offset.x.value,
        edges.x.max - offset.x.value
      );
      let boundedY = clamp(
        adjustedFocal.y.value +
          ((-1 * scale.value) / lastScale.value) * origin.y.value,
        edges.y.min - offset.y.value,
        edges.y.max - offset.y.value
      );

      translation.x.value = boundedX;
      translation.y.value = boundedY;
    })
    .onFinalize(() => {
      'worklet';
      if (isPinching.value) {
        isPinching.value = false;

        lastScale.value = scale.value;

        if (
          lastScale.value > currentMaxScale.value ||
          lastScale.value < currentMinScale.value
        ) {
          scale.value = withTiming(
            clamp(scale.value, currentMinScale.value, currentMaxScale.value)
          );
        }
      }
    });

  useAnimatedReaction(
    () => {
      return {
        translationX: translation.x.value,
        translationY: translation.y.value,
        isResetting: isResetting.value,
        scale: scale.value,
        isPinching: isPinching.value,
        offsetX: offset.x.value,
        offsetY: offset.y.value,
      };
    },
    (newTransform, previousTransform) => {
      if (previousTransform !== null) {
        if (isPinching.value) {
          return;
        }
        if (isResetting.value) {
          isResetting.value = false;
          return;
        }
        const edges = getEdges();

        let boundedX = clamp(
          newTransform.translationX,
          edges.x.min - offset.x.value,
          edges.x.max - offset.x.value
        );
        let boundedY = clamp(
          newTransform.translationY,
          edges.y.min - offset.y.value,
          edges.y.max - offset.y.value
        );

        translation.x.value = boundedX;
        translation.y.value = boundedY;
      }
    }
  );

  const gestures = Gesture.Simultaneous(panGesture, pinchGesture);

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={gestures}>
        <View
          style={[
            styles.container,
            {
              width: containerDimensions.width,
              height: containerDimensions.height,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.content,
              {
                width: contentSize.x.value,
                height: contentSize.y.value,
              },
              animatedStyle,
            ]}
          >
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    alignSelf: 'flex-start',
  },
});
