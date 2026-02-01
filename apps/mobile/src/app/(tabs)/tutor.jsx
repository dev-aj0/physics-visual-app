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
import { useTheme } from "@/utils/theme";
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";
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
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const scrollViewRef = useRef(null);

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
    if (!inputText.trim()) return;

    const userMessage = { role: "user", content: inputText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);
    setStreamingMessage("");

    try {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const apiUrl = `${baseURL}/api/tutor/chat`;
      
      console.log("Sending message to:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          stream: true,
        }),
      });

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
                <Text
                  style={{
                    fontSize: 15,
                    color: "#FFFFFF",
                    lineHeight: 22,
                  }}
                >
                  {message.content}
                </Text>
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
            placeholder="Ask me anything about physics..."
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
              backgroundColor: inputText.trim() ? colors.secondary : colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
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
