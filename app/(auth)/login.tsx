import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView, Text, View, TextInput, Pressable, Alert,
  Animated, Easing, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Entrance animations
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const formAnim  = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 140, friction: 18 }),
      Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }),
    ]).start();

    // Subtle floating animation on the logo icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    ).start();
  }, []);

  const handleSignIn = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter your email/phone and password.");
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await signIn(identifier.trim(), password);
    } catch (error) {
      Alert.alert("Sign In Failed", error instanceof Error ? error.message : "Check your credentials and try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-center px-6 py-10">

            {/* ── Logo & Branding ── */}
            <Animated.View
              className="items-center mb-10"
              style={{
                opacity: logoAnim,
                transform: [
                  { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
                  { translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                ],
              }}
            >
              {/* Glowing ring + icon */}
              <View className="w-24 h-24 rounded-3xl bg-primary/15 items-center justify-center mb-5"
                    style={{ borderWidth: 2, borderColor: colors.primary + "40" }}>
                <Text className="text-5xl">🚛</Text>
              </View>

              <Text className="text-3xl font-bold text-foreground tracking-tight">Fleet Driver</Text>
              <Text className="text-sm text-muted mt-1 text-center">
                Your logistics partner — on the road
              </Text>
            </Animated.View>

            {/* ── Form Card ── */}
            <Animated.View
              className="bg-surface rounded-3xl border border-border p-6 shadow-sm"
              style={{
                opacity: formAnim,
                transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              }}
            >
              <Text className="text-base font-bold text-foreground mb-5">Sign in to your account</Text>

              {/* Email / Phone */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Email or Phone</Text>
                <View className="flex-row items-center bg-background border border-border rounded-2xl px-4 py-3 gap-2">
                  <Text className="text-base">👤</Text>
                  <TextInput
                    placeholder="Email or phone number"
                    placeholderTextColor={colors.muted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 text-foreground text-sm"
                    style={{ color: colors.foreground }}
                  />
                </View>
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Password</Text>
                <View className="flex-row items-center bg-background border border-border rounded-2xl px-4 py-3 gap-2">
                  <Text className="text-base">🔒</Text>
                  <TextInput
                    placeholder="Your password"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                    secureTextEntry={!showPassword}
                    className="flex-1 text-foreground text-sm"
                    style={{ color: colors.foreground }}
                  />
                  <Pressable onPress={() => setShowPassword((p) => !p)}>
                    <Text className="text-base">{showPassword ? "🙈" : "👁️"}</Text>
                  </Pressable>
                </View>
              </View>

              {/* Sign In Button */}
              <Pressable
                onPress={handleSignIn}
                disabled={isLoading}
                className={`rounded-2xl py-4 items-center ${isLoading ? "bg-primary/60" : "bg-primary"}`}
                style={({ pressed }) => [{ transform: [{ scale: pressed && !isLoading ? 0.97 : 1 }] }]}
              >
                <Text className="text-white font-bold text-base">
                  {isLoading ? "Signing in…" : "Sign In →"}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Info note */}
            <Animated.View
              className="mt-5 px-4 py-3 bg-surface/60 rounded-2xl border border-border/50 mx-2"
              style={{ opacity: formAnim }}
            >
              <Text className="text-xs text-muted text-center leading-5">
                Sign in with your company email or phone number.{"\n"}
                Contact your fleet administrator if you need access.
              </Text>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
