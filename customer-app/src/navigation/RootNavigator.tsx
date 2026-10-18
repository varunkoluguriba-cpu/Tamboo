import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/HomeScreen';
import EventScreen from '../screens/EventScreen';
import BrowseScreen from '../screens/BrowseScreen';
import VendorScreen from '../screens/VendorScreen';
import ProductScreen from '../screens/ProductScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import PayScreen from '../screens/PayScreen';
import ConfirmScreen from '../screens/ConfirmScreen';
import BookingsScreen from '../screens/BookingsScreen';
import VenuesScreen from '../screens/VenuesScreen';
import VenueScreen from '../screens/VenueScreen';
import TokenPayScreen from '../screens/TokenPayScreen';
import TokenDoneScreen from '../screens/TokenDoneScreen';
import AdvancePayScreen from '../screens/AdvancePayScreen';
import BookingDetailScreen from '../screens/BookingDetailScreen';
import TokenScreen from '../screens/TokenScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TabBar, { type TabKey } from '../components/TabBar';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Maps every route in the stack to the footer tab it belongs under, so the persistent
// footer (rendered once at the root, below) stays visible and highlights the right tab no
// matter how deep in the stack the user is — e.g. Product/Vendor highlight "search".
const ROUTE_TAB: Partial<Record<keyof RootStackParamList, TabKey>> = {
  Home: 'home',
  Browse: 'search',
  Vendor: 'search',
  Product: 'search',
  Venues: 'search',
  Venue: 'search',
  Cart: 'cart',
  Checkout: 'cart',
  Pay: 'cart',
  Confirm: 'cart',
  Bookings: 'bookings',
  BookingDetail: 'bookings',
  TokenPay: 'bookings',
  TokenDone: 'bookings',
  Token: 'bookings',
  AdvancePay: 'bookings',
  Profile: 'profile',
};

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [routeName, setRouteName] = useState<keyof RootStackParamList | undefined>();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  const active: TabKey = (routeName ? ROUTE_TAB[routeName] : 'home') ?? ('' as TabKey);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setRouteName(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined)}
      onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined)}
    >
      {user && user.registered ? (
        // The footer lives outside the Stack.Navigator so it stays on screen across every
        // route in the stack, instead of each screen having to render its own copy (which is
        // how screens pushed on top, like Product or Checkout, used to lose it).
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Event" component={EventScreen} />
              <Stack.Screen name="Browse" component={BrowseScreen} />
              <Stack.Screen name="Vendor" component={VendorScreen} />
              <Stack.Screen name="Product" component={ProductScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="Pay" component={PayScreen} />
              <Stack.Screen name="Confirm" component={ConfirmScreen} />
              <Stack.Screen name="Bookings" component={BookingsScreen} />
              <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
              <Stack.Screen name="Venues" component={VenuesScreen} />
              <Stack.Screen name="Venue" component={VenueScreen} />
              <Stack.Screen name="TokenPay" component={TokenPayScreen} />
              <Stack.Screen name="TokenDone" component={TokenDoneScreen} />
              <Stack.Screen name="Token" component={TokenScreen} />
              <Stack.Screen name="AdvancePay" component={AdvancePayScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </Stack.Navigator>
          </View>
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surface }}>
            <TabBar active={active} navigation={navigationRef} />
          </SafeAreaView>
        </View>
      ) : (
        <AuthNavigator initialRouteName={user && !user.registered ? 'Register' : 'Onboarding'} />
      )}
    </NavigationContainer>
  );
}
