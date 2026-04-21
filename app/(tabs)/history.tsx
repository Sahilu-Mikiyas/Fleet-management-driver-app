import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

interface TripRecord {
  id: string;
  routeName: string;
  date: string;
  duration: string;
  distance: string;
  passengers: number;
  earnings: number;
  status: "completed" | "cancelled";
  rating: number;
}

export default function HistoryScreen() {
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const trips: TripRecord[] = [
    {
      id: "t1",
      routeName: "Downtown Route A",
      date: "Mar 28, 2026",
      duration: "1h 30m",
      distance: "12.5 km",
      passengers: 8,
      earnings: 45.0,
      status: "completed",
      rating: 5,
    },
    {
      id: "t2",
      routeName: "Airport Express",
      date: "Mar 27, 2026",
      duration: "2h 15m",
      distance: "28.3 km",
      passengers: 12,
      earnings: 75.0,
      status: "completed",
      rating: 5,
    },
    {
      id: "t3",
      routeName: "City Center Loop",
      date: "Mar 26, 2026",
      duration: "1h 00m",
      distance: "8.7 km",
      passengers: 6,
      earnings: 35.0,
      status: "completed",
      rating: 4,
    },
    {
      id: "t4",
      routeName: "Suburban Route",
      date: "Mar 25, 2026",
      duration: "1h 45m",
      distance: "15.2 km",
      passengers: 0,
      earnings: 0,
      status: "cancelled",
      rating: 0,
    },
  ];

  const filteredTrips = trips.filter((trip) => {
    const matchesStatus = filterStatus === "all" || trip.status === filterStatus;
    const matchesSearch =
      trip.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.date.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalEarnings = trips
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.earnings, 0);
  const totalTrips = trips.filter((t) => t.status === "completed").length;
  const totalDistance = trips
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + parseFloat(t.distance), 0);
  const avgRating = (
    trips
      .filter((t) => t.status === "completed" && t.rating > 0)
      .reduce((sum, t) => sum + t.rating, 0) / trips.filter((t) => t.status === "completed" && t.rating > 0).length
  ).toFixed(1);

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Trip History</Text>
          <Text className="text-white text-sm opacity-80">View your completed trips and analytics</Text>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Analytics Cards */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-xs text-muted mb-2">Total Earnings</Text>
                <Text className="text-2xl font-bold text-primary">${totalEarnings.toFixed(2)}</Text>
              </View>
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-xs text-muted mb-2">Trips</Text>
                <Text className="text-2xl font-bold text-primary">{totalTrips}</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-xs text-muted mb-2">Distance</Text>
                <Text className="text-2xl font-bold text-primary">{totalDistance.toFixed(1)} km</Text>
              </View>
              <View className="flex-1 bg-surface rounded-lg p-4 border border-border">
                <Text className="text-xs text-muted mb-2">Avg Rating</Text>
                <Text className="text-2xl font-bold text-primary">⭐ {avgRating}</Text>
              </View>
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

          {/* Filter Buttons */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Filter by Status</Text>
            <View className="flex-row gap-2">
              {(["all", "completed", "cancelled"] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setFilterStatus(status)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                  className="flex-1"
                >
                  <View
                    className={`p-3 rounded-lg border ${
                      filterStatus === status
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-center text-sm capitalize ${
                        filterStatus === status ? "text-white" : "text-foreground"
                      }`}
                    >
                      {status}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Trips List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              {filteredTrips.length} Trip{filteredTrips.length !== 1 ? "s" : ""}
            </Text>
            {filteredTrips.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 border border-border items-center">
                <Text className="text-muted">No trips found</Text>
              </View>
            ) : (
              filteredTrips.map((trip) => (
                <Pressable
                  key={trip.id}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <View className="bg-surface rounded-lg p-4 border border-border">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {trip.routeName}
                        </Text>
                        <Text className="text-xs text-muted mt-1">{trip.date}</Text>
                      </View>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          trip.status === "completed"
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-red-100 dark:bg-red-900"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold capitalize ${
                            trip.status === "completed"
                              ? "text-green-700 dark:text-green-200"
                              : "text-red-700 dark:text-red-200"
                          }`}
                        >
                          {trip.status}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between gap-4 mb-3">
                      <View>
                        <Text className="text-xs text-muted mb-1">Duration</Text>
                        <Text className="text-sm font-semibold text-foreground">{trip.duration}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-muted mb-1">Distance</Text>
                        <Text className="text-sm font-semibold text-foreground">{trip.distance}</Text>
                      </View>
                      <View>
                        <Text className="text-xs text-muted mb-1">Passengers</Text>
                        <Text className="text-sm font-semibold text-foreground">{trip.passengers}</Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center pt-3 border-t border-border">
                      {trip.status === "completed" ? (
                        <>
                          <View>
                            <Text className="text-xs text-muted mb-1">Earnings</Text>
                            <Text className="text-base font-bold text-success">
                              ${trip.earnings.toFixed(2)}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-xs text-muted mb-1">Rating</Text>
                            <Text className="text-base font-semibold">
                              {"⭐".repeat(trip.rating)}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text className="text-sm text-muted">Trip was cancelled</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
