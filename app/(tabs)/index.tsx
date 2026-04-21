import { ScrollView, Text, View, Pressable, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

// Mock driver stats
const driverStats = {
  name: "John Smith",
  totalEarnings: 3250.5,
  todayEarnings: 125.0,
  completedTrips: 48,
  totalDistance: 1240,
  averageRating: 4.8,
  onTimeRate: 96,
  acceptanceRate: 94,
  safetyScore: 98,
};

// Mock recent trips
const recentTrips = [
  {
    id: "1",
    route: "Downtown Route A",
    earnings: 125.0,
    distance: 24.5,
    duration: "1h 45m",
    status: "completed",
    date: "Today",
    rating: 5,
  },
  {
    id: "2",
    route: "Airport Express",
    earnings: 98.5,
    distance: 18.2,
    duration: "1h 20m",
    status: "completed",
    date: "Yesterday",
    rating: 4,
  },
  {
    id: "3",
    route: "Harbor District",
    earnings: 112.0,
    distance: 22.1,
    duration: "1h 55m",
    status: "completed",
    date: "Yesterday",
    rating: 5,
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const handleRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate refresh
  };

  const StatCard = ({ label, value, unit, color = "primary" }: any) => (
    <View className={`flex-1 bg-${color}/10 rounded-lg p-3 border border-${color}/20`}>
      <Text className="text-xs text-muted mb-1">{label}</Text>
      <Text className={`text-2xl font-bold text-${color}`}>{value}</Text>
      {unit && <Text className="text-xs text-muted mt-1">{unit}</Text>}
    </View>
  );

  const TripItem = ({ trip }: any) => (
    <Pressable
      onPress={() => router.push("/(tabs)/history" as any)}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View className="bg-surface rounded-lg p-4 border border-border mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{trip.route}</Text>
            <Text className="text-xs text-muted mt-1">{trip.date}</Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-success">${trip.earnings.toFixed(2)}</Text>
            <View className="flex-row items-center gap-1 mt-1">
              <Text className="text-xs">⭐ {trip.rating}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row justify-between text-xs text-muted pt-2 border-t border-border">
          <Text className="text-xs text-muted">{trip.distance} km</Text>
          <Text className="text-xs text-muted">{trip.duration}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold">Welcome Back!</Text>
          <Text className="text-white text-sm opacity-80 mt-1">{driverStats.name}</Text>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Earnings Summary */}
          <View className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <Text className="text-xs text-green-600 dark:text-green-300 font-semibold mb-2">
              💰 EARNINGS
            </Text>
            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-sm text-green-700 dark:text-green-200">Today</Text>
                <Text className="text-2xl font-bold text-green-700 dark:text-green-100">
                  ${driverStats.todayEarnings.toFixed(2)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-green-700 dark:text-green-200">Total</Text>
                <Text className="text-2xl font-bold text-green-700 dark:text-green-100">
                  ${driverStats.totalEarnings.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Key Stats Grid */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Performance Metrics</Text>
            <View className="flex-row gap-3">
              <StatCard label="Trips" value={driverStats.completedTrips} unit="completed" color="blue" />
              <StatCard label="Distance" value={driverStats.totalDistance} unit="km" color="purple" />
              <StatCard label="Rating" value={driverStats.averageRating} unit="⭐" color="yellow" />
            </View>
          </View>

          {/* Performance Rates */}
          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">Rates & Scores</Text>
            <View className="gap-2">
              {/* On-Time Rate */}
              <View className="bg-surface rounded-lg p-3 border border-border">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-semibold text-foreground">On-Time Rate</Text>
                  <Text className="text-sm font-bold text-success">{driverStats.onTimeRate}%</Text>
                </View>
                <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-success"
                    style={{ width: `${driverStats.onTimeRate}%` }}
                  />
                </View>
              </View>

              {/* Acceptance Rate */}
              <View className="bg-surface rounded-lg p-3 border border-border">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-semibold text-foreground">Acceptance Rate</Text>
                  <Text className="text-sm font-bold text-primary">{driverStats.acceptanceRate}%</Text>
                </View>
                <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary"
                    style={{ width: `${driverStats.acceptanceRate}%` }}
                  />
                </View>
              </View>

              {/* Safety Score */}
              <View className="bg-surface rounded-lg p-3 border border-border">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm font-semibold text-foreground">Safety Score</Text>
                  <Text className="text-sm font-bold text-warning">{driverStats.safetyScore}%</Text>
                </View>
                <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-warning"
                    style={{ width: `${driverStats.safetyScore}%` }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Recent Trips */}
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-foreground">Recent Trips</Text>
              <Pressable onPress={() => router.push("/(tabs)/history" as any)}>
                <Text className="text-sm font-semibold text-primary">View All</Text>
              </Pressable>
            </View>
            <FlatList
              data={recentTrips}
              renderItem={({ item }) => <TripItem trip={item} />}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {/* Action Buttons */}
          <View className="gap-3 pb-6">
            <Pressable
              onPress={() => router.push("/(tabs)/marketplace" as any)}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-primary rounded-lg py-4 items-center">
                <Text className="text-base font-semibold text-white">Browse Cargo</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-surface border border-border rounded-lg py-4 items-center">
                <Text className="text-base font-semibold text-foreground">Refresh Stats</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
