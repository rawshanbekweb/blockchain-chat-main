import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Brand from "@/components/Brand";
import { useWallet } from "@/context/WalletContext";
import { BRAND } from "@/constants/brand";
export default function OnboardingScreen() {
  const { completeOnboarding } = useWallet();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 900;
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const start = async () => {
    if (busy) return;
    if (!name.trim()) { setError("Davom etish uchun ismingizni kiriting."); return; }
    setBusy(true); setError("");
    try { await completeOnboarding(name.trim()); router.replace("/(tabs)"); }
    catch { setError("Profil saqlanmadi. Qayta urinib ko‘ring."); }
    finally { setBusy(false); }
  };
  return <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[s.page, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
      <View style={s.top}><Brand /><Text style={s.eyebrow}>YANGI BOSHLANISH</Text></View>
      <View style={[s.body, { flexDirection: wide ? "row" : "column", gap: wide ? 88 : 36 }]}>
        <View style={{ flex: 1, gap: 24 }}>
          <View style={s.pill}><View style={s.dot} /><Text style={s.pillText}>Fikrlar birlashadigan makon</Text></View>
          <Text accessibilityRole="header" style={[s.title, { fontSize: wide ? 66 : 43 }]}>Yaxshi suhbat.{"\n"}<Text style={{ color: "#bce9a5" }}>Yangi imkoniyat.</Text></Text>
          <Text style={s.description}>{BRAND.description} Kerakli insonlar bilan bog‘laning, muhim fikrlarni saqlang va hujjat nusxalarini tekshiring.</Text>
          <View style={s.preview}>
            <View style={s.previewTop}><Feather name="message-square" size={18} color="#bce9a5" /><Text style={s.previewTitle}>Hammasi suhbatdan boshlanadi</Text></View>
            <View style={s.sample}><Text style={s.sampleText}>G‘oyangiz bor. Uni birga rivojlantiramiz.</Text><Feather name="arrow-up-right" size={23} color="#244c3e" /></View>
            <View style={s.featureRow}>{["Suhbatlar", "Hujjatlar", "Tekshirish"].map((t, i) => <View key={t} style={s.feature}><Text style={s.featureNumber}>0{i + 1}</Text><Text style={s.featureText}>{t}</Text></View>)}</View>
          </View>
        </View>
        <View style={[s.form, wide && { width: 390, alignSelf: "center" }]}>
          <View style={s.formIcon}><Feather name="arrow-up-right" size={28} color="#244c3e" /></View>
          <Text style={s.formTitle}>Xush kelibsiz.</Text><Text style={s.formDesc}>O‘z ish maydoningizni oching.</Text>
          <Text style={s.label}>SIZNI QANDAY CHAQIRAYLIK?</Text>
          <TextInput accessibilityLabel="Ismingiz" style={s.input} placeholder="Ismingizni kiriting" placeholderTextColor="#7b877e" value={name} maxLength={60} onChangeText={setName} onSubmitEditing={start} returnKeyType="go" autoComplete="name" />
          {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
          <Pressable accessibilityRole="button" onPress={start} disabled={busy} style={({ pressed }) => [s.button, { opacity: busy || pressed ? 0.7 : 1 }]}>{busy ? <ActivityIndicator color="#fff" /> : <><Text style={s.buttonText}>Boshlash</Text><Feather name="arrow-right" size={20} color="#fff" /></>}</Pressable>
          <View style={s.note}><Feather name="hard-drive" size={17} color="#657468" /><Text style={s.noteText}>Profil shu qurilmada saqlanadi. Onlayn suhbat uchun Profil bo‘limida serverni ulang.</Text></View>
        </View>
      </View>
      <View style={s.footer}><Text style={s.footerText}>Ravoq — {BRAND.tagline}</Text><Text style={s.footerText}>Sodda. Tartibli. Birgalikda.</Text></View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#101d18" }, page: { flexGrow: 1, paddingHorizontal: 28, width: "100%", maxWidth: 1320, alignSelf: "center" }, top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 15 }, eyebrow: { fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 2, color: "#91a699" }, body: { flex: 1, justifyContent: "center", paddingVertical: 60 }, pill: { flexDirection: "row", gap: 9, alignItems: "center" }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#bce9a5" }, pillText: { color: "#c5d6ca", fontFamily: "Inter_500Medium", fontSize: 12 }, title: { color: "#f4f4e9", fontFamily: "Inter_700Bold", letterSpacing: -2.7 }, description: { color: "#a5b6a9", fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 27, maxWidth: 520 }, preview: { marginTop: 14, padding: 22, borderWidth: 1, borderColor: "#304637", borderRadius: 20, backgroundColor: "#192b21", gap: 20 }, previewTop: { flexDirection: "row", alignItems: "center", gap: 10 }, previewTitle: { color: "#e8eee5", fontFamily: "Inter_500Medium", fontSize: 13, flex: 1 }, sample: { backgroundColor: "#cce8bd", borderRadius: 12, padding: 18, flexDirection: "row", gap: 12, alignItems: "center" }, sampleText: { color: "#244c3e", flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 23 }, featureRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, feature: { gap: 6 }, featureNumber: { color: "#7d9785", fontSize: 10, fontFamily: "Inter_500Medium" }, featureText: { color: "#d0dfd3", fontSize: 12, fontFamily: "Inter_500Medium" }, form: { backgroundColor: "#f3f4ec", borderRadius: 24, padding: 28, gap: 14 }, formIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#e0e8d7", justifyContent: "center", alignItems: "center", marginBottom: 12 }, formTitle: { fontFamily: "Inter_700Bold", fontSize: 31, letterSpacing: -1, color: "#183a2e" }, formDesc: { fontFamily: "Inter_400Regular", color: "#657468", fontSize: 14 }, label: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.2, color: "#526451", marginTop: 24 }, input: { borderWidth: 1, borderColor: "#cdd6c8", borderRadius: 12, padding: 16, fontSize: 15, fontFamily: "Inter_400Regular", color: "#183a2e", backgroundColor: "#fff" }, button: { backgroundColor: "#244c3e", padding: 17, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }, buttonText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" }, note: { flexDirection: "row", gap: 10, marginTop: 12 }, noteText: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 18, color: "#657468" }, error: { color: "#b33b32", fontSize: 12 }, footer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 }, footerText: { color: "#91a699", fontFamily: "Inter_400Regular", fontSize: 11 },
});
