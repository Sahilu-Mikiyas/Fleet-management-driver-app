import { View, Text, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { OrdersHub } from "@/components/orders-hub";

export function HomeContent() {
  const { driver } = useAuth();

  return (
    <View className="flex-1 bg-background relative">
      {/* Background Status View (Behind the bottom sheet) */}
      <View className="flex-1 px-6 pt-12 items-center">
        <View className="w-24 h-24 rounded-full bg-primary/20 items-center justify-center mb-4 border-4 border-primary/30">
          <Text className="text-4xl">🚛</Text>
        </View>
        <Text className="text-2xl font-bold text-foreground">
          {driver?.isAvailable ? "Ready to Roll" : "Off Duty"}
        </Text>
        <Text className="text-sm text-muted mt-2 text-center px-4">
          {driver?.isAvailable 
            ? "Your vehicle is online. Waiting for dispatch to assign new loads or check the marketplace."
            : "You are currently off duty. Go to the Account tab to toggle your availability."}
        </Text>
      </View>

    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScreenContainer className="p-0 bg-background" edges={["top"]}>
      <HomeContent />
    </ScreenContainer>
  );
}
