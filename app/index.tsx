import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function IndexScreen() {
  const router = useRouter();
  const { session, isLoading, isApproved } = useAuth();
  const colors = useColors();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)/login" as any);
    } else if (!isApproved) {
      router.replace("/(auth)/approval-pending" as any);
    } else {
      router.replace("/(tabs)");
    }
  }, [session, isApproved, isLoading]);

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
