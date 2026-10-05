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
import { CatalogProvider } from './src/context/CatalogContext';
import { CartProvider } from './src/context/CartContext';
import { TokenProvider } from './src/context/TokenContext';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <LanguageProvider>
        <AuthProvider>
          <EventProvider>
            <CatalogProvider>
              <CartProvider>
                <TokenProvider>
                  <RootNavigator />
                </TokenProvider>
              </CartProvider>
            </CatalogProvider>
          </EventProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

export default App;
