import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, Pressable, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { driverApi, paymentsApi } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";

interface CommissionEntry {
  _id: string;
  amount: number;
  tripId?: string;
  orderId?: string;
  createdAt: string;
  status?: string;
}

export function EarningsContent() {
  const colors = useColors();
  const [totalCommission, setTotalCommission] = useState(0);
  const [commissionHistory, setCommissionHistory] = useState<CommissionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      const [commissionRes, historyRes] = await Promise.allSettled([
        driverApi.getCommission(),
        driverApi.getCommissionHistory(),
      ]);

      if (commissionRes.status === "fulfilled") {
        const data = commissionRes.value.data;
        setTotalCommission(data.data?.totalCommission ?? data.data?.total ?? 0);
      }

      if (historyRes.status === "fulfilled") {
        const data = historyRes.value.data;
        setCommissionHistory(data.data?.commissions || data.data || []);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleRequestPayout = async () => {
    if (totalCommission <= 0) {
      Alert.alert("No Balance", "You don't have any earnings to withdraw.");
      return;
    }

    Alert.alert(
      "Request Payout",
      `Request a payout of ETB ${totalCommission.toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await paymentsApi.initialize("payout", totalCommission);
              Alert.alert("Success", "Payout request submitted! You'll receive it shortly via Chapa.");
              await fetchEarnings(); // refresh
            } catch (error) {
              Alert.alert("Error", error instanceof Error ? error.message : "Payout request failed.");
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Earnings</Text>
          <Text className="text-white text-sm opacity-80">Manage your money</Text>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Balance Card */}
          <View className="bg-green-50 dark:bg-green-950 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <Text className="text-sm text-green-600 dark:text-green-300 font-semibold mb-1">
              Available Balance
            </Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text className="text-4xl font-bold text-green-700 dark:text-green-100">
                ETB {totalCommission.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Payout Button */}
          <Pressable
            onPress={handleRequestPayout}
            disabled={isProcessing || isLoading}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed && !isProcessing ? 0.97 : 1 }],
                opacity: isProcessing ? 0.6 : 1,
              },
            ]}
          >
            <View className="bg-primary rounded-lg py-4 items-center">
              <Text className="text-base font-semibold text-white">
                {isProcessing ? "Processing..." : "💳 Request Payout via Chapa"}
              </Text>
            </View>
          </Pressable>

          {/* Commission History */}
          <View>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Commission History
            </Text>
            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : commissionHistory.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 border border-border items-center">
                <Text className="text-3xl mb-2">📊</Text>
                <Text className="text-muted text-center">No commission history yet. Complete trips to earn!</Text>
              </View>
            ) : (
              commissionHistory.map((entry) => (
                <View
                  key={entry._id}
                  className="bg-surface rounded-lg p-4 border border-border mb-3"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        Trip Commission
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {new Date(entry.createdAt).toLocaleDateString()} at{" "}
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-success">
                      +ETB {entry.amount?.toLocaleString() ?? "0"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
  );
}

export default function EarningsScreen() {
  return (
    <ScreenContainer className="p-0">
      <EarningsContent />
    </ScreenContainer>
  );
}
