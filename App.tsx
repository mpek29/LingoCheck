import 'react-native-gesture-handler';
import React from 'react';
import { Platform, StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { SwipeScreen } from './src/screens/SwipeScreen';
import { CorrectorScreen } from './src/screens/CorrectorScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { COLORS } from './src/config';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {Platform.OS !== 'windows' && (
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        )}
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.surface },
              headerTintColor: COLORS.text,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: COLORS.background },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'LingoCheck', headerShown: false }}
            />
            <Stack.Screen
              name="Swipe"
              component={SwipeScreen}
              options={{ title: 'Inspector' }}
            />
            <Stack.Screen
              name="Corrector"
              component={CorrectorScreen}
              options={{ title: 'Corrections' }}
            />
            <Stack.Screen
              name="Editor"
              component={EditorScreen}
              options={{ title: 'Edit Entry' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
