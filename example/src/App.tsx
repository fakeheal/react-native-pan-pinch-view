import * as React from 'react';

import { Image, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import PanPinchView from 'react-native-pan-pinch-view';

const CONTENT = {
  width: 150,
  height: 100,
};

const CONTAINER = {
  width: 300,
  height: 300,
};

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar />
      <View style={styles.container}>
        <PanPinchView
          shouldAdjustFocal={true}
          minScale={1}
          initialScale={1}
          containerDimensions={{
            width: CONTAINER.width,
            height: CONTAINER.height,
          }}
          contentDimensions={{ width: CONTENT.width, height: CONTENT.height }}
        >
          <Image
            style={[styles.image]}
            source={require('./assets/photo.jpg')}
          />
        </PanPinchView>
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
    marginVertical: 80,
  },
  image: {
    width: CONTENT.width,
    height: CONTENT.height,
  },
});
