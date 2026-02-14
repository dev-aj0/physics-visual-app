import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout";
import {
  Award,
  BookOpen,
  Clock,
  Zap,
  Trophy,
  Flame,
  Settings,
  Bell,
  HelpCircle,
  ChevronRight,
  Moon,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";
import { router } from "expo-router";

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
    "person.fill": "👤",
    "book.fill": "📚",
    "clock.fill": "🕐",
    "trophy.fill": "🏆",
    "medal.fill": "🥇",
    "gear": "⚙️",
    "bell.fill": "🔔",
    "moon.fill": "🌙",
    "questionmark.circle": "❓",
  };
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: size }}>{iconMap[name] || "•"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";

  const { data } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const response = await fetchWithTimeout(`${baseURL}/api/problems/list`, {}, 15000);
      if (!response.ok) throw new Error("Failed to fetch problems");
      return response.json();
    },
  });

  const problemCount = data?.problems?.length || 48;
  const hours = 12.5;
  const streak = 5;

  const settingsOptions = [
    { 
      icon: "gear", 
      label: "Preferences", 
      subtitle: "Customize your learning experience",
      onPress: () => router.push("/(tabs)/settings"),
    },
    { 
      icon: "bell.fill", 
      label: "Notifications", 
      subtitle: "Study reminders and updates",
      onPress: () => {},
    },
    { 
      icon: "moon.fill", 
      label: "Appearance", 
      subtitle: "Light mode",
      onPress: () => {},
    },
    { 
      icon: "questionmark.circle", 
      label: "Help & Support", 
      subtitle: "FAQs and contact us",
      onPress: () => router.push("/help"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FBFD" }}>
      <StatusBar style="dark" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card with Gradient */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <LinearGradient
            colors={["#FF9B7A", "#FF7A5C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 20,
              padding: 24,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <SFSymbol name="person.fill" color="#FFFFFF" size={32} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  marginBottom: 4,
                }}
              >
                Physics Student
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.9)" }}>
                Level 3 • Momentum Master
              </Text>
              
              {/* Stats Row */}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 20,
                  gap: 24,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <SFSymbol name="book.fill" color="#FFFFFF" size={20} />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#FFFFFF",
                      marginTop: 4,
                    }}
                  >
                    {problemCount}
                  </Text>
                  <Text style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)" }}>
                    Problems
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <SFSymbol name="clock.fill" color="#FFFFFF" size={20} />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#FFFFFF",
                      marginTop: 4,
                    }}
                  >
                    {hours}
                  </Text>
                  <Text style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)" }}>
                    Hours
                  </Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <SFSymbol name="trophy.fill" color="#FFFFFF" size={20} />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#FFFFFF",
                      marginTop: 4,
                    }}
                  >
                    {streak}
                  </Text>
                  <Text style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)" }}>
                    Streak
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Latest Achievement */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E8F1F8",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#F3E8FF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <SFSymbol name="medal.fill" color="#8B5CF6" size={24} />
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
                Latest Achievement
              </Text>
              <Text style={{ fontSize: 14, color: "#8B5CF6" }}>
                Free Body Diagram Expert
              </Text>
            </View>
          </View>
        </View>


        {/* Settings */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1E293B",
              marginBottom: 16,
            }}
          >
            Settings
          </Text>
          <View style={{ gap: 0 }}>
            {settingsOptions.map((option, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: "#F1F5F9",
                  borderRadius: 12,
                  marginBottom: idx < settingsOptions.length - 1 ? 8 : 0,
                  overflow: "hidden",
                }}
              >
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                  }}
                  onPress={option.onPress}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "#E2E8F0",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <SFSymbol name={option.icon} color="#64748B" size={20} />
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
                      {option.label}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#64748B" }}>
                      {option.subtitle}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 20, color: "#94A3B8" }}>›</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
