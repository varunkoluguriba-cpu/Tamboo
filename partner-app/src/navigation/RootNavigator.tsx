import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderScreen from '../screens/OrderScreen';
import QuoteScreen from '../screens/QuoteScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ItemsScreen from '../screens/ItemsScreen';
import ItemFormScreen from '../screens/ItemFormScreen';
import ShopScreen from '../screens/ShopScreen';
import HHomeScreen from '../screens/HHomeScreen';
import HTokensScreen from '../screens/HTokensScreen';
import HTokenScreen from '../screens/HTokenScreen';
import HallScreen from '../screens/HallScreen';
import HallsScreen from '../screens/HallsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ChatScreen from '../screens/ChatScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { partner, loading, pendingAck } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  // A freshly registered partner sees "Application submitted" once; after they tap through it
  // (or once verification resolves), Home unlocks even while still pending review.
  const stillOnPendingReview = !!partner?.registered && partner.verificationStatus === 'pending' && !pendingAck;
  const showHome = !!partner?.registered && !stillOnPendingReview;
  const isVenue = partner?.role === 'venue';

  let authInitialRoute: 'Onboarding' | 'Register' | 'PendingReview' = 'Onboarding';
  if (partner && !partner.registered) authInitialRoute = 'Register';
  else if (stillOnPendingReview) authInitialRoute = 'PendingReview';

  return (
    <NavigationContainer>
      {showHome ? (
        <Stack.Navigator initialRouteName={isVenue ? 'HHome' : 'Home'} screenOptions={{ headerShown: false }}>
          {isVenue ? (
            <>
              <Stack.Screen name="HHome" component={HHomeScreen} />
              <Stack.Screen name="HTokens" component={HTokensScreen} />
              <Stack.Screen name="HToken" component={HTokenScreen} />
              <Stack.Screen name="Halls" component={HallsScreen} />
              <Stack.Screen name="Hall" component={HallScreen} />
              <Stack.Screen name="Calendar" component={CalendarScreen} />
              <Stack.Screen name="Earnings" component={EarningsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Orders" component={OrdersScreen} />
              <Stack.Screen name="Order" component={OrderScreen} />
              <Stack.Screen name="Quote" component={QuoteScreen} />
              <Stack.Screen name="Calendar" component={CalendarScreen} />
              <Stack.Screen name="Items" component={ItemsScreen} />
              <Stack.Screen name="ItemForm" component={ItemFormScreen} />
              <Stack.Screen name="Shop" component={ShopScreen} />
              <Stack.Screen name="Earnings" component={EarningsScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          )}
        </Stack.Navigator>
      ) : (
        <AuthNavigator initialRouteName={authInitialRoute} />
      )}
    </NavigationContainer>
  );
}
