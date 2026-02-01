import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Platform, Text, View } from "react-native";
import { useTheme } from "@/utils/theme";

// SF Symbols icon component wrapper
function SFSymbol({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
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
  // Fallback for web/Android - using Unicode characters
  const iconMap: { [key: string]: string } = {
    "house.fill": "🏠",
    "book.open": "📖",
    "book.closed.fill": "📚",
    "message.fill": "💬",
    "person.fill": "👤",
    "gear": "⚙️",
  };
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: size, color }}>{iconMap[name] || "•"}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 60,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="house.fill" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Problems",
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="book.closed.fill" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: "AI Tutor",
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="message.fill" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="person.fill" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SFSymbol name="gear" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
