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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Send, Camera } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useTheme } from "@/utils/theme";
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";
import useUpload from "@/utils/useUpload";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import FormattedText from "@/components/FormattedText";

export default function TutorChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const scrollViewRef = React.useRef(null);
  const [upload] = useUpload();

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
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:4000";
      const apiUrl = `${baseURL}/api/tutor/get-conversation?problemId=${id}`;
      console.log("Fetching conversation from:", apiUrl);
      
      const response = await fetchWithTimeout(apiUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }, 15000);

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
        conversationId,
        problemId: id,
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
              color: colors.text,
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
                      fontFamily: "Inter_400Regular",
                      fontSize: 15,
                      color: colors.background,
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
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                Thinking...
              </Text>
            </View>
          </View>
        )}

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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              marginRight: 8,
            }}
          >
            <Camera size={20} color={colors.textSecondary} />
          </TouchableOpacity>
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
            placeholder="Ask a question or attach a diagram..."
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
              backgroundColor:
                inputText.trim() || pendingImage ? colors.primary : colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleSend}
            disabled={(!inputText.trim() && !pendingImage) || loading}
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
