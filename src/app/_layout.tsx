import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export default function Layout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NativeTabs backgroundColor="#070D1A" indicatorColor="rgba(103,232,249,0.14)">
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>{"\u{1F3B7} Home"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="search">
          <NativeTabs.Trigger.Label>{"\u{1F507} Hospitals"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="contacts">
          <NativeTabs.Trigger.Label>{"\u{1F4CE} Contacts"}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
