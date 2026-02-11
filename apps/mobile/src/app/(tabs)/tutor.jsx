import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { Platform as RNPlatform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Camera } from "lucide-react-native";
import { useTheme } from "@/utils/theme";
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";
import useUpload from "@/utils/useUpload";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import FormattedText from "@/components/FormattedText";

// SF Symbols icon component wrapper
function SFSymbol({ name, color, size = 24 }) {
  if (RNPlatform.OS === "ios") {
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
  const iconMap = {
    "robot": "🤖",
    "lightbulb.fill": "💡",
    "questionmark": "❓",
    "paperplane.fill": "✈️",
  };
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: size }}>{iconMap[name] || "•"}</Text>
    </View>
  );
}

export default function TutorScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const scrollViewRef = useRef(null);
  const [upload] = useUpload();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Gallery permission is required to attach images.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPendingImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleFinish = useCallback((message) => {
    if (message) {
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    }
    setStreamingMessage("");
    setLoading(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !pendingImage) return;

    let imageUrl = null;
    if (pendingImage) {
      setLoading(true);
      const result = await upload({
        reactNativeAsset: {
          uri: pendingImage,
          name: "diagram.jpg",
          mimeType: "image/jpeg",
        },
      });
      if (result.error) {
        Alert.alert("Upload failed", result.error);
        setLoading(false);
        return;
      }
      imageUrl = result.url;
      setPendingImage(null);
    }

    const userMessage = {
      role: "user",
      content: text || "What can you tell me about this diagram?",
      imageUrl,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);
    setStreamingMessage("");

    try {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const apiUrl = `${baseURL}/api/tutor/chat`;

      const payload = {
        messages: [...messages, { role: "user", content: userMessage.content }],
        stream: true,
      };
      if (imageUrl) payload.imageUrl = imageUrl;

      const response = await fetchWithTimeout(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }, 60000);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      handleStreamResponse(response);

    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Make sure the API server is running on port 4000.");
      setLoading(false);
      // Remove the user message if it failed
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const suggestedQuestions = [
    {
      icon: "lightbulb.fill",
      text: "Explain Newton's laws",
      color: colors.primary,
    },
    {
      icon: "questionmark",
      text: "What is kinetic energy?",
      color: colors.primary,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <SFSymbol name="robot" color="#FFFFFF" size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.text,
              marginBottom: 2,
            }}
          >
            AI Physics Tutor
          </Text>
          <Text style={{ fontSize: 14, color: colors.primary }}>
            Online • Ready to help
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !streamingMessage && (
          <>
            {/* Welcome Message */}
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 24,
                alignSelf: "flex-start",
                maxWidth: "85%",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: colors.text,
                  lineHeight: 22,
                }}
              >
                Hi! I'm your AI Physics Tutor. I can help you understand
                concepts, solve problems step-by-step, and explain formulas. What would you like to learn about today?
              </Text>
            </View>

            {/* Suggested Questions */}
            <View style={{ marginTop: 8 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 12,
                }}
              >
                Try asking:
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {suggestedQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setInputText(question.text)}
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <SFSymbol
                      name={question.icon}
                      color={question.color}
                      size={18}
                    />
                    <Text
                      style={{
                        fontSize: 15,
                        color: colors.text,
                        fontWeight: "500",
                      }}
                    >
                      {question.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Chat Messages */}
        {messages.map((message, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              marginBottom: 16,
              alignItems: "flex-start",
              justifyContent:
                message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {message.role === "assistant" && (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <SFSymbol name="robot" color="#FFFFFF" size={18} />
              </View>
            )}
            <View
              style={{
                flex: message.role === "user" ? 0 : 1,
                maxWidth: "80%",
                backgroundColor:
                  message.role === "user" ? colors.secondary : colors.card,
                borderRadius: 16,
                padding: 14,
                borderWidth: message.role === "assistant" ? 1 : 0,
                borderColor: colors.border,
              }}
            >
              {message.role === "assistant" ? (
                <FormattedText
                  style={{
                    fontSize: 15,
                    color: colors.text,
                    lineHeight: 22,
                  }}
                  colors={colors}
                >
                  {message.content}
                </FormattedText>
              ) : (
                <>
                  {message.imageUrl && (
                    <Image
                      source={{ uri: message.imageUrl }}
                      style={{
                        width: "100%",
                        height: 120,
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                      contentFit="cover"
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#FFFFFF",
                      lineHeight: 22,
                    }}
                  >
                    {message.content}
                  </Text>
                </>
              )}
            </View>
          </View>
        ))}

        {/* Streaming Message */}
        {streamingMessage && (
          <View
            style={{
              flexDirection: "row",
              marginBottom: 16,
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <SFSymbol name="robot" color="#FFFFFF" size={18} />
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <FormattedText
                style={{
                  fontSize: 15,
                  color: colors.text,
                  lineHeight: 22,
                }}
                colors={colors}
              >
                {streamingMessage}
              </FormattedText>
            </View>
          </View>
        )}

        {/* Loading indicator when waiting but no streaming yet */}
        {loading && !streamingMessage && (
          <View
            style={{
              flexDirection: "row",
              marginBottom: 16,
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <SFSymbol name="robot" color="#FFFFFF" size={18} />
            </View>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {pendingImage && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Image
              source={{ uri: pendingImage }}
              style={{ width: 56, height: 56, borderRadius: 8 }}
              contentFit="cover"
            />
            <TouchableOpacity
              onPress={() => setPendingImage(null)}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: colors.error, fontSize: 14 }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={pickImage}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Camera size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.text,
              maxHeight: 100,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            placeholder="Ask me anything or attach a diagram..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                inputText.trim() || pendingImage ? colors.secondary : colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleSend}
            disabled={(!inputText.trim() && !pendingImage) || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <SFSymbol
                name="paperplane.fill"
                color={inputText.trim() ? "#FFFFFF" : colors.textSecondary}
                size={20}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
