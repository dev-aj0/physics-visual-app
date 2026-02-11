import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronLeft,
  Lightbulb,
  Eye,
  EyeOff,
  MessageCircle,
  Sparkles,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import { useTheme } from "@/utils/theme";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import { SvgXml } from "react-native-svg";
import { Image } from "expo-image";

export default function ProblemDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  const [problem, setProblem] = useState(null);
  const [solution, setSolution] = useState(null);
  const [visuals, setVisuals] = useState([]);
  const [revealedSteps, setRevealedSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingVisuals, setGeneratingVisuals] = useState(false);
  const [generatingDiagrams, setGeneratingDiagrams] = useState({});

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    InstrumentSerif_400Regular,
  });

  useEffect(() => {
    if (id) {
      fetchProblemDetails();
    }
  }, [id]);

  const fetchProblemDetails = async () => {
    try {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const response = await fetchWithTimeout(`${baseURL}/api/problems/get?id=${id}`, {}, 15000);
      if (!response.ok) throw new Error("Failed to fetch problem");
      const data = await response.json();
      setProblem(data.problem);
      setSolution(data.solution);
      setVisuals(data.visuals || []);
    } catch (error) {
      console.error("Error fetching problem:", error);
      Alert.alert("Error", "Failed to load problem details");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVisuals = async () => {
    try {
      setGeneratingVisuals(true);
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const response = await fetchWithTimeout(`${baseURL}/api/problems/generate-visuals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: id }),
      }, 60000);

      if (!response.ok) throw new Error("Failed to generate visuals");
      const data = await response.json();
      setVisuals(data.visuals);
    } catch (error) {
      console.error("Error generating visuals:", error);
      Alert.alert("Error", "Failed to generate visuals");
    } finally {
      setGeneratingVisuals(false);
    }
  };

  const handleGenerateDiagram = async (visualId, visualType) => {
    try {
      setGeneratingDiagrams((prev) => ({ ...prev, [visualId]: true }));
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const response = await fetchWithTimeout(`${baseURL}/api/problems/generate-diagrams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: id, visualType }),
      }, 60000);

      if (!response.ok) throw new Error("Failed to generate diagram");
      const data = await response.json();
      
      // Update the visual in the state
      setVisuals((prev) =>
        prev.map((v) => (v.id === visualId ? data.visual : v))
      );
    } catch (error) {
      console.error("Error generating diagram:", error);
      Alert.alert("Error", "Failed to generate diagram");
    } finally {
      setGeneratingDiagrams((prev) => ({ ...prev, [visualId]: false }));
    }
  };

  const toggleStep = (stepNumber) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRevealedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((s) => s !== stepNumber)
        : [...prev, stepNumber],
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!problem) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Text
          style={{ color: colors.text, textAlign: "center", marginTop: 100 }}
        >
          Problem not found
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 16 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 18,
            color: colors.text,
            flex: 1,
          }}
        >
          Problem Details
        </Text>
        <TouchableOpacity onPress={() => router.push(`/tutor/${id}`)}>
          <MessageCircle size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          {/* Original Image (if uploaded) */}
          {problem.problem_image_url && (
            <View
              style={{
                marginBottom: 24,
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Image
                source={{ uri: problem.problem_image_url }}
                style={{ width: "100%", height: 220 }}
                contentFit="contain"
              />
            </View>
          )}

          {/* Problem Text */}
          <View
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 8,
              }}
            >
              PROBLEM
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 16,
                color: colors.text,
                lineHeight: 24,
              }}
            >
              {problem.problem_text}
            </Text>
          </View>

          {/* Generate Visuals Button */}
          {visuals.length === 0 && (
            <TouchableOpacity
              style={{
                backgroundColor: colors.secondary,
                borderRadius: 16,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                opacity: generatingVisuals ? 0.6 : 1,
              }}
              onPress={handleGenerateVisuals}
              disabled={generatingVisuals}
            >
              {generatingVisuals ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Sparkles
                    size={20}
                    color={colors.background}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 16,
                      color: colors.background,
                    }}
                  >
                    Generate Visuals
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Visuals Section */}
          {visuals.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 18,
                  color: colors.text,
                  marginBottom: 16,
                }}
              >
                Physics Visualizations
              </Text>
              {visuals.map((visual) => (
                <View
                  key={visual.id}
                  style={{
                    backgroundColor: colors.visualBackground,
                    borderWidth: 1,
                    borderColor: colors.visualBorder,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.primaryLight,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      alignSelf: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 12,
                        color: colors.primary,
                        textTransform: "uppercase",
                      }}
                    >
                      {visual.visual_type.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 15,
                      color: colors.text,
                      lineHeight: 22,
                    }}
                  >
                    {visual.visual_description}
                  </Text>
                  
                  {/* SVG Diagram */}
                  {visual.svg_data ? (
                    <View
                      style={{
                        marginTop: 16,
                        height: 250,
                        backgroundColor: colors.background,
                        borderRadius: 12,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <SvgXml xml={visual.svg_data} width="100%" height="100%" />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{
                        marginTop: 16,
                        backgroundColor: colors.primaryLight,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        borderRadius: 12,
                        padding: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 100,
                      }}
                      onPress={() => handleGenerateDiagram(visual.id, visual.visual_type)}
                      disabled={generatingDiagrams[visual.id]}
                    >
                      {generatingDiagrams[visual.id] ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <>
                          <Sparkles
                            size={24}
                            color={colors.primary}
                            style={{ marginBottom: 8 }}
                          />
                          <Text
                            style={{
                              fontFamily: "Inter_600SemiBold",
                              fontSize: 14,
                              color: colors.primary,
                              textAlign: "center",
                            }}
                          >
                            Generate Diagram
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Solution Steps */}
          {solution && solution.steps && solution.steps.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Lightbulb size={24} color={colors.secondary} />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 18,
                    color: colors.text,
                    marginLeft: 8,
                  }}
                >
                  Step-by-Step Solution
                </Text>
              </View>

              {solution.steps.map((step, index) => {
                const isRevealed = revealedSteps.includes(step.step_number);
                return (
                  <TouchableOpacity
                    key={step.id}
                    style={{
                      backgroundColor: isRevealed
                        ? colors.stepRevealed
                        : colors.stepBackground,
                      borderWidth: 1,
                      borderColor: colors.stepBorder,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 12,
                    }}
                    onPress={() => toggleStep(step.step_number)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 16,
                          color: colors.text,
                          flex: 1,
                        }}
                      >
                        Step {step.step_number}: {step.title}
                      </Text>
                      {isRevealed ? (
                        <EyeOff size={20} color={colors.textSecondary} />
                      ) : (
                        <Eye size={20} color={colors.primary} />
                      )}
                    </View>

                    {isRevealed && (
                      <View style={{ marginTop: 12 }}>
                        <Text
                          style={{
                            fontFamily: "Inter_400Regular",
                            fontSize: 15,
                            color: colors.text,
                            lineHeight: 22,
                            marginBottom: step.formula ? 12 : 0,
                          }}
                        >
                          {step.explanation}
                        </Text>
                        {step.formula && (
                          <View
                            style={{
                              backgroundColor: colors.primaryLight,
                              borderWidth: 1,
                              borderColor: colors.primary,
                              borderRadius: 12,
                              padding: 16,
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "InstrumentSerif_400Regular",
                                fontSize: 16,
                                color: colors.text,
                                textAlign: "center",
                              }}
                            >
                              {step.formula}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Final Answer */}
              <View
                style={{
                  backgroundColor: colors.success,
                  borderRadius: 16,
                  padding: 20,
                  marginTop: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    color: colors.background,
                    marginBottom: 8,
                  }}
                >
                  FINAL ANSWER
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 18,
                    color: colors.background,
                  }}
                >
                  {solution.final_answer}
                </Text>
              </View>
            </View>
          )}

          {/* AI Tutor CTA */}
          <TouchableOpacity
            style={{
              backgroundColor: colors.card,
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: 16,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
            onPress={() => router.push(`/tutor/${id}`)}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <MessageCircle size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 4,
                }}
              >
                Need Help?
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                }}
              >
                Chat with AI tutor for personalized guidance
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
