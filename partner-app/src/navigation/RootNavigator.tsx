import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Keyboard } from 'react-native';
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
import { FarmTabBar, ServiceTabBar, TentTabBar, VenueTabBar, type FarmTab, type ServiceTab, type TentTab, type VenueTab } from '../components/TabBar';
import FHomeScreen from '../screens/FHomeScreen';
import FBookingsScreen from '../screens/FBookingsScreen';
import FBookingScreen from '../screens/FBookingScreen';
import FCalendarScreen from '../screens/FCalendarScreen';
import FFarmsScreen from '../screens/FFarmsScreen';
import FFarmScreen from '../screens/FFarmScreen';
import type { OwnerFarmBooking } from '../utils/farm';
import SHomeScreen from '../screens/SHomeScreen';
import SPackagesScreen from '../screens/SPackagesScreen';
import SProfileScreen from '../screens/SProfileScreen';
import { tokenUiStatus, type RemoteHallToken } from '../hooks/useHallTokens';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { colors } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEEN_ONBOARDING_KEY } from '../constants';

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
  RegisterPhoto: 'calendar', // only reached from the Calendar screen
};

const SERVICE_ROUTE_TAB: Partial<Record<keyof RootStackParamList, ServiceTab>> = {
  SHome: 'srequests',
  SPackages: 'spackages',
  SProfile: 'sprofile',
};

const FARM_ROUTE_TAB: Partial<Record<keyof RootStackParamList, FarmTab>> = {
  FHome: 'fhome',
  FBookings: 'fbookings',
  FBooking: 'fbookings',
  FCalendar: 'fcalendar',
  FFarms: 'ffarms',
  FFarm: 'ffarms',
};

export default function RootNavigator() {
  const [keyboardUp, setKeyboardUp] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const { partner, loading, pendingAck } = useAuth();
  // Returning partners (e.g. after logout) skip the intro slides and go straight to Login.
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    if (partner) AsyncStorage.setItem(SEEN_ONBOARDING_KEY, '1').catch(() => {});
    AsyncStorage.getItem(SEEN_ONBOARDING_KEY).then((v) => setSeenOnboarding(v === '1')).catch(() => setSeenOnboarding(false));
  }, [partner]);
  const [routeName, setRouteName] = useState<keyof RootStackParamList | undefined>();
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [activeTokensCount, setActiveTokensCount] = useState(0);

  const stillOnPendingReview = !!partner?.registered && partner.verificationStatus === 'pending' && !pendingAck;
  const showHome = !!partner?.registered && !stillOnPendingReview;
  const isVenue = partner?.role === 'venue';
  const isService = partner?.role === 'service';
  const isFarm = partner?.role === 'farm';
  const [farmUpcoming, setFarmUpcoming] = useState(0);

  // Feeds the footer's notification badges (new order requests / active hall tokens) — fetched
  // once here instead of per-screen, since the footer is now shared across every screen.
  useEffect(() => {
    if (!showHome || isService) return;
    if (isFarm) {
      api.get<OwnerFarmBooking[]>('/api/farms/me/bookings')
        .then((list) => setFarmUpcoming(list.filter((b) => b.status === 'confirmed').length))
        .catch(() => {});
    } else if (isVenue) {
      api.get<RemoteHallToken[]>('/api/halls/me/tokens')
        .then((tokens) => setActiveTokensCount(tokens.filter((t) => tokenUiStatus(t) === 'ACTIVE').length))
        .catch(() => {});
    } else {
      api.get<Array<{ status: string }>>('/api/vendors/me/orders')
        .then((orders) => setNewOrdersCount(orders.filter((o) => o.status === 'PENDING').length))
        .catch(() => {});
    }
    // Re-counted on every screen change, so accepting an order or a pre-booking clears the badge.
  }, [showHome, isVenue, isFarm, routeName]);

  if (loading || seenOnboarding === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.pink} size="large" />
      </View>
    );
  }

  let authInitialRoute: 'Onboarding' | 'Login' | 'Register' | 'PendingReview' = seenOnboarding ? 'Login' : 'Onboarding';
  if (partner && !partner.registered) authInitialRoute = 'Register';
  else if (stillOnPendingReview) authInitialRoute = 'PendingReview';

  const tentActive: TentTab = (routeName ? TENT_ROUTE_TAB[routeName] : 'home') ?? ('' as TentTab);
  const venueActive: VenueTab = (routeName ? VENUE_ROUTE_TAB[routeName] : 'hhome') ?? ('' as VenueTab);
  const farmActive: FarmTab = (routeName ? FARM_ROUTE_TAB[routeName] : 'fhome') ?? ('' as FarmTab);
  const serviceActive: ServiceTab = (routeName ? SERVICE_ROUTE_TAB[routeName] : 'srequests') ?? ('' as ServiceTab);

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
            <Stack.Navigator initialRouteName={isFarm ? 'FHome' : isService ? 'SHome' : isVenue ? 'HHome' : 'Home'} screenOptions={{ headerShown: false }}>
              {isFarm ? (
                <>
                  <Stack.Screen name="FHome" component={FHomeScreen} />
                  <Stack.Screen name="FBookings" component={FBookingsScreen} />
                  <Stack.Screen name="FBooking" component={FBookingScreen} />
                  <Stack.Screen name="FCalendar" component={FCalendarScreen} />
                  <Stack.Screen name="FFarms" component={FFarmsScreen} />
                  <Stack.Screen name="FFarm" component={FFarmScreen} />
                  <Stack.Screen name="Earnings" component={EarningsScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                </>
              ) : isService ? (
                <>
                  <Stack.Screen name="SHome" component={SHomeScreen} />
                  <Stack.Screen name="SPackages" component={SPackagesScreen} />
                  <Stack.Screen name="SProfile" component={SProfileScreen} />
                  <Stack.Screen name="Chat" component={ChatScreen} />
                </>
              ) : isVenue ? (
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
          {/* Hidden while typing so the keyboard doesn't push the tab bar over the text field. */}
          {!keyboardUp && <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.surface }}>
            {isFarm ? (
              <FarmTabBar active={farmActive} navigation={navigationRef} badge={{ fbookings: farmUpcoming || undefined }} />
            ) : isService ? (
              <ServiceTabBar active={serviceActive} navigation={navigationRef} />
            ) : isVenue ? (
              <VenueTabBar active={venueActive} navigation={navigationRef} badge={{ htokens: activeTokensCount || undefined }} />
            ) : (
              <TentTabBar active={tentActive} navigation={navigationRef} badge={{ orders: newOrdersCount || undefined }} />
            )}
          </SafeAreaView>}
        </View>
      ) : (
        <AuthNavigator key={authInitialRoute} initialRouteName={authInitialRoute} />
      )}
    </NavigationContainer>
  );
}
