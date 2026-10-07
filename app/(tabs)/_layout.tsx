import { Tabs, router, usePathname } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import Brand from "@/components/Brand";
import { useWallet } from "@/context/WalletContext";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";
const items = [
  { path: "/", label: "Suhbatlar", icon: "message-square" },
  { path: "/verify", label: "Hujjatlar", icon: "file-text" },
  { path: "/wallet", label: "Profil va sozlamalar", icon: "sliders" },
] as const;
export default function TabLayout() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 1000;
  const path = usePathname();
  const { walletName, isLoading, isOnboarded } = useWallet();
  const { isOnline } = useChat();
  useEffect(() => { if (!isLoading && !isOnboarded) router.replace("/onboarding"); }, [isLoading, isOnboarded]);
  if (isLoading || !isOnboarded) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}><ActivityIndicator color={colors.primary} /></View>;
  return <View style={{ flex: 1, flexDirection: "row", backgroundColor: colors.background }}>
    {wide && <View style={{ width: 250, padding: 25, paddingTop: 34, borderRightWidth: 1, borderColor: colors.border, backgroundColor: "#101d18" }}>
      <Brand />
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 2, marginTop: 52, marginBottom: 18 }}>ISH MAYDONI</Text>
      {items.map(item => { const active = path === item.path; return <Pressable key={item.path} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => router.navigate(item.path)} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, marginBottom: 7, backgroundColor: active ? "#243b2e" : "transparent" }}><Feather name={item.icon} size={18} color={active ? "#bce9a5" : colors.textSecondary} /><Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: active ? "#d8edce" : colors.textSecondary }}>{item.label}</Text></Pressable>; })}
      <View style={{ flex: 1 }} />
      <View style={{ padding: 18, borderRadius: 16, backgroundColor: "#1d3025", gap: 12, marginBottom: 24 }}><Feather name="layers" color="#bce9a5" size={24} /><Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Bir makon. Ko‘p imkoniyat.</Text><Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 20 }}>Suhbatni boshlang, fikrlarni jamlang, hujjatlarni tekshiring.</Text></View>
      <Pressable accessibilityRole="button" onPress={() => router.navigate("/wallet")} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#d8dec2", alignItems: "center", justifyContent: "center" }}><Text style={{ fontFamily: "Inter_700Bold", color: "#244c3e" }}>{walletName.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1, gap: 4 }}><Text numberOfLines={1} style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>{walletName}</Text><Text style={{ color: colors.textSecondary, fontSize: 10 }}>{isOnline ? "Server ulangan" : "Mahalliy rejim"}</Text></View><Feather name="chevron-right" color={colors.textSecondary} size={16} /></Pressable>
    </View>}
    <View style={{ flex: 1, minWidth: 0 }}><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primaryLight, tabBarInactiveTintColor: colors.textSecondary, tabBarStyle: wide ? { display: "none" } : { backgroundColor: colors.card, borderTopColor: colors.border, height: 66 + insets.bottom, paddingTop: 8, paddingBottom: insets.bottom + 8 }, tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 10 } }}>
      <Tabs.Screen name="index" options={{ title: "Suhbatlar", tabBarIcon: ({ color }) => <Feather name="message-square" size={21} color={color} /> }} />
      <Tabs.Screen name="verify" options={{ title: "Hujjatlar", tabBarIcon: ({ color }) => <Feather name="file-text" size={21} color={color} /> }} />
      <Tabs.Screen name="wallet" options={{ title: "Profil", tabBarIcon: ({ color }) => <Feather name="user" size={21} color={color} /> }} />
    </Tabs></View>
  </View>;
}
