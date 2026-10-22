import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderScreen from '../screens/OrderScreen';
import QuoteScreen from '../screens/QuoteScreen';
import CalendarScreen from '../screens/CalendarScreen';
import RegisterPhotoScreen from '../screens/RegisterPhotoScreen';
import ItemsScreen from '../screens/ItemsScreen';
import AddItemChoiceScreen from '../screens/AddItemChoiceScreen';
import ItemFormScreen from '../screens/ItemFormScreen';
import PackagesScreen from '../screens/PackagesScreen';
import PackageFormScreen from '../screens/PackageFormScreen';
import ShopScreen from '../screens/ShopScreen';
import HHomeScreen from '../screens/HHomeScreen';
import HTokensScreen from '../screens/HTokensScreen';
import HTokenScreen from '../screens/HTokenScreen';
import HallScreen from '../screens/HallScreen';
import HallsScreen from '../screens/HallsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import { TentTabBar, VenueTabBar, type TentTab, type VenueTab } from '../components/TabBar';
import { tokenUiStatus, type RemoteHallToken } from '../hooks/useHallTokens';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Maps every route in the stack to the footer tab it belongs under, so the persistent
// footer (rendered once at the root, below) can highlight the right tab no matter how deep
// in the stack the user is — e.g. ItemForm highlights "Items", Order highlights "Orders".
const TENT_ROUTE_TAB: Partial<Record<keyof RootStackParamList, TentTab>> = {
  Home: 'home',
  Orders: 'orders',
  Order: 'orders',
  Quote: 'orders',
  Items: 'items',
  AddItemChoice: 'items',
  ItemForm: 'items',
  Packages: 'items',
  PackageForm: 'items',
  Shop: 'shop',
};

const VENUE_ROUTE_TAB: Partial<Record<keyof RootStackParamList, VenueTab>> = {
  HHome: 'hhome',
  HTokens: 'htokens',
  HToken: 'htokens',
  Calendar: 'calendar',
  Halls: 'hall',
  Hall: 'hall',
  RegisterPhoto: 'hall',
};

export default function RootNavigator() {
  const { partner, loading, pendingAck } = useAuth();
  const [routeName, setRouteName] = useState<keyof RootStackParamList | undefined>();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [activeTokensCount, setActiveTokensCount] = useState(0);

  const stillOnPendingReview = !!partner?.registered && partner.verificationStatus === 'pending' && !pendingAck;
  const showHome = !!partner?.registered && !stillOnPendingReview;
  const isVenue = partner?.role === 'venue';

  // Feeds the footer's notification badges (new order requests / active hall tokens) — fetched
  // once here instead of per-screen, since the footer is now shared across every screen.
  useEffect(() => {
    if (!showHome) return;
    if (isVenue) {
      api.get<RemoteHallToken[]>('/api/halls/me/tokens')
        .then((tokens) => setActiveTokensCount(tokens.filter((t) => tokenUiStatus(t) === 'ACTIVE').length))
        .catch(() => {});
    } else {
      api.get<Array<{ status: string }>>('/api/vendors/me/orders')
        .then((orders) => setNewOrdersCount(orders.filter((o) => o.status === 'PENDING').length))
        .catch(() => {});
    }
  }, [showHome, isVenue]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  let authInitialRoute: 'Onboarding' | 'Register' | 'PendingReview' = 'Onboarding';
  if (partner && !partner.registered) authInitialRoute = 'Register';
  else if (stillOnPendingReview) authInitialRoute = 'PendingReview';

  const tentActive: TentTab = (routeName ? TENT_ROUTE_TAB[routeName] : 'home') ?? ('' as TentTab);
  const venueActive: VenueTab = (routeName ? VENUE_ROUTE_TAB[routeName] : 'hhome') ?? ('' as VenueTab);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setRouteName(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined)}
      onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined)}
    >
      {showHome ? (
        // The footer lives outside the Stack.Navigator so it stays on screen across every
        // route in the stack, instead of each screen having to render its own copy (which is
        // how screens pushed on top, like AddItemChoice or Calendar, used to lose it).
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Stack.Navigator initialRouteName={isVenue ? 'HHome' : 'Home'} screenOptions={{ headerShown: false }}>
              {isVenue ? (
                <>
                  <Stack.Screen name="HHome" component={HHomeScreen} />
                  <Stack.Screen name="HTokens" component={HTokensScreen} />
                  <Stack.Screen name="HToken" component={HTokenScreen} />
                  <Stack.Screen name="Halls" component={HallsScreen} />
                  <Stack.Screen name="Hall" component={HallScreen} />
                  <Stack.Screen name="Calendar" component={CalendarScreen} />
                  <Stack.Screen name="RegisterPhoto" component={RegisterPhotoScreen} />
                  <Stack.Screen name="Earnings" component={EarningsScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                  <Stack.Screen name="Conversations" component={ConversationsScreen} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="Orders" component={OrdersScreen} />
                  <Stack.Screen name="Order" component={OrderScreen} />
                  <Stack.Screen name="Quote" component={QuoteScreen} />
                  <Stack.Screen name="Calendar" component={CalendarScreen} />
                  <Stack.Screen name="Items" component={ItemsScreen} />
                  <Stack.Screen name="AddItemChoice" component={AddItemChoiceScreen} />
                  <Stack.Screen name="ItemForm" component={ItemFormScreen} />
                  <Stack.Screen name="Packages" component={PackagesScreen} />
                  <Stack.Screen name="PackageForm" component={PackageFormScreen} />
                  <Stack.Screen name="Shop" component={ShopScreen} />
                  <Stack.Screen name="Earnings" component={EarningsScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                  <Stack.Screen name="Conversations" component={ConversationsScreen} />
                </>
              )}
            </Stack.Navigator>
          </View>
          <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surface }}>
            {isVenue ? (
              <VenueTabBar active={venueActive} navigation={navigationRef} badge={{ htokens: activeTokensCount || undefined }} />
            ) : (
              <TentTabBar active={tentActive} navigation={navigationRef} badge={{ orders: newOrdersCount || undefined }} />
            )}
          </SafeAreaView>
        </View>
      ) : (
        <AuthNavigator key={authInitialRoute} initialRouteName={authInitialRoute} />
      )}
    </NavigationContainer>
  );
}
