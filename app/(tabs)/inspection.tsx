import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  checked: boolean;
}

export function InspectionContent() {
  const [inspectionType, setInspectionType] = useState<"pre" | "post">("pre");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "lights",
      title: "Lights & Signals",
      description: "Check headlights, taillights, brake lights, and turn signals",
      checked: false,
    },
    {
      id: "mirrors",
      title: "Mirrors",
      description: "Verify all mirrors are clean and properly adjusted",
      checked: false,
    },
    {
      id: "tires",
      title: "Tires",
      description: "Check tire pressure and condition for wear",
      checked: false,
    },
    {
      id: "fuel",
      title: "Fuel Level",
      description: "Ensure sufficient fuel for the trip",
      checked: false,
    },
    {
      id: "brakes",
      title: "Brakes",
      description: "Test brake responsiveness and condition",
      checked: false,
    },
    {
      id: "wipers",
      title: "Wipers",
      description: "Check windshield wipers and fluid",
      checked: false,
    },
    {
      id: "interior",
      title: "Interior Condition",
      description: "Verify cleanliness and no damage",
      checked: false,
    },
    {
      id: "seatbelts",
      title: "Seatbelts",
      description: "Test all seatbelts for proper function",
      checked: false,
    },
  ]);

  const toggleItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleSubmit = () => {
    const unchecked = checklist.filter((item) => !item.checked);
    if (unchecked.length > 0) {
      Alert.alert(
        "Incomplete Inspection",
        `Please complete all items before submitting. ${unchecked.length} items remaining.`
      );
      return;
    }

    Alert.alert(
      "Inspection Complete",
      `${inspectionType === "pre" ? "Pre-trip" : "Post-trip"} inspection submitted successfully!`
    );
    setChecklist(checklist.map((item) => ({ ...item, checked: false })));
  };

  const completedCount = checklist.filter((item) => item.checked).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Vehicle Inspection</Text>
          <Text className="text-white text-sm opacity-80">
            {inspectionType === "pre" ? "Pre-trip" : "Post-trip"} Checklist
          </Text>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Inspection Type Selection */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Inspection Type</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setInspectionType("pre")}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                className="flex-1"
              >
                <View
                  className={`p-3 rounded-lg border ${
                    inspectionType === "pre"
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`font-semibold text-center ${
                      inspectionType === "pre" ? "text-white" : "text-foreground"
                    }`}
                  >
                    Pre-Trip
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setInspectionType("post")}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                className="flex-1"
              >
                <View
                  className={`p-3 rounded-lg border ${
                    inspectionType === "post"
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    className={`font-semibold text-center ${
                      inspectionType === "post" ? "text-white" : "text-foreground"
                    }`}
                  >
                    Post-Trip
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Progress */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-foreground">Progress</Text>
              <Text className="text-lg font-bold text-primary">
                {completedCount}/{checklist.length}
              </Text>
            </View>
            <View className="w-full h-2 bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <Text className="text-xs text-muted mt-2">{progressPercent}% Complete</Text>
          </View>

          {/* Checklist Items */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Inspection Items</Text>
            <View className="gap-3">
              {checklist.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <View
                    className={`p-4 rounded-lg border flex-row items-start gap-3 ${
                      item.checked
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "bg-surface border-border"
                    }`}
                  >
                    <View
                      className={`w-6 h-6 rounded border-2 items-center justify-center mt-1 ${
                        item.checked
                          ? "bg-success border-success"
                          : "border-border"
                      }`}
                    >
                      {item.checked && <Text className="text-white font-bold text-sm">✓</Text>}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          item.checked ? "text-success" : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-xs text-muted mt-1">{item.description}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Notes Section */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Additional Notes</Text>
            <View className="bg-muted/10 rounded-lg p-3 border border-border">
              <Text className="text-sm text-muted">
                Add any issues or observations found during inspection (e.g., "Dent on left side", "Wiper blade needs replacement")
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={completedCount < checklist.length}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed && completedCount === checklist.length ? 0.97 : 1 }],
                opacity: completedCount === checklist.length ? 1 : 0.5,
              },
            ]}
          >
            <View className="bg-primary rounded-lg py-4 items-center">
              <Text className="text-base font-semibold text-white">
                {completedCount === checklist.length
                  ? "Submit Inspection"
                  : `Complete All Items (${checklist.length - completedCount} remaining)`}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
  );
}

export default function InspectionScreen() {
  return (
    <ScreenContainer className="p-0">
      <InspectionContent />
    </ScreenContainer>
  );
}
