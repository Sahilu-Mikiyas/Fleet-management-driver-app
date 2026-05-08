import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView, Text, View, Pressable, Alert, ActivityIndicator,
  Animated, Modal, TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { driverApi, paymentsApi } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

// ── Types matching backend exactly ──
interface WalletData {
  balance?: number;          // available balance  (GET /driver/wallet → data.data.balance)
  totalEarnings?: number;    // lifetime earnings   (GET /driver/wallet → data.data.totalEarnings)
  fullName?: string;
}

interface CommissionRecord {
  _id: string;
  trx_ref: string;           // note: trx_ref not tx_ref
  amount: number;
  driverCommission: number;  // what actually gets displayed
  status: string;
  createdAt: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  status: string;
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

function CommissionRow({ tx, index }: { tx: CommissionRecord; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50 }).start();
  }, []);
  const date = new Date(tx.createdAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const earned = tx.driverCommission ?? tx.amount ?? 0;
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <View className="bg-surface rounded-2xl border border-border p-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 items-center justify-center mr-3">
          <Text className="text-base">📈</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">Shipment Payment Received</Text>
          <Text className="text-xs text-muted mt-0.5">{dateStr} · {timeStr}</Text>
          <Text className="text-[10px] text-muted/70 mt-0.5" numberOfLines={1}>{tx.trx_ref}</Text>
        </View>
        <Text className="text-base font-bold text-success">
          +{earned.toLocaleString()} <Text className="text-[10px] font-normal">ETB</Text>
        </Text>
      </View>
    </Animated.View>
  );
}

function WithdrawalRow({ w, index }: { w: Withdrawal; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50 }).start();
  }, []);
  const s = txStyle(w.status);
  const date = new Date(w.createdAt);
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <View className="bg-surface rounded-2xl border border-border p-4 flex-row items-center">
        <View className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center mr-3">
          <Text className="text-base">💳</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">Withdrawal Request</Text>
          <Text className="text-xs text-muted mt-0.5">{dateStr}</Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-base font-bold text-foreground">
            -{(w.amount ?? 0).toLocaleString()} <Text className="text-[10px] font-normal">ETB</Text>
          </Text>
          <View className={`px-2 py-0.5 rounded-full border ${s.bg} ${s.border}`}>
            <Text className={`text-[9px] font-bold uppercase ${s.text}`}>{w.status}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function WithdrawModal({ balance, onClose, onSuccess }: {
  balance: number; onClose: () => void; onSuccess: () => void;
}) {
  const colors = useColors();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) { Alert.alert("Invalid", "Enter a valid amount."); return; }
    if (n > balance) { Alert.alert("Insufficient", "Amount exceeds available balance."); return; }
    setIsSubmitting(true);
    try {
      await driverApi.requestWithdrawal(n);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("✅ Submitted", "Withdrawal request sent to the finance team.");
      onSuccess();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit withdrawal.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl pt-6 pb-10 px-6">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-xl font-bold text-foreground">Request Withdrawal</Text>
            <Pressable onPress={onClose}>
              <View className="w-8 h-8 bg-surface rounded-full items-center justify-center border border-border">
                <Text className="text-foreground font-bold text-xs">✕</Text>
              </View>
            </Pressable>
          </View>

          <Text className="text-xs text-muted mb-1 uppercase tracking-wide font-bold">Amount (ETB)</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder={`Max ${balance.toLocaleString()} ETB`}
            placeholderTextColor={colors.muted}
            style={{ color: colors.foreground, fontSize: 24, fontWeight: "bold", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: colors.primary }}
          />
          <Text className="text-xs text-muted mt-3 mb-6 leading-5">
            Your request will be sent to the company finance team for approval.
          </Text>

          <Pressable
            onPress={submit}
            disabled={isSubmitting}
            style={({ pressed }) => [{ opacity: pressed || isSubmitting ? 0.7 : 1 }]}
          >
            <View className="bg-primary rounded-2xl py-4 items-center">
              <Text className="text-white font-bold text-base">
                {isSubmitting ? "Submitting…" : "Request Withdraw"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function EarningsContent() {
  const colors = useColors();
  const [wallet, setWallet] = useState<WalletData>({});
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, commRes, wdRes] = await Promise.allSettled([
        driverApi.getWallet(),
        driverApi.getCommissionHistory(),
        driverApi.getWithdrawals(),
      ]);

      if (walletRes.status === "fulfilled") {
        // Backend: GET /driver/wallet → { data: { balance, totalEarnings, fullName } }
        const d = walletRes.value.data?.data ?? walletRes.value.data;
        setWallet(d ?? {});
      }

      if (commRes.status === "fulfilled") {
        // Backend: GET /driver/commission/history → { data: [...CommissionRecord] }
        const d = commRes.value.data?.data ?? commRes.value.data;
        setCommissions(Array.isArray(d) ? d : []);
      }

      if (wdRes.status === "fulfilled") {
        const d = wdRes.value.data?.data ?? wdRes.value.data;
        setWithdrawals(Array.isArray(d) ? d : []);
      }
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const balance = wallet.balance ?? 0;
  const totalEarnings = wallet.totalEarnings ?? 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Navy header */}
      <Animated.View
        className="bg-navy px-6 pt-8 pb-8"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
      >
        <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Available Balance</Text>
        {isLoading
          ? <ActivityIndicator color="white" style={{ alignSelf: "flex-start", marginVertical: 8 }} />
          : <Text className="text-white text-4xl font-bold">{balance.toLocaleString()} <Text className="text-xl font-normal opacity-70">ETB</Text></Text>
        }
        <View className="flex-row gap-4 mt-4 flex-wrap">
          <View className="bg-white/10 rounded-2xl px-4 py-3 flex-1">
            <Text className="text-white/60 text-[10px] uppercase tracking-widest">Total Lifetime Earnings</Text>
            <Text className="text-white text-lg font-bold mt-0.5">{totalEarnings.toLocaleString()} ETB</Text>
          </View>
          <View className="bg-white/10 rounded-2xl px-4 py-3 flex-1">
            <Text className="text-white/60 text-[10px] uppercase tracking-widest">Account Status</Text>
            <View className="bg-success/20 border border-success/40 px-2 py-0.5 rounded-full self-start mt-1">
              <Text className="text-success text-[10px] font-bold">Verified Partner</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View className="px-4 pt-5 gap-4">
        {/* Withdraw button */}
        <Pressable
          onPress={() => setShowWithdrawModal(true)}
          disabled={isLoading || balance <= 0}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], opacity: balance <= 0 ? 0.5 : 1 }]}
        >
          <View className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2">
            <Text className="text-xl">💳</Text>
            <Text className="text-white font-bold text-base">Withdraw Funds</Text>
          </View>
        </Pressable>

        <View className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 flex-row items-center gap-3">
          <Text className="text-base">📅</Text>
          <Text className="text-foreground text-xs leading-5 flex-1">
            Your next automated payout will be processed on Friday.
          </Text>
        </View>

        {/* Earning History */}
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs font-bold text-muted uppercase tracking-widest">Earning History</Text>
          <View className="bg-surface border border-border px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-foreground">{commissions.length} Records</Text>
          </View>
        </View>

        {isLoading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : commissions.length === 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-10 items-center">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-foreground font-bold text-base mb-1">No Earnings Yet</Text>
            <Text className="text-muted text-sm text-center">Complete shipments to start earning.</Text>
          </View>
        ) : (
          <View className="gap-2">
            {commissions.map((tx, i) => (
              <CommissionRow key={tx._id} tx={tx} index={i} />
            ))}
          </View>
        )}

        {/* Withdrawal Requests */}
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-xs font-bold text-muted uppercase tracking-widest">Withdrawal Requests</Text>
          <View className="bg-surface border border-border px-2.5 py-1 rounded-full">
            <Text className="text-xs font-bold text-foreground">{withdrawals.length} Requests</Text>
          </View>
        </View>

        {!isLoading && withdrawals.length === 0 ? (
          <View className="bg-surface rounded-2xl border border-border p-8 items-center">
            <Text className="text-3xl mb-2">💸</Text>
            <Text className="text-muted text-sm text-center">No withdrawal requests yet.</Text>
          </View>
        ) : (
          <View className="gap-2">
            {withdrawals.map((w, i) => (
              <WithdrawalRow key={w._id} w={w} index={i} />
            ))}
          </View>
        )}
      </View>

      {showWithdrawModal && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => { setShowWithdrawModal(false); fetchData(); }}
        />
      )}
    </ScrollView>
  );
}

export default function EarningsScreen() {
  return <ScreenContainer className="p-0"><EarningsContent /></ScreenContainer>;
}
