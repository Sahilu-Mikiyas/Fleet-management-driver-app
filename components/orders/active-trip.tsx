import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { driverApi } from "@/lib/api-client";
import { useRouter } from "expo-router";
import { DeliveryVerificationModal } from "./delivery-verification-modal";

interface Assignment {
  _id: string;
  title: string;
  status: string;
  pickupLocation?: { address?: string; city?: string };
  deliveryLocation?: { address?: string; city?: string };
  cargo?: { description?: string; weightKg?: number };
}

interface ActiveTripProps {
  assignment: Assignment | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ActiveTrip({ assignment, isLoading, onRefresh }: ActiveTripProps) {
  const colors = useColors();
  const router = useRouter();
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);

  const handleUpdateMilestone = async (action: "start" | "arrive") => {
    if (!assignment) return;
    try {
      if (action === "start") {
        await driverApi.startAssignment(assignment._id);
      } else if (action === "arrive") {
        await driverApi.arriveAtPickup(assignment._id);
      }
      onRefresh();
    } catch (error) {
      console.error(`Failed to ${action} assignment:`, error);
    }
  };

  if (isLoading) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-2">Loading active trip...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 items-center justify-center p-6 mt-10">
        <Text className="text-4xl mb-4">🛣️</Text>
        <Text className="text-lg font-semibold text-foreground text-center mb-2">
          No Active Trip
        </Text>
        <Text className="text-sm text-muted text-center">
          You are not currently executing any trips. Accept a pending assignment or bid on a marketplace load to start driving.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Status Banner */}
        <View className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex-row items-center justify-between">
          <View>
            <Text className="text-primary font-bold text-lg">ON DUTY: IN TRANSIT</Text>
            <Text className="text-sm text-foreground font-semibold mt-1">{assignment.title || "Trip in progress"}</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-xl">🚚</Text>
          </View>
        </View>

        {/* Itinerary */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-sm font-bold text-muted mb-4 uppercase">Current Itinerary</Text>
          
          <View className="gap-0">
            {/* Pickup */}
            <View className="flex-row gap-4">
              <View className="items-center">
                <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center border-2 border-blue-500">
                  <Text className="text-xs">1</Text>
                </View>
                <View className="w-[2px] h-12 bg-border my-1" />
              </View>
              <View className="flex-1 pb-6">
                <Text className="text-sm text-muted font-semibold">PICKUP</Text>
                <Text className="text-base text-foreground font-bold mt-1">
                  {assignment.pickupLocation?.address || "Unknown Address"}
                </Text>
                <Text className="text-sm text-muted">{assignment.pickupLocation?.city}</Text>
              </View>
            </View>

            {/* Delivery */}
            <View className="flex-row gap-4">
              <View className="items-center">
                <View className="w-8 h-8 rounded-full bg-surface items-center justify-center border-2 border-border">
                  <Text className="text-xs">2</Text>
                </View>
              </View>
              <View className="flex-1 pb-2">
                <Text className="text-sm text-muted font-semibold">DELIVERY</Text>
                <Text className="text-base text-foreground font-bold mt-1">
                  {assignment.deliveryLocation?.address || "Unknown Address"}
                </Text>
                <Text className="text-sm text-muted">{assignment.deliveryLocation?.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cargo Quick Info */}
        {assignment.cargo && (
          <View className="bg-surface rounded-xl p-4 border border-border flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-muted">Cargo Content</Text>
              <Text className="text-sm font-semibold text-foreground mt-1">
                {assignment.cargo.description || "General Freight"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted">Weight</Text>
              <Text className="text-sm font-semibold text-foreground mt-1">
                {assignment.cargo.weightKg ? `${assignment.cargo.weightKg} kg` : "—"}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View className="gap-3 mt-4">
          {/* Navigation Action */}
          <Pressable
            className="bg-surface border border-primary/30 rounded-xl py-4 flex-row items-center justify-center gap-2"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-lg">🗺️</Text>
            <Text className="text-primary font-bold text-base">Open Navigation</Text>
          </Pressable>

          {/* Workflow Action */}
          <Pressable
            onPress={() => handleUpdateMilestone("arrive")}
            className="bg-primary rounded-xl py-4 flex-row items-center justify-center shadow-sm"
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Text className="text-white font-bold text-base text-center">
              Report Arrival
            </Text>
          </Pressable>

          {/* Proof of Delivery / Complete Action */}
          <Pressable
            onPress={() => setIsVerificationModalVisible(true)}
            className="bg-success rounded-xl py-4 flex-row items-center justify-center shadow-sm mt-2"
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <Text className="text-white font-bold text-base text-center">
              📸 Complete & Upload POD
            </Text>
          </Pressable>
        </View>
        
        {/* Spacing for bottom sheet safe area */}
        <View className="h-12" />
      </ScrollView>

      <DeliveryVerificationModal
        tripId={assignment._id}
        isVisible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
        onSuccess={() => {
          setIsVerificationModalVisible(false);
          onRefresh();
        }}
      />
    </>
  );
}
