import * as React from 'react';

import {
  Button,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import PanPinchView from 'react-native-pan-pinch-view';
import { useRef, useState } from 'react';
import type { PanPinchViewRef } from '../../src/types.js';

const CONTENT = {
  width: 100,
  height: 150,
};

const CONTAINER = {
  width: 300,
  height: 300,
};

export default function App() {
  const panPinchViewRef = useRef<PanPinchViewRef>(null);
  const [position, setPosition] = useState<string>('Start moving the image...');

  const scaleTo = (value: number) => {
    panPinchViewRef.current?.scaleTo(value);
  };

  const moveTo = (x: number, y: number) => {
    panPinchViewRef.current?.translateTo(x, y);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar />
      <View style={styles.container}>
        <PanPinchView
          ref={panPinchViewRef}
          minScale={1}
          initialScale={1}
          containerDimensions={{
            width: CONTAINER.width,
            height: CONTAINER.height,
          }}
          contentDimensions={{ width: CONTENT.width, height: CONTENT.height }}
          onTranslationFinished={(data: object) =>
            setPosition(JSON.stringify(data))
          }
        >
          <Image style={[styles.image]} source={require('./photo.jpg')} />
        </PanPinchView>
      </View>
      <View style={styles.controls}>
        <Button title="Scale to 0.5" onPress={() => scaleTo(0.5)} />
        <Button title="Scale to 1.5" onPress={() => scaleTo(1.5)} />
        <Button title="Scale to 2" onPress={() => scaleTo(2)} />
      </View>
      <View style={styles.controls}>
        <Button
          title="Center"
          onPress={() =>
            moveTo(
              CONTAINER.width / 2 - CONTENT.width / 2,
              CONTAINER.height / 2 - CONTENT.height / 2
            )
          }
        />
        <Button
          title="Bottom Right"
          onPress={() =>
            moveTo(
              CONTAINER.width - CONTENT.width,
              CONTAINER.height - CONTENT.height
            )
          }
        />
        <Button
          title="Bottom Center"
          onPress={() =>
            moveTo(
              CONTAINER.width / 2 - CONTENT.width / 2,
              CONTAINER.height - CONTENT.height
            )
          }
        />
      </View>
      <View style={styles.controls}>
        <Text>{position}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    marginVertical: 50,
  },
  image: {
    width: CONTENT.width,
    height: CONTENT.height,
  },
  controls: {
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 20,
  },
});
