import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { driverApi } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";

interface TripHistoryItem {
  _id: string;
  title?: string;
  status: string;
  pickupLocation?: { address?: string; city?: string };
  deliveryLocation?: { address?: string; city?: string };
  pricing?: { proposedBudget?: number; currency?: string };
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; border: string }> = {
  DELIVERED:  { label: "Delivered",  bg: "bg-success/15", text: "text-success", border: "border-success/30" },
  CANCELLED:  { label: "Cancelled",  bg: "bg-error/15",   text: "text-error",   border: "border-error/30"   },
  IN_TRANSIT: { label: "In Transit", bg: "bg-primary/15", text: "text-primary", border: "border-primary/30" },
  COMPLETED:  { label: "Completed",  bg: "bg-success/15", text: "text-success", border: "border-success/30" },
};

function TripRow({ trip, index }: { trip: TripHistoryItem; index: number }) {
  const router = useRouter();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50 }).start();
  }, []);
  const s = STATUS_MAP[trip.status?.toUpperCase()] ?? { label: trip.status, bg: "bg-border/30", text: "text-muted", border: "border-border" };
  const date = new Date(trip.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <Pressable
        onPress={() => router.push({ pathname: "/(tabs)/trip-detail" as any, params: { tripId: trip._id } })}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
      <View className="bg-surface rounded-2xl border border-border overflow-hidden">
        <View className={`h-0.5 ${s.bg}`} />
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{trip.title || "Completed Trip"}</Text>
              <Text className="text-xs text-muted mt-0.5">{date}</Text>
            </View>
            <View className="items-end gap-1">
              <View className={`px-2 py-1 rounded-lg border ${s.bg} ${s.border}`}>
                <Text className={`text-[10px] font-bold ${s.text}`}>{s.label}</Text>
              </View>
              {trip.pricing?.proposedBudget ? (
                <Text className="text-sm font-bold text-success">ETB {trip.pricing.proposedBudget.toLocaleString()}</Text>
              ) : null}
            </View>
          </View>
          {(trip.pickupLocation?.address || trip.deliveryLocation?.address) && (
            <View className="bg-background rounded-xl p-2.5 gap-1.5 border border-border/50">
              {trip.pickupLocation?.address && (
                <View className="flex-row items-center gap-2">
                  <View className="w-4 h-4 rounded-full bg-primary/20 items-center justify-center"><Text className="text-[8px]">A</Text></View>
                  <Text className="text-xs text-muted flex-1" numberOfLines={1}>{trip.pickupLocation.city || trip.pickupLocation.address}</Text>
                </View>
              )}
              {trip.deliveryLocation?.address && (
                <View className="flex-row items-center gap-2">
                  <View className="w-4 h-4 rounded-full bg-success/20 items-center justify-center"><Text className="text-[8px]">B</Text></View>
                  <Text className="text-xs text-muted flex-1" numberOfLines={1}>{trip.deliveryLocation.city || trip.deliveryLocation.address}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}

export function HistoryContent() {
  const colors = useColors();
  const [trips, setTrips] = useState<TripHistoryItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "DELIVERED" | "CANCELLED">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await driverApi.getTripHistory();
      setTrips(res.data?.data?.trips ?? res.data?.data ?? []);
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filtered = trips.filter((t) => {
    const matchesStatus = filterStatus === "all" || t.status?.toUpperCase() === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (t.title || "").toLowerCase().includes(q)
      || (t.pickupLocation?.city || "").toLowerCase().includes(q)
      || (t.deliveryLocation?.city || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalEarned = filtered.filter(t => t.status?.toUpperCase() === "DELIVERED")
    .reduce((s, t) => s + (t.pricing?.proposedBudget || 0), 0);

  const FILTERS = [
    { key: "all",       label: "All" },
    { key: "DELIVERED", label: "Delivered" },
    { key: "CANCELLED", label: "Cancelled" },
  ] as const;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Navy header with stats */}
      <Animated.View
        className="bg-navy px-6 pt-8 pb-6"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
      >
        <Text className="text-white text-2xl font-bold">Trip History</Text>
        <Text className="text-white/60 text-sm mt-1">Your completed and cancelled trips</Text>
        <View className="flex-row gap-3 mt-4">
          <View className="bg-white/10 rounded-2xl px-4 py-2.5 flex-1 items-center">
            <Text className="text-white text-lg font-bold">{trips.length}</Text>
            <Text className="text-white/60 text-[10px]">Total</Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-2.5 flex-1 items-center">
            <Text className="text-success text-lg font-bold">{trips.filter(t => t.status?.toUpperCase() === "DELIVERED").length}</Text>
            <Text className="text-white/60 text-[10px]">Delivered</Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-2.5 flex-1 items-center">
            <Text className="text-success text-base font-bold" numberOfLines={1}>{totalEarned > 0 ? totalEarned.toLocaleString() : "—"}</Text>
            <Text className="text-white/60 text-[10px]">ETB</Text>
          </View>
        </View>
      </Animated.View>

      <View className="px-4 pt-4 gap-4">
        {/* Search */}
        <View className="flex-row items-center bg-surface border border-border rounded-2xl px-4 gap-2">
          <Text className="text-base">🔍</Text>
          <TextInput
            placeholder="Search trips…"
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 py-3 text-foreground text-sm"
            style={{ color: colors.foreground }}
          />
        </View>

        {/* Filter chips */}
        <View className="flex-row gap-2">
          {FILTERS.map(({ key, label }) => (
            <Pressable key={key} onPress={() => setFilterStatus(key)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <View className={`px-4 py-2 rounded-full border ${filterStatus === key ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                <Text className={`text-xs font-bold ${filterStatus === key ? "text-white" : "text-foreground"}`}>{label}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Trip list */}
        {isLoading ? (
          <View className="py-12 items-center"><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : filtered.length === 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-10 items-center">
            <Text className="text-4xl mb-3">🗺️</Text>
            <Text className="text-foreground font-bold text-base mb-1">No Trips Found</Text>
            <Text className="text-muted text-sm text-center">Try changing the filter or search term.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {filtered.map((t, i) => <TripRow key={t._id} trip={t} index={i} />)}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function HistoryScreen() {
  return <ScreenContainer className="p-0"><HistoryContent /></ScreenContainer>;
}
