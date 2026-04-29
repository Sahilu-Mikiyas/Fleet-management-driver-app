import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, Text, View, Pressable, Alert, ActivityIndicator, Animated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { driverApi, paymentsApi } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface CommissionEntry {
  _id: string;
  amount: number;
  tripId?: string;
  orderId?: string;
  createdAt: string;
  status?: string;
}

function EntryRow({ entry, index }: { entry: CommissionEntry; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50,
    }).start();
  }, []);
  const date = new Date(entry.createdAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const statusColor = entry.status === "PAID" ? "text-success" : "text-warning";
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <View className="bg-surface rounded-2xl border border-border p-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 items-center justify-center mr-3">
          <Text className="text-base">💰</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">Trip Commission</Text>
          <Text className="text-xs text-muted mt-0.5">{dateStr} · {timeStr}</Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-bold text-success">+ETB {entry.amount?.toLocaleString() ?? "0"}</Text>
          {entry.status && <Text className={`text-[10px] font-bold uppercase mt-0.5 ${statusColor}`}>{entry.status}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

export function EarningsContent() {
  const colors = useColors();
  const [totalCommission, setTotalCommission] = useState(0);
  const [available, setAvailable] = useState(0);
  const [commissionHistory, setCommissionHistory] = useState<CommissionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  const fetchEarnings = useCallback(async () => {
    try {
      const [commissionRes, historyRes, walletRes] = await Promise.allSettled([
        driverApi.getCommission(),
        driverApi.getCommissionHistory(),
        driverApi.getWallet(),
      ]);
      if (commissionRes.status === "fulfilled") {
        const d = commissionRes.value.data?.data;
        setTotalCommission(d?.totalCommission ?? 0);
        setAvailable(d?.available ?? d?.totalCommission ?? 0);
      }
      if (historyRes.status === "fulfilled") {
        const d = historyRes.value.data?.data;
        setCommissionHistory(d?.commissions ?? d ?? []);
      }
      // Wallet balance takes precedence over commission available if present
      if (walletRes.status === "fulfilled") {
        const d = walletRes.value.data?.data;
        if (d?.available != null) setAvailable(d.available);
        if (d?.total != null) setTotalCommission(d.total);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  const handleRequestPayout = async () => {
    if (available <= 0) {
      Alert.alert("No Balance", "You don't have any available earnings to withdraw.");
      return;
    }
    Alert.alert(
      "Request Payout",
      `Withdraw ETB ${available.toLocaleString()} via Chapa?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          onPress: async () => {
            setIsProcessing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await paymentsApi.initialize("payout", available);
              Alert.alert("✅ Submitted", "Payout request sent. You'll receive it via Chapa shortly.");
              fetchEarnings();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Payout request failed.");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally { setIsProcessing(false); }
          },
        },
      ]
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Navy header */}
      <Animated.View
        className="bg-navy px-6 pt-8 pb-8"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
      >
        <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Earned</Text>
        {isLoading
          ? <ActivityIndicator color="white" style={{ alignSelf: "flex-start", marginVertical: 8 }} />
          : <Text className="text-white text-4xl font-bold">ETB {totalCommission.toLocaleString()}</Text>
        }
        <View className="flex-row gap-4 mt-5">
          <View className="bg-white/10 rounded-2xl px-4 py-3 flex-1">
            <Text className="text-white/60 text-[10px] uppercase tracking-widest">Available</Text>
            <Text className="text-success text-xl font-bold mt-0.5">ETB {available.toLocaleString()}</Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-3 flex-1">
            <Text className="text-white/60 text-[10px] uppercase tracking-widest">Trips</Text>
            <Text className="text-white text-xl font-bold mt-0.5">{commissionHistory.length}</Text>
          </View>
        </View>
      </Animated.View>

      <View className="px-4 pt-5 gap-4">
        {/* Payout button */}
        <Pressable
          onPress={handleRequestPayout}
          disabled={isProcessing || isLoading || available <= 0}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], opacity: (isProcessing || available <= 0) ? 0.5 : 1 }]}
        >
          <View className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2">
            <Text className="text-xl">💳</Text>
            <Text className="text-white font-bold text-base">
              {isProcessing ? "Processing…" : "Withdraw via Chapa"}
            </Text>
          </View>
        </Pressable>

        {/* Payout info note */}
        <View className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 flex-row items-center gap-3">
          <Text className="text-base">📅</Text>
          <Text className="text-foreground text-xs leading-5 flex-1">
            Payouts are processed every Friday. Funds arrive within 1–2 business days via Chapa.
          </Text>
        </View>

        {/* History */}
        <Text className="text-xs font-bold text-muted uppercase tracking-widest mt-2">Commission History</Text>
        {isLoading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : commissionHistory.length === 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-10 items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-foreground font-bold text-base mb-1">No Earnings Yet</Text>
            <Text className="text-muted text-sm text-center">Complete trips to start earning commissions.</Text>
          </View>
        ) : (
          <View className="gap-2">
            {commissionHistory.map((entry, i) => <EntryRow key={entry._id} entry={entry} index={i} />)}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function EarningsScreen() {
  return <ScreenContainer className="p-0"><EarningsContent /></ScreenContainer>;
}
