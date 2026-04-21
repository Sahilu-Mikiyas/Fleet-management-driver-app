import React, { useState } from "react";
import { ScrollView, Text, View, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Sign In Failed", error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = () => {
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="items-center mb-12">
            <Text className="text-4xl font-bold text-foreground mb-2">Fleet Driver</Text>
            <Text className="text-base text-muted text-center">
              Sign in to manage your assignments and routes
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#9BA1A6"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          {/* Password Input */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#9BA1A6"
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              secureTextEntry
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            disabled={isLoading}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed && !isLoading ? 0.97 : 1 }],
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
          >
            <View className="bg-primary rounded-lg py-4 items-center">
              <Text className="text-base font-semibold text-white">
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </View>
          </Pressable>

          {/* Skip Login Button (For Testing) */}
          <Pressable
            onPress={handleSkipLogin}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <View className="bg-surface border border-border rounded-lg py-4 items-center mt-3">
              <Text className="text-base font-semibold text-foreground">Skip Login (Testing)</Text>
            </View>
          </Pressable>

          {/* Info Text */}
          <View className="mt-12 p-4 bg-surface rounded-lg border border-border">
            <Text className="text-xs text-muted leading-relaxed">
              Use your company email and password to sign in. If you don't have an account or forgot your password,
              contact your fleet administrator.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
