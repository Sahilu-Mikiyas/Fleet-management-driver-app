import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView, Animated, Alert } from "react-native";
import { useRouter } from "expo-router";
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

function AssignmentCard({ assignment, index, onAccept, onReject }: {
  assignment: Assignment; index: number;
  onAccept: () => void; onReject: () => void;
}) {
  const router = useRouter();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 80 }).start();
  }, []);

  const date = assignment.pickupDate
    ? new Date(assignment.pickupDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <Pressable
        onPress={() => router.push({ pathname: "/(tabs)/trip-detail" as any, params: { tripId: assignment._id } })}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
      <View className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Orange accent top */}
        <View className="h-1 bg-warning/60" />
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-foreground">{assignment.title || "New Assignment"}</Text>
              {date && <Text className="text-xs text-muted mt-0.5">📅 Pickup {date}</Text>}
            </View>
            <View className="bg-warning/15 border border-warning/30 px-2.5 py-1 rounded-full">
              <Text className="text-warning text-[10px] font-bold">NEW</Text>
            </View>
          </View>

          {/* Route */}
          <View className="bg-background rounded-xl p-3 gap-2 mb-3 border border-border/50">
            {assignment.pickupLocation?.address && (
              <View className="flex-row items-center gap-2.5">
                <View className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 items-center justify-center">
                  <Text className="text-[9px] font-bold text-primary">A</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] text-muted uppercase tracking-wide">Pickup</Text>
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {assignment.pickupLocation.city || assignment.pickupLocation.address}
                  </Text>
                </View>
              </View>
            )}
            <View className="ml-3 w-px h-3 bg-border" />
            {assignment.deliveryLocation?.address && (
              <View className="flex-row items-center gap-2.5">
                <View className="w-6 h-6 rounded-full bg-success/15 border border-success/25 items-center justify-center">
                  <Text className="text-[9px] font-bold text-success">B</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] text-muted uppercase tracking-wide">Delivery</Text>
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {assignment.deliveryLocation.city || assignment.deliveryLocation.address}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Compensation */}
          {assignment.pricing?.proposedBudget ? (
            <View className="flex-row justify-between items-center mb-3 bg-success/8 border border-success/20 rounded-xl px-3 py-2">
              <Text className="text-xs text-muted font-medium">Compensation</Text>
              <Text className="text-lg font-bold text-success">
                {assignment.pricing.currency || "ETB"} {assignment.pricing.proposedBudget.toLocaleString()}
              </Text>
            </View>
          ) : null}

          {/* Actions */}
          <View className="flex-row gap-2.5">
            <Pressable
              onPress={onReject}
              style={({ pressed }) => [{ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-error/10 border border-error/30 rounded-xl py-3 items-center">
                <Text className="text-error font-bold text-sm">Decline</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [{ flex: 2, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-primary rounded-xl py-3 items-center">
                <Text className="text-white font-bold text-sm">Accept Assignment →</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}

export function PendingAssignments({ assignments, isLoading, onRefresh }: PendingAssignmentsProps) {
  const colors = useColors();

  const handleAccept = async (orderId: string) => {
    try {
      await driverApi.acceptAssignment(orderId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRefresh();
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Could not accept assignment.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleReject = async (orderId: string) => {
    Alert.alert("Decline Assignment", "Are you sure you want to decline this assignment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline", style: "destructive",
        onPress: async () => {
          try {
            await driverApi.rejectAssignment(orderId);
            onRefresh();
          } catch (e: any) {
            Alert.alert("Failed", e.message || "Could not decline assignment.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-3 text-sm">Loading assignments…</Text>
      </View>
    );
  }

  if (assignments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8 mt-8">
        <Text className="text-5xl mb-4">📭</Text>
        <Text className="text-lg font-bold text-foreground text-center mb-2">No Pending Assignments</Text>
        <Text className="text-sm text-muted text-center leading-5">
          When dispatch assigns you a new load it will appear here for you to accept or decline.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {assignments.map((a, i) => (
        <AssignmentCard
          key={a._id}
          assignment={a}
          index={i}
          onAccept={() => handleAccept(a._id)}
          onReject={() => handleReject(a._id)}
        />
      ))}
    </ScrollView>
  );
}
