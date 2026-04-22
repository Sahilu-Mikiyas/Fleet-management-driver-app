import React from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { driverApi } from "@/lib/api-client";

export function ProfileContent() {
  const router = useRouter();
  const { driver, signOut, refreshDriver } = useAuth();
  const [isOnDuty, setIsOnDuty] = React.useState(driver?.isAvailable ?? false);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);

  // Sync local state when driver data changes
  React.useEffect(() => {
    if (driver) {
      setIsOnDuty(driver.isAvailable);
    }
  }, [driver?.isAvailable]);

  const handleToggleAvailability = async () => {
    const newStatus = !isOnDuty;
    setIsOnDuty(newStatus); // optimistic update
    setIsTogglingStatus(true);
    try {
      await driverApi.updateStatus(newStatus ? "ACTIVE" : "INACTIVE", newStatus);
      await refreshDriver();
    } catch (error) {
      setIsOnDuty(!newStatus); // revert
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login" as any);
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-white text-2xl font-bold">{driver?.name || "Driver"}</Text>
          <Text className="text-white text-sm opacity-80 mt-1">{driver?.email}</Text>
          {driver?.phoneNumber ? (
            <Text className="text-white text-sm opacity-80 mt-1">{driver.phoneNumber}</Text>
          ) : null}
          <View className="mt-3 flex-row gap-2">
            <View className={`px-3 py-1 rounded-full ${driver?.isApproved ? "bg-white/20" : "bg-warning/80"}`}>
              <Text className="text-white text-xs font-semibold">{driver?.status || "UNKNOWN"}</Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-white/20">
              <Text className="text-white text-xs font-semibold">{driver?.role || "DRIVER"}</Text>
            </View>
          </View>
        </View>
        <View className="px-6 py-6 gap-6">
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Profile Information</Text>
            <View className="gap-3">
              <View>
                <Text className="text-xs text-muted mb-1">Phone Number</Text>
                <Text className="text-base font-semibold text-foreground">{driver?.phoneNumber || "—"}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Company ID</Text>
                <Text className="text-base font-semibold text-foreground">{driver?.companyId || "—"}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Member Since</Text>
                <Text className="text-base font-semibold text-foreground">
                  {driver?.createdAt ? new Date(driver.createdAt).toLocaleDateString() : "—"}
                </Text>
              </View>
            </View>
          </View>
          <View className="bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">Availability</Text>
              <Pressable
                onPress={handleToggleAvailability}
                disabled={isTogglingStatus}
                style={{ opacity: isTogglingStatus ? 0.6 : 1 }}
              >
                <View className={`px-4 py-2 rounded-full ${isOnDuty ? "bg-success" : "bg-error"}`}>
                  <Text className="text-white text-sm font-semibold">
                    {isTogglingStatus ? "Updating..." : isOnDuty ? "On Duty" : "Off Duty"}
                  </Text>
                </View>
              </Pressable>
            </View>
            <Text className="text-sm text-muted">Toggle your availability to accept new assignments</Text>
          </View>
          <Pressable onPress={handleLogout} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <View className="bg-error rounded-lg py-4 items-center">
              <Text className="text-base font-semibold text-white">Sign Out</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <ScreenContainer className="p-0">
      <ProfileContent />
    </ScreenContainer>
  );
}
