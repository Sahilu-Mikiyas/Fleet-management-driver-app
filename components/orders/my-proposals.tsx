import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { ordersApi, type ApiOrderProposal, type ApiMarketplaceOrder } from "@/lib/api-client";
import { useRouter } from "expo-router";

export function MyProposals() {
  const colors = useColors();
  const router = useRouter();
  const [proposals, setProposals] = useState<ApiOrderProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProposals = async () => {
    try {
      const response = await ordersApi.getMyProposals();
      const data = response.data.data?.proposals || response.data.data || [];
      setProposals(data);
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleWithdraw = async (proposalId: string) => {
    try {
      await ordersApi.withdrawProposal(proposalId);
      fetchProposals();
    } catch (error) {
      console.error("Failed to withdraw proposal:", error);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProposals();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED": return "bg-success/15 text-success";
      case "REJECTED": return "bg-error/15 text-error";
      case "WITHDRAWN": return "bg-muted/15 text-muted";
      default: return "bg-warning/15 text-warning"; // PENDING
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 py-12 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4 font-medium">Loading your proposals...</Text>
      </View>
    );
  }

  if (proposals.length === 0) {
    return (
      <ScrollView 
        contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        className="bg-background"
      >
        <Text className="text-5xl mb-4">📄</Text>
        <Text className="text-lg font-bold text-foreground text-center mb-2">No Proposals Yet</Text>
        <Text className="text-sm text-muted text-center mb-6">
          You haven't submitted any bids on the marketplace yet. Browse the marketplace and submit proposals to get loads.
        </Text>
        <Pressable 
          onPress={() => router.push("/(tabs)/market")} // Navigating back to marketplace view might require parent state change, but sticking to router works if structured right
          className="bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Browse Marketplace</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      className="bg-background flex-1"
    >
      <Text className="text-xl font-bold text-foreground mb-2">Your Bids ({proposals.length})</Text>

      {proposals.map((proposal) => {
        // The orderId could be populated or just a string. Safe fallback:
        const orderInfo = typeof proposal.orderId === 'object' ? (proposal.orderId as ApiMarketplaceOrder) : null;
        
        return (
          <Pressable
            key={proposal._id}
            onPress={() => {
              if (orderInfo?._id) {
                router.push({ pathname: "/cargo-detail", params: { cargoId: orderInfo._id } });
              }
            }}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <View className="bg-surface rounded-xl p-4 border border-border shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-bold text-foreground" numberOfLines={1}>
                    {orderInfo?.title || "Unknown Load"}
                  </Text>
                  {orderInfo?.pickupLocation && (
                    <Text className="text-xs text-muted mt-1" numberOfLines={1}>
                      {orderInfo.pickupLocation.city} → {orderInfo.deliveryLocation.city}
                    </Text>
                  )}
                </View>
                <View className={`px-2 py-1 rounded-md ${getStatusColor(proposal.status).split(' ')[0]}`}>
                  <Text className={`text-[10px] font-bold uppercase ${getStatusColor(proposal.status).split(' ')[1]}`}>
                    {proposal.status}
                  </Text>
                </View>
              </View>

              <View className="bg-background rounded-lg p-3 border border-border/50">
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-muted">Your Bid:</Text>
                  <Text className="text-sm font-bold text-primary">
                    {proposal.currency} {proposal.proposedPrice.toLocaleString()}
                  </Text>
                </View>
                {proposal.vehicleDetails && (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-muted">Vehicle:</Text>
                    <Text className="text-xs font-semibold text-foreground text-right flex-1 ml-4" numberOfLines={1}>
                      {proposal.vehicleDetails}
                    </Text>
                  </View>
                )}
              </View>

              {/* Withdraw Button */}
              {proposal.status?.toUpperCase() === "PENDING" && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Withdraw Bid",
                      "Are you sure you want to withdraw this proposal?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Withdraw", style: "destructive", onPress: () => handleWithdraw(proposal._id) }
                      ]
                    );
                  }}
                  className="mt-3 bg-error/10 py-2 rounded-lg items-center border border-error/20"
                >
                  <Text className="text-error text-xs font-bold">Withdraw Bid</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        );
      })}
      <View className="h-12" />
    </ScrollView>
  );
}
