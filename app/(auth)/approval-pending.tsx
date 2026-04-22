import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function ApprovalPendingScreen() {
  const router = useRouter();
  const { driver, signOut, refreshDriver } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-check approval status every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshDriver();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Redirect if approved
  useEffect(() => {
    if (driver?.isApproved) {
      router.replace("/(tabs)");
    }
  }, [driver?.isApproved]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDriver();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-6 py-8">
          {/* Icon / Status */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-warning/20 items-center justify-center mb-4">
              <Text className="text-4xl">⏳</Text>
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2">Application Submitted</Text>
            <Text className="text-base text-muted text-center px-4">
              Your {driver?.role === "PRIVATE_TRANSPORTER" ? "Fleet Provider" : "Driver"} application is currently under review by our administration team.
            </Text>
          </View>

          {/* Driver Info */}
          {driver && (
            <View className="bg-surface rounded-lg p-4 mb-6 border border-border">
              <View className="mb-3">
                <Text className="text-xs text-muted mb-1">Name</Text>
                <Text className="text-base font-semibold text-foreground">{driver.name}</Text>
              </View>
              <View className="mb-3">
                <Text className="text-xs text-muted mb-1">Email</Text>
                <Text className="text-base font-semibold text-foreground">{driver.email}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">License Number</Text>
                <Text className="text-base font-semibold text-foreground">{driver.licenseNumber}</Text>
              </View>
            </View>
          )}

          {/* Info Box */}
          <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-8 border border-blue-200 dark:border-blue-800">
            <Text className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
              Your account has been created and is pending approval from your fleet administrator. You'll receive a
              notification once your account is approved and you can start managing your assignments.
            </Text>
          </View>

          {/* Refresh Button */}
          <Pressable
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed && !isRefreshing ? 0.97 : 1 }],
                opacity: isRefreshing ? 0.6 : 1,
              },
            ]}
          >
            <View className="bg-primary rounded-lg py-4 items-center mb-3">
              <Text className="text-base font-semibold text-white">
                {isRefreshing ? "Checking..." : "Check Status"}
              </Text>
            </View>
          </Pressable>

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View className="bg-surface border border-border rounded-lg py-4 items-center">
              <Text className="text-base font-semibold text-foreground">Sign Out</Text>
            </View>
          </Pressable>

          {/* Support Info */}
          <View className="mt-8 pt-6 border-t border-border">
            <Text className="text-xs text-muted text-center mb-2">Need help?</Text>
            <Text className="text-xs text-muted text-center">
              Contact your fleet administrator for approval status or account issues.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
