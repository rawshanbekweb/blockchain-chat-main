import { Alert, Platform } from "react-native";
export function notice(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}
export function confirmAction(title: string, message: string, onConfirm: () => Promise<void>) {
  const run = () => { void onConfirm().catch(e => notice("Xato", e instanceof Error ? e.message : "Amal bajarilmadi.")); };
  if (Platform.OS === "web") { if (window.confirm(`${title}\n\n${message}`)) run(); }
  else Alert.alert(title, message, [{ text: "Bekor", style: "cancel" }, { text: "Davom etish", onPress: run }]);
}
