import { Text, View } from "react-native";
export default function Brand() {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ width: 38, height: 42, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: "#bce9a5", alignItems: "center", justifyContent: "flex-end", paddingBottom: 8 }}><View style={{ width: 14, height: 23, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderWidth: 3, borderBottomWidth: 0, borderColor: "#183a2e" }} /></View><Text style={{ color: "#f1f4ed", fontSize: 25, letterSpacing: -1, fontFamily: "Inter_700Bold" }}>Ravoq<Text style={{ color: "#bce9a5" }}>.</Text></Text></View>;
}
