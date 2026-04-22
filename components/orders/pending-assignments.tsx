import React from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { driverApi } from "@/lib/api-client";
import * as Haptics from "expo-haptics";

interface Assignment {
  _id: string;
  title: string;
  status: string;
  pickupLocation?: { address?: string; city?: string };
  deliveryLocation?: { address?: string; city?: string };
  pricing?: { proposedBudget?: number; currency?: string };
  pickupDate?: string;
}

interface PendingAssignmentsProps {
  assignments: Assignment[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function PendingAssignments({ assignments, isLoading, onRefresh }: PendingAssignmentsProps) {
  const colors = useColors();

  const handleAccept = async (orderId: string) => {
    try {
      await driverApi.acceptAssignment(orderId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRefresh();
    } catch (error) {
      console.error("Failed to accept assignment:", error);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await driverApi.rejectAssignment(orderId);
      onRefresh();
    } catch (error) {
      console.error("Failed to reject assignment:", error);
    }
  };

  if (isLoading) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-2">Loading assignments...</Text>
      </View>
    );
  }

  if (assignments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6 mt-10">
        <Text className="text-4xl mb-4">📭</Text>
        <Text className="text-lg font-semibold text-foreground text-center mb-2">
          No Pending Assignments
        </Text>
        <Text className="text-sm text-muted text-center">
          When dispatch assigns you a new load, it will appear here for you to accept or reject.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {assignments.map((assignment) => (
        <View key={assignment._id} className="bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-lg font-bold text-foreground">{assignment.title || "New Assignment"}</Text>
              {assignment.pickupDate && (
                <Text className="text-xs text-muted mt-1">
                  Scheduled: {new Date(assignment.pickupDate).toLocaleDateString()}
                </Text>
              )}
            </View>
            <View className="bg-warning/20 px-3 py-1 rounded-full">
              <Text className="text-warning text-xs font-bold">NEW</Text>
            </View>
          </View>

          {/* Locations */}
          <View className="gap-2 mb-4 bg-background p-3 rounded-lg border border-border">
            {assignment.pickupLocation?.address && (
              <View className="flex-row items-center gap-3">
                <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
                  <Text className="text-[10px]">⬆️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Pickup</Text>
                  <Text className="text-sm font-semibold text-foreground truncate">
                    {assignment.pickupLocation.city || assignment.pickupLocation.address}
                  </Text>
                </View>
              </View>
            )}
            
            <View className="ml-3 w-[1px] h-4 bg-border" />

            {assignment.deliveryLocation?.address && (
              <View className="flex-row items-center gap-3">
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                  <Text className="text-[10px]">⬇️</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Delivery</Text>
                  <Text className="text-sm font-semibold text-foreground truncate">
                    {assignment.deliveryLocation.city || assignment.deliveryLocation.address}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Compensation */}
          {assignment.pricing?.proposedBudget && (
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-sm text-muted">Compensation</Text>
              <Text className="text-xl font-bold text-success">
                {assignment.pricing.currency || "ETB"} {assignment.pricing.proposedBudget.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="flex-row gap-3 mt-2">
            <Pressable
              onPress={() => handleReject(assignment._id)}
              className="flex-1"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-surface border border-error rounded-lg py-3 items-center">
                <Text className="text-error font-semibold">Reject</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleAccept(assignment._id)}
              className="flex-[2]"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-primary rounded-lg py-3 items-center shadow-sm">
                <Text className="text-white font-bold">Accept Assignment</Text>
              </View>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
