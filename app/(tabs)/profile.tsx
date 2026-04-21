import React from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function ProfileScreen() {
  const router = useRouter();
  const { driver, signOut } = useAuth();
  const [isOnDuty, setIsOnDuty] = React.useState(true);

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/");
          } catch (error) {
            Alert.alert("Error", "Failed to sign out");
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-primary px-6 py-8">
          <Text className="text-white text-2xl font-bold">{driver?.name || "Driver"}</Text>
          <Text className="text-white text-sm opacity-80 mt-2">{driver?.email}</Text>
        </View>
        <View className="px-6 py-6 gap-6">
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Profile Information</Text>
            <View className="gap-3">
              <View>
                <Text className="text-xs text-muted mb-1">License Number</Text>
                <Text className="text-base font-semibold text-foreground">{driver?.licenseNumber}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Company</Text>
                <Text className="text-base font-semibold text-foreground">{driver?.companyId}</Text>
              </View>
            </View>
          </View>
          <View className="bg-surface rounded-lg p-4 border border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">Availability</Text>
              <Pressable onPress={() => setIsOnDuty(!isOnDuty)}>
                <View className={`px-4 py-2 rounded-full ${isOnDuty ? "bg-success" : "bg-error"}`}>
                  <Text className="text-white text-sm font-semibold">{isOnDuty ? "On Duty" : "Off Duty"}</Text>
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
    </ScreenContainer>
  );
}
