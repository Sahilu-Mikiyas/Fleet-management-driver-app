import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, Pressable, TextInput, ActivityIndicator } from "react-native";
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
  pickupDate?: string;
  deliveryDeadline?: string;
  createdAt: string;
  completedAt?: string;
}

export function HistoryContent() {
  const colors = useColors();
  const [trips, setTrips] = useState<TripHistoryItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "DELIVERED" | "CANCELLED">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await driverApi.getTripHistory();
      const data = response.data;
      setTrips(data.data?.trips || data.data || []);
    } catch (error) {
      console.error("Error fetching trip history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredTrips = trips.filter((trip) => {
    const matchesStatus = filterStatus === "all" || trip.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      (trip.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.pickupLocation?.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.deliveryLocation?.city || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalEarnings = filteredTrips
    .filter((t) => t.status === "DELIVERED")
    .reduce((sum, t) => sum + (t.pricing?.proposedBudget || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED": return "bg-success";
      case "CANCELLED": return "bg-error";
      case "IN_TRANSIT": return "bg-primary";
      default: return "bg-muted";
    }
  };

  return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Trip History</Text>
          <Text className="text-white text-sm opacity-80">
            View your completed trips and analytics
          </Text>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Stats */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted">Total Earnings</Text>
              <Text className="text-xl font-bold text-success">
                ETB {totalEarnings.toLocaleString()}
              </Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-xs text-muted">Trips</Text>
              <Text className="text-xl font-bold text-foreground">{filteredTrips.length}</Text>
            </View>
          </View>

          {/* Search */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Search Trips</Text>
            <TextInput
              placeholder="Search by route name or date..."
              placeholderTextColor="#9BA1A6"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          {/* Filter */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Filter by Status</Text>
            <View className="flex-row gap-2">
              {(["all", "DELIVERED", "CANCELLED"] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setFilterStatus(status)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <View
                    className={`px-3 py-2 rounded-full border ${
                      filterStatus === status
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-xs capitalize ${
                        filterStatus === status ? "text-white" : "text-foreground"
                      }`}
                    >
                      {status === "all" ? "All" : status === "DELIVERED" ? "Completed" : "Cancelled"}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Trips List */}
          <View>
            <Text className="text-lg font-semibold text-foreground mb-3">
              {filteredTrips.length} Trips
            </Text>
            {isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-muted mt-2">Loading trip history...</Text>
              </View>
            ) : filteredTrips.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 border border-border items-center">
                <Text className="text-3xl mb-2">🗺️</Text>
                <Text className="text-muted text-center">No trips found</Text>
              </View>
            ) : (
              filteredTrips.map((trip) => (
                <View
                  key={trip._id}
                  className="bg-surface rounded-lg p-4 border border-border mb-3"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-3">
                      <Text className="text-base font-semibold text-foreground">
                        {trip.title || "Trip"}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      <View className={`${getStatusColor(trip.status)} px-2 py-1 rounded-full`}>
                        <Text className="text-white text-xs font-semibold">{trip.status}</Text>
                      </View>
                      {trip.pricing?.proposedBudget && (
                        <Text className="text-sm font-bold text-success">
                          ETB {trip.pricing.proposedBudget.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Route */}
                  <View className="gap-1 pt-2 border-t border-border">
                    {trip.pickupLocation?.address && (
                      <Text className="text-xs text-muted">
                        📍 {trip.pickupLocation.city || trip.pickupLocation.address}
                      </Text>
                    )}
                    {trip.deliveryLocation?.address && (
                      <Text className="text-xs text-muted">
                        🏁 {trip.deliveryLocation.city || trip.deliveryLocation.address}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
  );
}

export default function HistoryScreen() {
  return (
    <ScreenContainer className="p-0">
      <HistoryContent />
    </ScreenContainer>
  );
}
