import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, spacing, typography } from './src/theme';

import DashboardScreen from './src/screens/DashboardScreen';
import GymDetailsScreen from './src/screens/GymDetailsScreen';
import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import PendingVerificationScreen from './src/screens/PendingVerificationScreen';
import SignupScreen from './src/screens/SignupScreen';
import MemberListScreen from './src/screens/MemberListScreen';
import AddMemberScreen from './src/screens/AddMemberScreen';
import MemberDetailScreen from './src/screens/MemberDetailScreen';
import RecordPaymentScreen from './src/screens/RecordPaymentScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import Toast from './src/components/Toast';


import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { supabase } from './src/services/supabase';
import { useAuthStore } from './src/store/authStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Login');
  const [loading, setLoading] = useState(true);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        // Check if owner profile exists and status
        const { data: owner } = await supabase
          .from('gym_owners')
          .select('status')
          .eq('id', session.user.id)
          .single();

        if (owner) {
          if (owner.status === 'approved') {
            setInitialRoute('Dashboard');
          } else if (owner.status === 'pending_verification') {
            setInitialRoute('PendingVerification');
          } else {
            setInitialRoute('GymDetails'); // Fallback or specific status
          }
        } else {
          setInitialRoute('GymDetails');
        }
      }
    } catch (error) {
      console.log('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="GymDetails" component={GymDetailsScreen} />
          <Stack.Screen name="PendingVerification" component={PendingVerificationScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="MemberList" component={MemberListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddMember" component={AddMemberScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MemberDetail" component={MemberDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
