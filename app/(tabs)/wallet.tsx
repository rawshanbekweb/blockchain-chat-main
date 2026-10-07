import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { impactLight, notifySuccess } from "@/utils/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "@/context/WalletContext";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";
import { formatFileSize } from "@/utils/blockchain";
import { confirmAction, notice } from "@/utils/dialogs";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { walletAddress, walletName, chain, setWalletName, regenerateWallet } = useWallet();
  const { isOnline, serverUrl, setAndSaveServerUrl } = useChat();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(walletName);
  const [showGuide, setShowGuide] = useState(false);
  const [editingServer, setEditingServer] = useState(false);
  const [serverInput, setServerInput] = useState(serverUrl);
  const isWeb = Platform.OS === "web";

  const myBlocks = chain.filter((b) => b.ownerAddress === walletAddress);

  const handleCopy = async () => {
    try {
    if (Platform.OS === "web") await navigator.clipboard.writeText(walletAddress);
    else await Share.share({ message: walletAddress });
    notice("Profil manzili", Platform.OS === "web" ? "Manzil nusxalandi." : "Manzil ulashildi.");
    } catch { notice("Manzil", walletAddress); }
    impactLight();
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try { await setWalletName(nameInput.trim()); }
    catch { notice("Xato", "Ism saqlanmadi."); return; }
    setEditingName(false);
    impactLight();
  };

  const handleRegenerate = () => {
    confirmAction(
      "Yangi Hamyon Yaratish",
      "Yangi manzil yaratilsa, eski manzil o'chiriladi. Davom etasizmi?",
          async () => {
            await regenerateWallet();
            notifySuccess();
          }
    );
  };

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 32,
        padding: 16,
        gap: 14,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <LinearGradient
          colors={["#2e5038", "#192f22", "#0e1913"]}
          style={styles.heroGradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
        <View style={[styles.heroGlow, { backgroundColor: "rgba(104,168,120,0.2)" }]} />

        <View style={styles.heroTop}>
          <LinearGradient
            colors={["#68a878", "#376b4b"]}
            style={styles.heroAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="user" size={28} color="#fff" />
            <View style={styles.avatarBadge}>
              <Feather name="shield" size={9} color="#fff" />
            </View>
          </LinearGradient>

          <View style={{ flex: 1 }}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      color: "#fff",
                      borderColor: "rgba(104,168,120,0.5)",
                      backgroundColor: "rgba(104,168,120,0.12)",
                    },
                  ]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  placeholder="Ismingiz..."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <Pressable
                  onPress={handleSaveName}
                  style={[styles.saveBtn, { backgroundColor: "rgba(104,168,120,0.3)" }]}
                >
                  <Feather name="check" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => { setEditingName(true); setNameInput(walletName); }}
                style={styles.nameRow}
              >
                <Text style={styles.heroName}>{walletName || "Ism qo'shish"}</Text>
                <Feather name="edit-2" size={13} color="rgba(255,255,255,0.45)" />
              </Pressable>
            )}
            <View style={styles.heroLabelRow}>
              <View style={[styles.rolePill, { backgroundColor: "rgba(104,168,120,0.25)" }]}>
                <Text style={styles.rolePillText}>Shaxsiy profil</Text>
              </View>
            </View>
          </View>

          <Pressable onPress={() => setShowGuide(true)} hitSlop={8}>
            <View style={[styles.guideBtn, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Feather name="help-circle" size={18} color="rgba(255,255,255,0.7)" />
            </View>
          </Pressable>
        </View>

        <View style={[styles.addressBox, { backgroundColor: "rgba(0,0,0,0.35)", borderColor: "rgba(255,255,255,0.08)" }]}>
          <View style={styles.addressLabelRow}>
            <Feather name="cpu" size={11} color="rgba(255,255,255,0.4)" />
            <Text style={styles.addressLabel}>Profil manzili</Text>
          </View>
          <Text style={styles.addressText} numberOfLines={2} selectable>
            {walletAddress}
          </Text>
        </View>

        <View style={styles.heroActions}>
          <Pressable onPress={handleCopy} style={[styles.heroBtn, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
            <Feather name="copy" size={14} color="#fff" />
            <Text style={styles.heroBtnText}>Nusxalash</Text>
          </Pressable>
          <Pressable onPress={handleRegenerate} style={[styles.heroBtn, { backgroundColor: "rgba(239,68,68,0.2)" }]}>
            <Feather name="refresh-cw" size={14} color="#f87171" />
            <Text style={[styles.heroBtnText, { color: "#f87171" }]}>Yangi yaratish</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="bar-chart-2" size={17} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Statistika</Text>
        </View>
        <View style={styles.statsRow}>
          <StatItem
            icon="layers"
            value={chain.length}
            label="Jami bloklar"
            gradColors={["#68a878", "#376b4b"] as [string, string]}
            colors={colors}
          />
          <StatItem
            icon="shield"
            value={myBlocks.length}
            label="Autentifikatsiya"
            gradColors={["#10b981", "#059669"] as [string, string]}
            colors={colors}
          />
          <StatItem
            icon="file-text"
            value={myBlocks.length}
            label="Hujjatlar"
            gradColors={["#f59e0b", "#d97706"] as [string, string]}
            colors={colors}
          />
        </View>
      </View>

      {myBlocks.length > 0 && (
        <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="git-commit" size={17} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Qaydlar tarixi</Text>
            <View style={[styles.countChip, { backgroundColor: colors.primaryGlow }]}>
              <Text style={[styles.countChipText, { color: colors.primaryLight }]}>{myBlocks.length}</Text>
            </View>
          </View>

          {myBlocks
            .slice()
            .reverse()
            .slice(0, 15)
            .map((block, i, arr) => (
              <View key={block.index} style={styles.blockRow}>
                <View style={styles.blockLeft}>
                  <LinearGradient
                    colors={["#68a878", "#376b4b"]}
                    style={styles.blockNumBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.blockNumText}>#{block.index}</Text>
                  </LinearGradient>
                  {i < arr.length - 1 && (
                    <View style={[styles.chainLine, { backgroundColor: colors.border }]} />
                  )}
                </View>
                <View
                  style={[
                    styles.blockCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.blockCardTop}>
                    <View style={[styles.blockFileIcon, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
                      <Feather name="file-text" size={13} color={colors.success} />
                    </View>
                    <Text
                      style={[styles.blockDocName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {block.documentName}
                    </Text>
                    <LinearGradient
                      colors={["#10b981", "#059669"]}
                      style={styles.verifiedTag}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Feather name="check" size={9} color="#fff" />
                    </LinearGradient>
                  </View>
                  <Text style={[styles.blockMeta, { color: colors.mutedForeground }]}>
                    {formatFileSize(block.fileSize)} · {formatDate(block.timestamp)}
                  </Text>
                  <View style={[styles.blockHashRow, { backgroundColor: colors.background }]}>
                    <Feather name="hash" size={10} color={colors.mutedForeground} />
                    <Text style={[styles.blockHash, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {block.hash.slice(0, 22)}...{block.hash.slice(-6)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
        </View>
      )}

      <ServerConfigCard
        colors={colors}
        isOnline={isOnline}
        serverUrl={serverUrl}
        serverInput={serverInput}
        setServerInput={setServerInput}
        editingServer={editingServer}
        setEditingServer={setEditingServer}
        onSave={async () => {
          try {
          await setAndSaveServerUrl(serverInput.trim());
          setEditingServer(false);
          notifySuccess();
          } catch (e) { notice("Server manzili", e instanceof Error ? e.message : "Manzil saqlanmadi."); }
        }}
      />

      {chain.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient
            colors={["rgba(104,168,120,0.15)", "rgba(104,168,120,0.04)"]}
            style={styles.emptyIcon}
          >
            <Feather name="inbox" size={36} color={colors.primary} />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Hali qaydlar yo'q</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Hujjat autentifikatsiya qilgach, u bu yerda zanjir sifatida saqlanadi
          </Text>
        </View>
      )}

      <GuideModal visible={showGuide} onClose={() => setShowGuide(false)} colors={colors} insets={insets} />
    </ScrollView>
  );
}

function ServerConfigCard({
  colors,
  isOnline,
  serverUrl,
  serverInput,
  setServerInput,
  editingServer,
  setEditingServer,
  onSave,
}: any) {
  return (
    <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={[
              styles.serverIconBg,
              {
                backgroundColor: isOnline ? colors.successBg : colors.warningBg,
                borderColor: isOnline ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)",
              },
            ]}
          >
            <Feather
              name={isOnline ? "wifi" : "wifi-off"}
              size={15}
              color={isOnline ? colors.success : colors.warning}
            />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontSize: 15 }]}>
              Server Ulanishi
            </Text>
            <Text
              style={{
                color: isOnline ? colors.success : colors.warning,
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                marginTop: 1,
              }}
            >
              {isOnline ? "● Ulangan" : "● Ulanmagan"}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Server sozlamalarini tahrirlash"
          onPress={() => { setServerInput(serverUrl); setEditingServer((v: boolean) => !v); }}
          style={[styles.settingsBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Feather name={editingServer ? "x" : "settings"} size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {editingServer ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>
            Server URL ni kiriting
          </Text>
          <View
            style={[
              styles.serverInputWrap,
              { backgroundColor: colors.secondary, borderColor: colors.primary },
            ]}
          >
            <Feather name="link" size={14} color={colors.mutedForeground} style={{ marginLeft: 12 }} />
            <TextInput
              style={[styles.serverInput, { color: colors.foreground }]}
              value={serverInput}
              onChangeText={setServerInput}
              placeholder="https://..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={onSave}
            />
          </View>
          <Pressable onPress={onSave}>
            <LinearGradient
              colors={["#68a878", "#376b4b"]}
              style={styles.saveServerBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.heroBtnText}>Saqlash</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.serverUrlBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="link-2" size={12} color={colors.mutedForeground} />
          <Text
            style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 }}
            numberOfLines={1}
          >
            {serverUrl || "Sozlanmagan — yuqoridagi tugmani bosing"}
          </Text>
        </View>
      )}
    </View>
  );
}

function StatItem({ icon, value, label, gradColors, colors }: any) {
  return (
    <View
      style={[
        styles.statItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <LinearGradient
        colors={gradColors}
        style={styles.statIconBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Feather name={icon} size={15} color="#fff" />
      </LinearGradient>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const GUIDE_SECTIONS = [
  { icon: "info" as const, color: "#68a878", title: "Ravoq nima?", content: "Suhbatlar, mahalliy qaydlar va hujjat nusxalarini tekshirish uchun ish maydoni." },
  { icon: "hash" as const, color: "#68a878", title: "Hujjat qanday tekshiriladi?", content: "SHA-256 faylning haqiqiy baytlaridan hash hisoblaydi. Bir xil tarkib bir xil hash beradi. Mahalliy zanjir ham tekshiriladi. Eski versiyada yaratilgan hujjatlarni qayta qayd eting." },
  { icon: "hard-drive" as const, color: "#dfbd76", title: "Qaydlar qayerda saqlanadi?", content: "Profil, suhbat keshi va hujjat reyestri shu qurilmada saqlanadi. Onlayn xabarlar va biriktirilgan hujjat metama'lumotlari sozlangan serverga yuboriladi. Hozir faylning o'zi boshqa qurilmaga yuklanmaydi." },
  { icon: "shield" as const, color: "#68a878", title: "Tekshiruv nimani bildiradi?", content: "Natija fayl tarkibi mahalliy qaydga mosligini bildiradi. Bu elektron imzo, shaxsni tasdiqlash yoki ommaviy blokcheyn kafolati emas. Profil manzili kriptohamyon emas. Hozircha uchidan uchigacha shifrlash mavjud emas." },
];

function GuideModal({ visible, onClose, colors, insets }: any) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { backgroundColor: "#17251e" }]}>
          <LinearGradient
            colors={["rgba(104,168,120,0.2)", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <View
            style={{
              paddingTop: insets.top + 18,
              paddingBottom: 22,
              paddingHorizontal: 20,
            }}
          >
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleLeft}>
                <LinearGradient
                  colors={["#68a878", "#376b4b"]}
                  style={styles.guideHeaderIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather name="book-open" size={18} color="#fff" />
                </LinearGradient>
                <Text style={styles.modalTitle}>Qo'llanma</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
              >
                <Feather name="x" size={18} color="#fff" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              Ravoq bilan hujjatlarni blokcheynda tasdiqlang
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
        >
          {GUIDE_SECTIONS.map((sec, i) => (
            <View
              key={i}
              style={[styles.guideSection, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.guideSectionHeader}>
                <View style={[styles.guideIcon, { backgroundColor: sec.color + "18", borderColor: sec.color + "25" }]}>
                  <Feather name={sec.icon} size={19} color={sec.color} />
                </View>
                <Text style={[styles.guideSectionTitle, { color: colors.foreground }]}>
                  {sec.title}
                </Text>
              </View>
              <Text style={[styles.guideSectionText, { color: colors.mutedForeground }]}>
                {sec.content}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  heroCard: {
    borderRadius: 22,
    overflow: "hidden",
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(104,168,120,0.2)",
    shadowColor: "#68a878",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroGlow: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.4,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 13 },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#68a878",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    position: "relative",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#17251e",
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  heroName: { fontSize: 21, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.4 },
  heroLabelRow: { flexDirection: "row" },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rolePillText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  nameInput: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  guideBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addressBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 7 },
  addressLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  addressLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#f1f4ed",
    lineHeight: 21,
    letterSpacing: 0.4,
  },
  heroActions: { flexDirection: "row", gap: 10 },
  heroBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 13,
  },
  heroBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  countChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 2,
  },
  countChipText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  statsCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  historyCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 4 },
  blockRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 12 },
  blockLeft: { alignItems: "center", width: 38 },
  blockNumBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#68a878",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  blockNumText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  chainLine: { width: 2, flex: 1, minHeight: 18, marginVertical: 4 },
  blockCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    gap: 6,
    marginBottom: 4,
  },
  blockCardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  blockFileIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  blockDocName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, letterSpacing: -0.2 },
  verifiedTag: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  blockMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  blockHashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  blockHash: { fontSize: 11, fontFamily: "Inter_400Regular" },
  serverIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  serverInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 13,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  serverInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  saveServerBtn: {
    height: 48,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  serverUrlBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 11,
    padding: 11,
    borderWidth: 1,
  },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 32, alignItems: "center", gap: 14 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 19, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  modalContainer: { flex: 1 },
  modalHeader: { overflow: "hidden" },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  guideHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.5 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  guideSection: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 11 },
  guideSectionHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  guideIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  guideSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1, letterSpacing: -0.2 },
  guideSectionText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
});
