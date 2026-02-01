import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Clock, ChevronRight, Search } from "lucide-react-native";
import { useState } from "react";

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL || "http://localhost:5173";
      const response = await fetch(`${baseURL}/api/problems/list`);
      if (!response.ok) throw new Error("Failed to fetch problems");
      return response.json();
    },
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredProblems = (data?.problems || []).filter((problem) => {
    const problemText = problem.problem_text || "";
    return problemText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filters = [
    { id: "all", label: "All", icon: "📚" },
    { id: "mechanics", label: "Mechanics", icon: "⚙️" },
    { id: "energy", label: "Energy", icon: "⚡" },
    { id: "waves", label: "Waves", icon: "〰️" },
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
        {/* Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: "#1E293B",
              marginBottom: 8,
            }}
          >
            My Problems
          </Text>
          <Text style={{ fontSize: 16, color: "#64748B" }}>
            Review and continue your physics problems
          </Text>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#E8F1F8",
            }}
          >
            <Search size={20} color="#94A3B8" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 15,
                color: "#1E293B",
              }}
              placeholder="Search problems..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Chips */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            style={{ flexGrow: 0 }}
          >
            {[
              { id: "all", label: "All" },
              { id: "inProgress", label: "In Progress" },
              { id: "completed", label: "Completed" },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                style={{
                  backgroundColor:
                    selectedFilter === filter.id ? "#FF9B7A" : "#F1F5F9",
                  borderRadius: 20,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderWidth: 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: selectedFilter === filter.id ? "#FFFFFF" : "#64748B",
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Problems List */}
        <View style={{ paddingHorizontal: 24 }}>
          {isLoading && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#5B9ED6" />
            </View>
          )}

          {error && (
            <View
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: "#FEE2E2",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#DC2626", textAlign: "center" }}
              >
                Failed to load problems
              </Text>
            </View>
          )}

          {filteredProblems.length === 0 && !isLoading && (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#E8F1F8",
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#1E293B",
                  marginBottom: 8,
                }}
              >
                {searchQuery ? "No matches found" : "No problems yet"}
              </Text>
              <Text
                style={{ fontSize: 15, color: "#64748B", textAlign: "center" }}
              >
                {searchQuery
                  ? "Try a different search term"
                  : "Upload your first physics problem to get started"}
              </Text>
            </View>
          )}

          {filteredProblems.map((problem, index) => {
            // Determine category based on problem text
            const text = (problem.problem_text || "").toLowerCase();
            let category = "General Physics";
            if (text.includes("force") || text.includes("friction") || text.includes("newton")) {
              category = "Forces & Motion";
            } else if (text.includes("projectile") || text.includes("velocity") || text.includes("trajectory")) {
              category = "Projectile Motion";
            } else if (text.includes("energy") || text.includes("work") || text.includes("kinetic")) {
              category = "Energy & Work";
            } else if (text.includes("momentum") || text.includes("collision")) {
              category = "Momentum";
            } else if (text.includes("circular") || text.includes("rotation")) {
              category = "Circular Motion";
            }
            
            const categoryColors = {
              "Forces & Motion": "#FFF7ED",
              "Projectile Motion": "#EFF6FF",
              "Energy & Work": "#F0FDF4",
              "Momentum": "#FDF4FF",
              "Circular Motion": "#FEF3C7",
              "General Physics": "#F1F5F9",
            };
            const categoryTextColors = {
              "Forces & Motion": "#C2410C",
              "Projectile Motion": "#1E40AF",
              "Energy & Work": "#166534",
              "Momentum": "#7C3AED",
              "Circular Motion": "#B45309",
              "General Physics": "#64748B",
            };
            const isCompleted = problem.has_solution;
            const hasVisuals = (problem.visual_count || 0) > 0;
            
            return (
              <TouchableOpacity
                key={problem.id}
                onPress={() => router.push(`/problem/${problem.id}`)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#E8F1F8",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                      width: "100%",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: categoryColors[category] || "#F1F5F9",
                        borderRadius: 6,
                        paddingVertical: 4,
                        paddingHorizontal: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: categoryTextColors[category] || "#64748B",
                        }}
                      >
                        {category}
                      </Text>
                    </View>
                    {isCompleted && (
                      <Text style={{ fontSize: 16, color: "#5B9ED6" }}>✓</Text>
                    )}
                    {hasVisuals && (
                      <Text style={{ fontSize: 14, color: "#10B981" }}>📊</Text>
                    )}
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#1E293B",
                    marginBottom: 12,
                    lineHeight: 22,
                  }}
                  numberOfLines={2}
                >
                  {problem.problem_text || "A 5kg block is pushed up an inclined plane at 30°..."}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Clock size={14} color="#94A3B8" />
                  <Text style={{ fontSize: 13, color: "#94A3B8" }}>
                    {formatDate(problem.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
