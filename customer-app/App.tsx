/**
 * Tamboo — Customer app
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { EventProvider } from './src/context/EventContext';
import { CartProvider } from './src/context/CartContext';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <LanguageProvider>
        <AuthProvider>
          <EventProvider>
            <CartProvider>
              <RootNavigator />
            </CartProvider>
          </EventProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
