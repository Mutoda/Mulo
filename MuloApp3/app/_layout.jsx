import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'

SplashScreen.preventAutoHideAsync()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0A1628" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A1628' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  )
}
