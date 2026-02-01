import { useColorScheme } from "react-native";
import { useDarkModeStore } from "./darkModeStore";
import { useEffect } from "react";

export const useTheme = () => {
  const { isDark, init } = useDarkModeStore();
  
  useEffect(() => {
    init();
  }, []);

  return {
    isDark,
    colors: {
      // Background colors
      background: isDark ? "#0F1419" : "#FAFBFC",
      surface: isDark ? "#1A1F26" : "#FFFFFF",
      surfaceElevated: isDark ? "#242B33" : "#F8F9FA",

      // Text colors
      text: isDark ? "rgba(255, 255, 255, 0.92)" : "#1A1A1A",
      textSecondary: isDark ? "rgba(255, 255, 255, 0.65)" : "#6B7280",
      textTertiary: isDark ? "rgba(255, 255, 255, 0.4)" : "#D1D5DB",

      // Brand colors - Pastel Orange and Blue
      primary: isDark ? "#70B4E8" : "#5B9ED6", // Pastel blue
      primaryLight: isDark ? "rgba(112, 180, 232, 0.15)" : "#E3F2FD",
      primaryDark: isDark ? "#4A8EC7" : "#3D7AB8",

      secondary: isDark ? "#FFB87A" : "#FFA85C", // Pastel orange
      secondaryLight: isDark ? "rgba(255, 184, 122, 0.15)" : "#FFF4E6",
      secondaryDark: isDark ? "#FF9A4D" : "#FF8C3A",

      // UI colors
      border: isDark ? "#2D333A" : "#E5E7EB",
      borderLight: isDark ? "#252B32" : "#F3F4F6",

      // Status colors
      success: isDark ? "#66D9A8" : "#4CAF50",
      warning: isDark ? "#FFB87A" : "#FF9800",
      error: isDark ? "#FF8A80" : "#EF4444",

      // Card and component colors
      card: isDark ? "#1A1F26" : "#FFFFFF",
      cardBorder: isDark ? "#2D333A" : "#E5E7EB",

      // Tab bar colors
      tabBar: isDark ? "#1A1F26" : "#FFFFFF",
      tabBarBorder: isDark ? "#2D333A" : "#E5E7EB",
      tabBarActive: isDark ? "#70B4E8" : "#5B9ED6",
      tabBarInactive: isDark ? "rgba(255, 255, 255, 0.5)" : "#9CA3AF",

      // Upload section
      uploadBorder: isDark ? "#2D333A" : "#D1D5DB",
      uploadBackground: isDark ? "#1A1F26" : "#F9FAFB",
      uploadActive: isDark ? "rgba(112, 180, 232, 0.1)" : "#E3F2FD",

      // Visual diagram colors
      visualBackground: isDark ? "#242B33" : "#F8F9FA",
      visualBorder: isDark ? "#2D333A" : "#E5E7EB",

      // Step reveal colors
      stepBackground: isDark ? "#1A1F26" : "#FFFFFF",
      stepBorder: isDark ? "#2D333A" : "#E5E7EB",
      stepRevealed: isDark ? "rgba(112, 180, 232, 0.1)" : "#F0F9FF",

      // Math/Equation colors (yellow highlight)
      mathBackground: isDark ? "rgba(255, 230, 100, 0.25)" : "rgba(255, 240, 120, 0.5)",
      mathText: isDark ? "#FFF176" : "#5D4037",

      // Code colors
      codeBackground: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",

      // Overlay
      overlay: isDark ? "rgba(0, 0, 0, 0.75)" : "rgba(0, 0, 0, 0.5)",
    },
  };
};
