import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Upload, FileText, Clock } from "lucide-react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import useUpload from "@/utils/useUpload";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import { useQuery } from "@tanstack/react-query";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";
import { useTheme } from "@/utils/theme";

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
    "bolt.fill": "⚡",
    "target": "🎯",
    "chart.line.uptrend.xyaxis": "📈",
  };
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: size }}>{iconMap[name] || "•"}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [problemText, setProblemText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recentProblems, setRecentProblems] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentError, setRecentError] = useState(null);
  const [upload] = useUpload();

  const { data: problemsData } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const response = await fetchWithTimeout(`${baseURL}/api/problems/list`, {}, 15000);
      if (!response.ok) throw new Error("Failed to fetch problems");
      return response.json();
    },
  });

  const problemCount = problemsData?.problems?.length || 12;
  const accuracy = 85;
  const dayStreak = 5;

  useEffect(() => {
    loadRecentProblems();
  }, []);

  const loadRecentProblems = async () => {
    setRecentError(null);
    try {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const apiUrl = `${baseURL}/api/problems/list?limit=3`;
      console.log("Fetching recent problems from:", apiUrl);
      
      const response = await fetchWithTimeout(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }, 15000);

      if (response.ok) {
        const data = await response.json();
        setRecentProblems(data.problems || []);
        setRecentError(null);
      } else {
        setRecentError("Could not load problems. Check that the server is running.");
      }
    } catch (error) {
      console.error("Error loading recent problems:", error);
      setRecentError(error.message || "Could not load problems. Check that the server is running.");
    } finally {
      setLoadingRecent(false);
    }
  };

  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          alert("Camera permission is required to take photos");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setSelectedImage(result.assets[0].uri);
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Gallery permission is required to select photos");
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setSelectedImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Failed to pick image: " + error.message);
    }
  };

  const handleAnalyze = async () => {
    if (!problemText && !selectedImage) {
      alert("Please enter a problem or select an image");
      return;
    }

    try {
      setUploading(true);

      let imageUrl = null;
      if (selectedImage) {
        // Upload using the useUpload hook
        const result = await upload({
          reactNativeAsset: {
            uri: selectedImage,
            name: 'problem_image.jpg',
            mimeType: 'image/jpeg',
          }
        });
        
        if (result.error) {
          console.warn("Upload failed, sending image directly:", result.error);
          // If upload fails, we'll send the local URI and let the server handle it
          // Or we can skip the image for now
        } else {
          imageUrl = result.url;
        }
      }

      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      console.log("Analyzing problem:", { problemText: problemText?.substring(0, 50), hasImage: !!imageUrl });
      
      const response = await fetchWithTimeout(`${baseURL}/api/problems/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemText: problemText.trim() || null,
          imageUrl,
        }),
      }, 60000);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze problem");
      }

      const data = await response.json();

      setProblemText("");
      setSelectedImage(null);

      // Reload recent problems
      loadRecentProblems();

      router.push(`/problem/${data.problemId}`);
    } catch (error) {
      console.error("Error analyzing problem:", error);
      alert("Failed to analyze problem: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 4 }}>
            Welcome back
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Physics Tutor
          </Text>
        </View>

        {/* AI-Powered Learning Banner */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: colors.secondary,
              borderRadius: 20,
              padding: 24,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 28 }}>✨</Text>
            </View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#FFFFFF",
                marginBottom: 8,
              }}
            >
              AI-Powered Learning
            </Text>
            <Text style={{ fontSize: 15, color: "#FFFFFF", lineHeight: 22 }}>
              Upload any physics problem and watch it come to life with visual
              explanations, step-by-step solutions, and interactive diagrams.
            </Text>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
            }}
          >
            {/* Problems Solved */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: colors.secondaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <SFSymbol name="bolt.fill" color={colors.secondary} size={24} />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {problemCount}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>
                Problems Solved
              </Text>
            </View>

            {/* Accuracy */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <SFSymbol name="target" color={colors.primary} size={24} />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {accuracy}%
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>
                Accuracy
              </Text>
            </View>

            {/* Day Streak */}
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <SFSymbol name="chart.line.uptrend.xyaxis" color={colors.primary} size={24} />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                {dayStreak}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center" }}>
                Day Streak
              </Text>
            </View>
          </View>
        </View>

        {/* Start a Problem Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Start a Problem
          </Text>

          {/* Camera and Gallery Buttons */}
          <View style={{ gap: 12, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Camera color="#FFFFFF" size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#FFFFFF",
                    marginBottom: 4,
                  }}
                >
                  Take a Photo
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
                  Capture your physics problem
                </Text>
              </View>
              <Text style={{ fontSize: 24, color: "#FFFFFF" }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickImage(false)}
              style={{
                backgroundColor: colors.secondary,
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: colors.secondary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Upload color="#FFFFFF" size={28} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#FFFFFF",
                    marginBottom: 4,
                  }}
                >
                  Upload Image
                </Text>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>
                  Choose from your gallery
                </Text>
              </View>
              <Text style={{ fontSize: 24, color: "#FFFFFF" }}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Image Preview */}
          {selectedImage && (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 12,
                }}
              >
                Selected Image
              </Text>
              <Image
                source={{ uri: selectedImage }}
                style={{ width: "100%", height: 200, borderRadius: 12 }}
                contentFit="contain"
              />
              <TouchableOpacity
                onPress={() => setSelectedImage(null)}
                style={{ marginTop: 12 }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.error,
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  Remove Image
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Text Input */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <FileText color={colors.textSecondary} size={20} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.text,
                  marginLeft: 8,
                }}
              >
                Or type your problem
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                fontSize: 15,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: "top",
                borderWidth: 2,
                borderColor: colors.border,
              }}
              placeholder="A 5kg box is pushed across a frictionless surface..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={problemText}
              onChangeText={setProblemText}
            />
          </View>

          {/* Analyze Button */}
          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={uploading || (!problemText && !selectedImage)}
            style={{
              backgroundColor:
                (!problemText && !selectedImage) || uploading
                  ? colors.border
                  : colors.primary,
              borderRadius: 16,
              padding: 18,
              alignItems: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity:
                uploading || (!problemText && !selectedImage) ? 0 : 0.3,
              shadowRadius: 8,
            }}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{ fontSize: 17, fontWeight: "700", color: "#FFFFFF" }}
              >
                Analyze Problem
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent History - Error state */}
        {recentError && !loadingRecent && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.error,
              }}
            >
              <Text style={{ color: colors.error, fontSize: 14, textAlign: "center" }}>
                {recentError}
              </Text>
              <TouchableOpacity
                onPress={() => { setRecentError(null); loadRecentProblems(); }}
                style={{ marginTop: 12, alignSelf: "center" }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Recent History - Loading */}
        {loadingRecent && recentProblems.length === 0 && !recentError && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.textSecondary, fontSize: 14 }}>
                Loading recent problems...
              </Text>
            </View>
          </View>
        )}
        {recentProblems.length > 0 && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: colors.text }}
              >
                Recent History
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/library")}>
                <Text
                  style={{ fontSize: 15, color: colors.primary, fontWeight: "600" }}
                >
                  View all
                </Text>
              </TouchableOpacity>
            </View>

            {recentProblems.map((problem) => (
              <TouchableOpacity
                key={problem.id}
                onPress={() => router.push(`/problem/${problem.id}`)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 2,
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
                  numberOfLines={2}
                >
                  {problem.problem_text}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    {formatTimeAgo(problem.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}
