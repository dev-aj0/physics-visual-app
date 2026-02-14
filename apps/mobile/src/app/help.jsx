import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { ChevronLeft, Mail } from "lucide-react-native";
import { useTheme } from "@/utils/theme";

const FAQ_ITEMS = [
  {
    q: "How do I get help with a physics problem?",
    a: "Take a photo of the problem or type it in, then tap Analyze. You'll get step-by-step solutions with formulas. Tap each step to reveal it.",
  },
  {
    q: "Can I ask follow-up questions?",
    a: "Yes! Open the Tutor tab or tap the chat icon on a problem to ask questions. The AI tutor has context from your problem.",
  },
  {
    q: "How do I generate diagrams?",
    a: "When viewing a solution, look for \"Generate diagram\" buttons. Tap one to create a free body diagram, motion graphic, or other visual.",
  },
  {
    q: "Where are my problems stored?",
    a: "Problems are saved on this device. Use the Library tab to browse and search all your problems.",
  },
  {
    q: "The app won't load. What should I check?",
    a: "Ensure you're connected to the internet and that the backend server is running. Check ENV_SETUP.md for the correct base URL and health check.",
  },
];

const SUPPORT_EMAIL = "support@physicstutor.app";
const SUPPORT_SUBJECT = "Physics Tutor - Support Request";

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Help & Support",
          headerTitleStyle: { fontSize: 18, fontWeight: "600", color: colors.text },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8, marginLeft: 8 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
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
          Frequently Asked Questions
        </Text>

        {FAQ_ITEMS.map((item, index) => (
          <View
            key={index}
            style={{
              backgroundColor: colors.card,
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              {item.q}
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
              {item.a}
            </Text>
          </View>
        ))}

        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          Contact Support
        </Text>

        <TouchableOpacity
          onPress={handleContactSupport}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Mail size={20} color={colors.secondary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
              Email support
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              {SUPPORT_EMAIL}
            </Text>
          </View>
          <Text style={{ fontSize: 20, color: colors.textSecondary }}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
