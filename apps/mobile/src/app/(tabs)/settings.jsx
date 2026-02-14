import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { Platform, Linking } from "react-native";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/utils/theme";
import { useDarkModeStore } from "@/utils/darkModeStore";

const NOTIFICATIONS_KEY = "@physics_tutor/notifications";
const SOUND_EFFECTS_KEY = "@physics_tutor/sound_effects";
const HAPTIC_FEEDBACK_KEY = "@physics_tutor/haptic_feedback";

// SF Symbols icon component wrapper
function SFSymbol({ name, color, size = 24 }: { name: string; color: string; size?: number }) {
  if (Platform.OS === "ios") {
    try {
      return (
        <SymbolView
          name={name}
          tintColor={color}
          type="monochrome"
          weight="regular"
          scale="medium"
          style={{ width: size, height: size }}
        />
      );
    } catch (e) {
      // Fallback if symbol not available
    }
  }
  // Fallback for web/Android
  const iconMap: { [key: string]: string } = {
    "bell": "🔔",
    "moon.fill": "🌙",
    "speaker.wave.2.fill": "🔊",
    "iphone.radiowaves.left.and.right": "📶",
    "globe": "🌐",
    "questionmark.circle": "❓",
    "star": "⭐",
    "gear": "⚙️",
  };
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: size }}>{iconMap[name] || "•"}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isDark: darkMode, toggle: toggleDarkMode } = useDarkModeStore();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  useEffect(() => {
    useDarkModeStore.getState().init();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [n, s, h] = await Promise.all([
          AsyncStorage.getItem(NOTIFICATIONS_KEY),
          AsyncStorage.getItem(SOUND_EFFECTS_KEY),
          AsyncStorage.getItem(HAPTIC_FEEDBACK_KEY),
        ]);
        if (n !== null) setNotifications(n === "true");
        if (s !== null) setSoundEffects(s === "true");
        if (h !== null) setHapticFeedback(h === "true");
      } catch (_) {}
    })();
  }, []);

  const persistNotifications = (value) => {
    setNotifications(value);
    AsyncStorage.setItem(NOTIFICATIONS_KEY, String(value));
  };
  const persistSoundEffects = (value) => {
    setSoundEffects(value);
    AsyncStorage.setItem(SOUND_EFFECTS_KEY, String(value));
  };
  const persistHapticFeedback = (value) => {
    setHapticFeedback(value);
    AsyncStorage.setItem(HAPTIC_FEEDBACK_KEY, String(value));
  };

  const preferences = [
    {
      icon: "bell",
      title: "Notifications",
      subtitle: "Study reminders and updates",
      value: notifications,
      onValueChange: persistNotifications,
      type: "switch",
    },
    {
      icon: "moon.fill",
      title: "Dark Mode",
      subtitle: "Switch to dark theme",
      value: darkMode,
      onValueChange: toggleDarkMode,
      type: "switch",
    },
    {
      icon: "speaker.wave.2.fill",
      title: "Sound Effects",
      subtitle: "Play sounds on interactions",
      value: soundEffects,
      onValueChange: persistSoundEffects,
      type: "switch",
    },
    {
      icon: "iphone.radiowaves.left.and.right",
      title: "Haptic Feedback",
      subtitle: "Vibrations on tap",
      value: hapticFeedback,
      onValueChange: persistHapticFeedback,
      type: "switch",
    },
  ];

  const generalSettings = [
    {
      icon: "globe",
      title: "Language",
      subtitle: "English",
      type: "navigation",
      onPress: () => {
        // Navigate to language settings
      },
    },
    {
      icon: "questionmark.circle",
      title: "Help & Support",
      subtitle: "FAQs, contact us",
      type: "navigation",
      onPress: () => router.push("/help"),
    },
    {
      icon: "star",
      title: "Rate the App",
      subtitle: "Leave a review",
      type: "navigation",
      onPress: async () => {
        const url = process.env.EXPO_PUBLIC_APP_STORE_URL || (Platform.OS === "ios"
          ? "https://apps.apple.com/app/id000000000?action=write-review"
          : "market://details?id=xyz.create.CreateExpoEnvironment");
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) await Linking.openURL(url);
        } catch (e) {
          // Fallback to generic store search
          if (Platform.OS === "ios") {
            Linking.openURL("https://apps.apple.com/");
          } else {
            Linking.openURL("https://play.google.com/store/apps");
          }
        }
      },
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 40,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Settings
          </Text>
          <Text style={{ fontSize: 16, color: colors.textSecondary }}>
            Customize your learning experience
          </Text>
        </View>

        {/* Preferences Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            PREFERENCES
          </Text>

          <View style={{ gap: 0 }}>
            {preferences.map((item, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  marginBottom: index < preferences.length - 1 ? 8 : 0,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                  }}
                  disabled={item.type === "switch"}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: item.value && item.type === "switch" ? colors.secondary : colors.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <SFSymbol
                      name={item.icon}
                      color={item.value && item.type === "switch" ? colors.background : colors.textSecondary}
                      size={20}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#1E293B",
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#64748B" }}>
                      {item.subtitle}
                    </Text>
                  </View>
                  {item.type === "switch" && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: colors.border, true: colors.secondary }}
                      thumbColor={colors.background}
                      ios_backgroundColor={colors.border}
                    />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* General Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            GENERAL
          </Text>

          <View style={{ gap: 0 }}>
            {generalSettings.map((item, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  marginBottom: index < generalSettings.length - 1 ? 8 : 0,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                  }}
                  onPress={item.onPress}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: colors.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <SFSymbol name={item.icon} color={colors.textSecondary} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.text,
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, color: colors.textSecondary }}>›</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
