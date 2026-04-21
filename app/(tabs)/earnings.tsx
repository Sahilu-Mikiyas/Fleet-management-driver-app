import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { MockChapaService } from "@/lib/chapa-service";

interface Transaction {
  id: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
  reference: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    amount: 2500,
    date: "2026-04-05",
    status: "completed",
    reference: "FD-1712282400000-abc123",
  },
  {
    id: "2",
    amount: 1800,
    date: "2026-04-04",
    status: "completed",
    reference: "FD-1712196000000-def456",
  },
  {
    id: "3",
    amount: 3200,
    date: "2026-04-03",
    status: "pending",
    reference: "FD-1712109600000-ghi789",
  },
];

export default function EarningsScreen() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [isProcessing, setIsProcessing] = useState(false);
  const chapaService = new MockChapaService();

  const totalEarnings = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = transactions
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleRequestPayout = async () => {
    if (totalEarnings < 100) {
      Alert.alert("Minimum Amount", "You need at least 100 ETB to request a payout");
      return;
    }

    setIsProcessing(true);
    try {
      const txRef = chapaService.generateTxRef();
      const response = await chapaService.initializePayment({
        amount: totalEarnings,
        email: "driver@example.com",
        first_name: "Test",
        last_name: "Driver",
        phone_number: "+251912345678",
        tx_ref: txRef,
      });

      if (response.status === "success" && response.data?.checkout_url) {
        Alert.alert("Payment Initialized", "Redirecting to Chapa checkout...", [
          {
            text: "OK",
            onPress: () => {
              // In a real app, you would open the checkout URL
              console.log("Checkout URL:", response.data?.checkout_url);
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to process payout request");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Earnings & Payouts</Text>
          <Text className="text-white text-sm opacity-80">Manage your money</Text>
        </View>

        <View className="px-4 py-6 gap-6">
          {/* Earnings Summary */}
          <View className="gap-3">
            {/* Total Earnings */}
            <View className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6">
              <Text className="text-white/80 text-sm mb-2">Total Earnings</Text>
              <Text className="text-white text-4xl font-bold">
                {totalEarnings.toLocaleString()} ETB
              </Text>
              <Text className="text-white/60 text-xs mt-2">From {transactions.length} trips</Text>
            </View>

            {/* Pending Amount */}
            {pendingAmount > 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-yellow-700 text-sm font-semibold">Pending Payout</Text>
                    <Text className="text-yellow-900 text-xl font-bold">{pendingAmount} ETB</Text>
                  </View>
                  <Text className="text-2xl">⏳</Text>
                </View>
              </View>
            )}
          </View>

          {/* Request Payout Button */}
          <Pressable
            onPress={handleRequestPayout}
            disabled={isProcessing || totalEarnings < 100}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View
              className={`rounded-lg py-4 items-center ${
                totalEarnings < 100
                  ? "bg-gray-300"
                  : isProcessing
                    ? "bg-primary/50"
                    : "bg-primary"
              }`}
            >
              <Text className="text-white font-bold text-lg">
                {isProcessing ? "Processing..." : "Request Payout via Chapa"}
              </Text>
            </View>
          </Pressable>

          {totalEarnings < 100 && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Text className="text-blue-700 text-xs">
                💡 Minimum 100 ETB required to request payout. Current: {totalEarnings} ETB
              </Text>
            </View>
          )}

          {/* Transaction History */}
          <View className="gap-3">
            <Text className="text-lg font-bold text-foreground">Transaction History</Text>

            {transactions.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 items-center">
                <Text className="text-muted text-sm">No transactions yet</Text>
              </View>
            ) : (
              transactions.map((transaction) => (
                <View key={transaction.id} className="bg-surface rounded-lg p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">
                        {transaction.amount.toLocaleString()} ETB
                      </Text>
                      <Text className="text-muted text-xs mt-1">{transaction.date}</Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${getStatusColor(transaction.status)}`}
                    >
                      <Text className="text-xs font-semibold capitalize">{transaction.status}</Text>
                    </View>
                  </View>
                  <Text className="text-muted text-xs">Ref: {transaction.reference}</Text>
                </View>
              ))
            )}
          </View>

          {/* Payment Info */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Text className="text-blue-900 text-sm font-semibold mb-2">💳 Chapa Payment</Text>
            <Text className="text-blue-800 text-xs leading-relaxed">
              Powered by Chapa, Ethiopia's leading payment gateway. Your earnings are securely
              transferred to your bank account within 24 hours.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
