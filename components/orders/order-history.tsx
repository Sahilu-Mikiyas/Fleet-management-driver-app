import React, { useRef, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Animated } from "react-native";
import { useColors } from "@/hooks/use-colors";

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

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  DELIVERED:  { bg: "bg-success/15", text: "text-success", border: "border-success/30", icon: "✅" },
  CANCELLED:  { bg: "bg-error/15",   text: "text-error",   border: "border-error/30",   icon: "❌" },
  IN_TRANSIT: { bg: "bg-primary/15", text: "text-primary", border: "border-primary/30", icon: "🚚" },
  COMPLETED:  { bg: "bg-success/15", text: "text-success", border: "border-success/30", icon: "✅" },
};

function TripCard({ trip, index }: { trip: TripHistoryItem; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 90,
      friction: 18,
      delay: index * 60,
    }).start();
  }, []);

  const s = STATUS_STYLES[trip.status?.toUpperCase()] ?? {
    bg: "bg-muted/15", text: "text-muted", border: "border-border", icon: "📦",
  };

  const dateStr = new Date(trip.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <View className="bg-surface rounded-2xl border border-border overflow-hidden">
        {/* Top accent bar */}
        <View className={`h-1 ${s.bg}`} />

        <View className="p-4">
          {/* Header row */}
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1 mr-3">
              <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                {trip.title || "Completed Trip"}
              </Text>
              <Text className="text-xs text-muted mt-0.5">{dateStr}</Text>
            </View>

            <View className={`px-2.5 py-1 rounded-lg border ${s.bg} ${s.border} flex-row items-center gap-1`}>
              <Text className="text-[10px]">{s.icon}</Text>
              <Text className={`text-[10px] font-bold ${s.text}`}>{trip.status}</Text>
            </View>
          </View>

          {/* Route */}
          {(trip.pickupLocation?.address || trip.deliveryLocation?.address) && (
            <View className="bg-background rounded-xl p-3 gap-2 mb-3 border border-border/50">
              {trip.pickupLocation?.address && (
                <View className="flex-row items-center gap-2">
                  <View className="w-5 h-5 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-[9px]">A</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1" numberOfLines={1}>
                    {trip.pickupLocation.city || trip.pickupLocation.address}
                  </Text>
                </View>
              )}
              {trip.pickupLocation?.address && trip.deliveryLocation?.address && (
                <View className="ml-2.5 w-px h-3 bg-border" />
              )}
              {trip.deliveryLocation?.address && (
                <View className="flex-row items-center gap-2">
                  <View className="w-5 h-5 rounded-full bg-success/20 items-center justify-center">
                    <Text className="text-[9px]">B</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1" numberOfLines={1}>
                    {trip.deliveryLocation.city || trip.deliveryLocation.address}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Footer: earning + badges */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row gap-2">
              {trip.status?.toUpperCase() === "DELIVERED" && (
                <>
                  <View className="bg-success/10 px-2 py-1 rounded-md flex-row items-center gap-1 border border-success/20">
                    <Text className="text-[9px] text-success font-bold">🔐 OTP</Text>
                  </View>
                  <View className="bg-primary/10 px-2 py-1 rounded-md flex-row items-center gap-1 border border-primary/20">
                    <Text className="text-[9px] text-primary font-bold">📸 Proof</Text>
                  </View>
                </>
              )}
            </View>
            {trip.pricing?.proposedBudget ? (
              <Text className="text-base font-bold text-success">
                {trip.pricing.currency || "ETB"} {trip.pricing.proposedBudget.toLocaleString()}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export function OrderHistory({ trips, isLoading }: OrderHistoryProps) {
  const colors = useColors();

  if (isLoading) {
    return (
      <View className="py-12 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-3 text-sm">Loading history…</Text>
      </View>
    );
  }

  if (trips.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8 mt-10">
        <Text className="text-5xl mb-4">🗂️</Text>
        <Text className="text-lg font-bold text-foreground text-center mb-2">No Past Trips</Text>
        <Text className="text-sm text-muted text-center leading-5">
          Completed and cancelled assignments will appear here.
        </Text>
      </View>
    );
  }

  const delivered = trips.filter((t) => t.status?.toUpperCase() === "DELIVERED").length;
  const totalEarned = trips.reduce((sum, t) => sum + (t.pricing?.proposedBudget ?? 0), 0);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>

      {/* Summary bar */}
      <View className="bg-navy rounded-2xl px-4 py-3 flex-row gap-3">
        <View className="flex-1 items-center">
          <Text className="text-white text-lg font-bold">{trips.length}</Text>
          <Text className="text-white/60 text-[10px]">Total</Text>
        </View>
        <View className="w-px bg-white/10" />
        <View className="flex-1 items-center">
          <Text className="text-white text-lg font-bold">{delivered}</Text>
          <Text className="text-white/60 text-[10px]">Delivered</Text>
        </View>
        <View className="w-px bg-white/10" />
        <View className="flex-1 items-center">
          <Text className="text-success text-lg font-bold">{totalEarned > 0 ? totalEarned.toLocaleString() : "—"}</Text>
          <Text className="text-white/60 text-[10px]">ETB Earned</Text>
        </View>
      </View>

      {trips.map((trip, i) => (
        <TripCard key={trip._id} trip={trip} index={i} />
      ))}

      <View className="h-8" />
    </ScrollView>
  );
}
