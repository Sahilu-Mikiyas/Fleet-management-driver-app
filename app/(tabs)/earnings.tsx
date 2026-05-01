import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView, Text, View, Pressable, Alert, ActivityIndicator,
  Animated, Modal,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { driverApi, paymentsApi } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface WalletData {
  available?: number;
  total?: number;
  totalLifetimeEarnings?: number;
  lastPayout?: number;
  accountStatus?: string;
  currency?: string;
  pendingAmount?: number;
}

interface Transaction {
  _id: string;
  tx_ref: string;
  status: string;
  amount: number;
  currency?: string;
  orderId?: string;
  type?: string;
  description?: string;
  createdAt: string;
}

const TX_STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  PAID:    { bg: "bg-success/10", text: "text-success", border: "border-success/25" },
  SUCCESS: { bg: "bg-success/10", text: "text-success", border: "border-success/25" },
  PENDING: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/25" },
  FAILED:  { bg: "bg-error/10",   text: "text-error",   border: "border-error/25"   },
};
function txStyle(status: string) {
  return TX_STATUS_STYLE[status?.toUpperCase()] ?? TX_STATUS_STYLE.PENDING;
}

function TransactionRow({ tx, index, onPress }: { tx: Transaction; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50 }).start();
  }, []);
  const s = txStyle(tx.status);
  const date = new Date(tx.createdAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
        <View className="bg-surface rounded-2xl border border-border p-4 flex-row items-center">
          <View className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 items-center justify-center mr-3">
            <Text className="text-base">💰</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {tx.description || tx.type || "Transaction"}
            </Text>
            <Text className="text-xs text-muted mt-0.5">{dateStr} · {timeStr}</Text>
            <Text className="text-[10px] text-muted/70 mt-0.5" numberOfLines={1}>Ref: {tx.tx_ref}</Text>
          </View>
          <View className="items-end gap-1">
            <Text className="text-base font-bold text-success">
              +{tx.currency || "ETB"} {(tx.amount ?? 0).toLocaleString()}
            </Text>
            <View className={`px-2 py-0.5 rounded-full border ${s.bg} ${s.border}`}>
              <Text className={`text-[9px] font-bold uppercase ${s.text}`}>{tx.status}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function TransactionDetailModal({ txRef, onClose }: { txRef: string | null; onClose: () => void }) {
  const colors = useColors();
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!txRef) { setDetail(null); return; }
    setIsLoading(true);
    paymentsApi.getTransaction(txRef)
      .then(res => {
        const d = res.data?.data ?? res.data;
        setDetail(d?.transaction ?? d);
      })
      .catch(() => setDetail(null))
      .finally(() => setIsLoading(false));
  }, [txRef]);

  const s = detail ? txStyle(detail.status) : TX_STATUS_STYLE.PENDING;

  return (
    <Modal visible={!!txRef} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl pt-6 pb-10 px-6">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-bold text-foreground">Transaction Detail</Text>
            <Pressable onPress={onClose}>
              <View className="w-8 h-8 bg-surface rounded-full items-center justify-center border border-border">
                <Text className="text-foreground font-bold text-xs">✕</Text>
              </View>
            </Pressable>
          </View>

          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : !detail ? (
            <View className="py-12 items-center">
              <Text className="text-4xl mb-3">⚠️</Text>
              <Text className="text-foreground font-bold">Could not load details</Text>
            </View>
          ) : (
            <View className="gap-3">
              <View className="bg-success/10 border border-success/20 rounded-2xl p-5 items-center">
                <Text className="text-xs font-bold text-success uppercase tracking-widest mb-1">Amount</Text>
                <Text className="text-3xl font-bold text-success">
                  {detail.currency || "ETB"} {(detail.amount ?? 0).toLocaleString()}
                </Text>
                <View className={`mt-2 px-3 py-1 rounded-full border ${s.bg} ${s.border}`}>
                  <Text className={`text-xs font-bold uppercase ${s.text}`}>{detail.status}</Text>
                </View>
              </View>

              {[
                { label: "Reference",   value: detail.tx_ref },
                { label: "Type",        value: detail.type || "—" },
                { label: "Description", value: detail.description || "—" },
                { label: "Order ID",    value: typeof detail.orderId === "string" ? detail.orderId : "—" },
                { label: "Date",        value: new Date(detail.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
              ].map(({ label, value }) => (
                <View key={label} className="flex-row justify-between items-start py-2.5 border-b border-border/50">
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest">{label}</Text>
                  <Text className="text-sm font-semibold text-foreground flex-1 text-right ml-4" numberOfLines={2}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function EarningsContent() {
  const colors = useColors();
  const [wallet, setWallet] = useState<WalletData>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTxRef, setSelectedTxRef] = useState<string | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, txRes] = await Promise.allSettled([
        driverApi.getWallet(),
        paymentsApi.getTransactions(),
      ]);
      if (walletRes.status === "fulfilled") {
        const d = walletRes.value.data?.data ?? walletRes.value.data;
        setWallet(d?.wallet ?? d ?? {});
      }
      if (txRes.status === "fulfilled") {
        const d = txRes.value.data?.data ?? txRes.value.data;
        const list = d?.transactions ?? d ?? [];
        setTransactions(Array.isArray(list) ? list : []);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const available = wallet.available ?? 0;
  const currency  = wallet.currency || "ETB";
  const totalEarned = wallet.total ?? wallet.totalLifetimeEarnings ?? 0;
  const lastPayout  = wallet.lastPayout ?? 0;
  const pendingAmount = wallet.pendingAmount ?? 0;

  const handleRequestPayout = () => {
    if (available <= 0) {
      Alert.alert("No Balance", "You don't have any available balance to withdraw.");
      return;
    }
    Alert.alert(
      "Request Payout",
      `Withdraw ${currency} ${available.toLocaleString()} via Chapa?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          onPress: async () => {
            setIsProcessing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await driverApi.requestPayout(available, currency);
              Alert.alert("✅ Submitted", "Payout request sent. Funds will arrive via Chapa shortly.");
              fetchData();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Payout request failed.");
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
          : <Text className="text-white text-4xl font-bold">{currency} {totalEarned.toLocaleString()}</Text>
        }
        {wallet.accountStatus && (
          <View className="mt-2 self-start bg-success/20 border border-success/40 px-3 py-1 rounded-full">
            <Text className="text-success text-[10px] font-bold uppercase tracking-wide">✓ {wallet.accountStatus}</Text>
          </View>
        )}
        <View className="flex-row gap-3 mt-5 flex-wrap">
          <View className="bg-white/10 rounded-2xl px-4 py-3 flex-1">
            <Text className="text-white/60 text-[10px] uppercase tracking-widest">Available</Text>
            <Text className="text-success text-xl font-bold mt-0.5">{currency} {available.toLocaleString()}</Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-3 flex-1">
            <Text className="text-white/60 text-[10px] uppercase tracking-widest">Last Payout</Text>
            <Text className="text-white text-xl font-bold mt-0.5">{currency} {lastPayout.toLocaleString()}</Text>
          </View>
          {pendingAmount > 0 && (
            <View className="bg-white/10 rounded-2xl px-4 py-3 flex-1">
              <Text className="text-white/60 text-[10px] uppercase tracking-widest">Pending</Text>
              <Text className="text-warning text-xl font-bold mt-0.5">{currency} {pendingAmount.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View className="px-4 pt-5 gap-4">
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

        <View className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 flex-row items-center gap-3">
          <Text className="text-base">📅</Text>
          <Text className="text-foreground text-xs leading-5 flex-1">
            Payouts are processed every Friday. Funds arrive within 1–2 business days via Chapa.
          </Text>
        </View>

        <Text className="text-xs font-bold text-muted uppercase tracking-widest mt-2">Transaction History</Text>

        {isLoading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-10 items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-foreground font-bold text-base mb-1">No Transactions Yet</Text>
            <Text className="text-muted text-sm text-center">Complete trips to start earning.</Text>
          </View>
        ) : (
          <View className="gap-2">
            {transactions.map((tx, i) => (
              <TransactionRow key={tx._id} tx={tx} index={i} onPress={() => setSelectedTxRef(tx.tx_ref)} />
            ))}
          </View>
        )}
      </View>

      <TransactionDetailModal txRef={selectedTxRef} onClose={() => setSelectedTxRef(null)} />
    </ScrollView>
  );
}

export default function EarningsScreen() {
  return <ScreenContainer className="p-0"><EarningsContent /></ScreenContainer>;
}
