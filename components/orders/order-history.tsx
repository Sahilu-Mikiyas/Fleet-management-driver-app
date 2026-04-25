import React from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface TripHistoryItem {
  _id: string;
  title?: string;
  status: string;
  pickupLocation?: { address?: string; city?: string };
  deliveryLocation?: { address?: string; city?: string };
  pricing?: { proposedBudget?: number; currency?: string };
  proofUploaded?: boolean;
  otpVerified?: boolean;
  createdAt: string;
}

interface OrderHistoryProps {
  trips: TripHistoryItem[];
  isLoading: boolean;
}

export function OrderHistory({ trips, isLoading }: OrderHistoryProps) {
  const colors = useColors();
  const router = useRouter();

  if (isLoading) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-2">Loading history...</Text>
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6 mt-10">
        <Text className="text-4xl mb-4">📋</Text>
        <Text className="text-lg font-semibold text-foreground text-center mb-2">
          No Past Trips
        </Text>
        <Text className="text-sm text-muted text-center">
          Completed or cancelled assignments will appear here.
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED": return "bg-success";
      case "CANCELLED": return "bg-error";
      default: return "bg-muted";
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {trips.map((trip) => (
        <Pressable
          key={trip._id}
          onPress={() => router.push("/(tabs)/history")}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-base font-bold text-foreground">
                  {trip.title || "Completed Trip"}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {new Date(trip.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View className="items-end gap-1">
                <View className={`${getStatusColor(trip.status)} px-2 py-0.5 rounded-full`}>
                  <Text className="text-white text-[10px] font-bold">{trip.status}</Text>
                </View>
                {trip.pricing?.proposedBudget && (
                  <Text className="text-sm font-bold text-success mt-1">
                    {trip.pricing.currency || "ETB"} {trip.pricing.proposedBudget.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>

            {/* Verification Badges */}
            {trip.status?.toUpperCase() === "DELIVERED" && (
              <View className="flex-row items-center gap-2 mb-2">
                <View className="bg-success/15 px-2 py-1 rounded-md flex-row items-center gap-1">
                  <Text className="text-[10px]">🔐</Text>
                  <Text className="text-success text-[10px] font-bold">OTP Verified</Text>
                </View>
                <View className="bg-blue-500/15 px-2 py-1 rounded-md flex-row items-center gap-1">
                  <Text className="text-[10px]">📸</Text>
                  <Text className="text-blue-500 text-[10px] font-bold">Proof Uploaded</Text>
                </View>
              </View>
            )}

            <View className="gap-1 mt-2 pt-3 border-t border-border">
              {trip.pickupLocation?.address && (
                <Text className="text-xs text-muted" numberOfLines={1}>
                  📍 {trip.pickupLocation.city || trip.pickupLocation.address}
                </Text>
              )}
              {trip.deliveryLocation?.address && (
                <Text className="text-xs text-muted" numberOfLines={1}>
                  🏁 {trip.deliveryLocation.city || trip.deliveryLocation.address}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      ))}
      <View className="h-12" />
    </ScrollView>
  );
}
