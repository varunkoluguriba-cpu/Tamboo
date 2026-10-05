import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user && user.registered ? (
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
      ) : (
        <AuthNavigator initialRouteName={user && !user.registered ? 'Register' : 'Onboarding'} />
      )}
    </NavigationContainer>
  );
}
