import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Send } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useTheme } from "@/utils/theme";
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";
import FormattedText from "@/components/FormattedText";

export default function TutorChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const scrollViewRef = React.useRef(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    fetchConversation();
  }, [id]);

  const fetchConversation = async () => {
    try {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:5173";
      const apiUrl = `${baseURL}/api/tutor/get-conversation?problemId=${id}`;
      console.log("Fetching conversation from:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        console.error("Failed to fetch conversation:", response.status);
        return; // Start fresh if fetch fails
      }
      
      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      // Don't show error for initial fetch, just start fresh
    }
  };

  const handleFinish = useCallback((message) => {
    setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    setStreamingMessage("");
    setLoading(false);
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
    setStreamingMessage(""); // Clear any previous streaming message

    try {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:5173";
      const apiUrl = `${baseURL}/api/tutor/chat`;
      
      console.log("Sending message to:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          problemId: id,
          messages: [...messages, userMessage],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }

      // Handle streaming response
      handleStreamResponse(response);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", error.message || "Failed to send message. Make sure the API server is running.");
      setLoading(false);
      // Remove the user message if it failed
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  if (!fontsLoaded) {
    return null;
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
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
              color: colors.text,r
            }}
          >
            AI Physics Tutor
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            Ask questions, get hints
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !streamingMessage && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎓</Text>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 20,
                color: colors.text,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Welcome to AI Tutor!
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 15,
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 22,
                maxWidth: 280,
              }}
            >
              Ask me anything about your physics problem. I'm here to help you
              understand, not just give answers!
            </Text>
          </View>
        )}

        {messages.map((message, index) => (
          <View
            key={index}
            style={{
              flexDirection: "row",
              marginBottom: 16,
              alignItems: "flex-start",
            }}
          >
            {message.role === "assistant" && (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
            )}
            <View
              style={{
                flex: 1,
                backgroundColor:
                  message.role === "user" ? colors.primary : colors.card,
                borderWidth: message.role === "assistant" ? 1 : 0,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 14,
                marginLeft: message.role === "user" ? 48 : 0,
              }}
            >
              {message.role === "assistant" ? (
                <FormattedText
                  style={{
                    fontFamily: "Inter_400Regular",
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
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    color: colors.background,
                    lineHeight: 22,
                  }}
                >
                  {message.content}
                </Text>
              )}
            </View>
          </View>
        ))}

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
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 20 }}>🤖</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <FormattedText
                style={{
                  fontFamily: "Inter_400Regular",
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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              color: colors.text,
              marginRight: 12,
            }}
            placeholder="Ask a question..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: inputText.trim()
                ? colors.primary
                : colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Send size={20} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
