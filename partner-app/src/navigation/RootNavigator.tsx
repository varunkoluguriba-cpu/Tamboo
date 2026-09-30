import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import AuthNavigator from './AuthNavigator';
import HomeScreen from '../screens/HomeScreen';
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

  let authInitialRoute: 'Onboarding' | 'Register' | 'PendingReview' = 'Onboarding';
  if (partner && !partner.registered) authInitialRoute = 'Register';
  else if (stillOnPendingReview) authInitialRoute = 'PendingReview';

  return (
    <NavigationContainer>
      {showHome ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
      ) : (
        <AuthNavigator initialRouteName={authInitialRoute} />
      )}
    </NavigationContainer>
  );
}
