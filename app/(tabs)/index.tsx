import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Pressable, Easing } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { driverApi } from "@/lib/api-client";

function StatCard({
  icon, label, value, sub, delay, color,
}: {
  icon: string; label: string; value: string; sub?: string; delay: number; color?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 22 }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        flex: 1,
      }}
    >
      <View
        className="bg-surface rounded-2xl p-4 border border-border"
        style={{ minHeight: 90 }}
      >
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-2xl">{icon}</Text>
          {color && <View className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: color }} />}
        </View>
        <Text className="text-xl font-bold text-foreground">{value}</Text>
        <Text className="text-xs text-muted mt-0.5">{label}</Text>
        {sub && <Text className="text-xs text-primary font-medium mt-1">{sub}</Text>}
      </View>
    </Animated.View>
  );
}

export function HomeContent() {
  const colors = useColors();
  const { driver } = useAuth();
  const [commission, setCommission] = useState<{ available?: number; currency?: string } | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header fade-in
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 140, friction: 18 }).start();
    // Availability indicator pulse (only when online)
    if (driver?.isAvailable) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [driver?.isAvailable]);

  useEffect(() => {
    Animated.spring(statusIndicatorAnim, {
      toValue: driver?.isAvailable ? 1 : 0, useNativeDriver: false, tension: 200, friction: 20,
    }).start();
  }, [driver?.isAvailable]);

  useEffect(() => {
    driverApi.getCommission()
      .then((res) => setCommission(res.data?.data))
      .catch(() => {});
  }, []);

  const isOnline = driver?.isAvailable ?? false;

  return (
    <View className="flex-1 bg-background">
      {/* ── Hero Header ── */}
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }}
        className="px-5 pt-8 pb-6"
        // Subtle navy-to-background gradient implied by bg colors
      >
        {/* Status badge */}
        <View className="flex-row items-center gap-2 mb-5">
          <Animated.View
            style={{ transform: [{ scale: isOnline ? pulseAnim : 1 }] }}
            className="w-2.5 h-2.5 rounded-full"
            // Use the success or muted dot color
          >
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: isOnline ? colors.success : colors.muted }}
            />
          </Animated.View>
          <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: isOnline ? colors.success : colors.muted }}>
            {isOnline ? "Online · Ready" : "Offline · Off Duty"}
          </Text>
        </View>

        {/* Avatar + greeting */}
        <View className="flex-row items-center gap-4">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.primary + "20", borderWidth: 2, borderColor: colors.primary + "40" }}
          >
            <Text className="text-3xl">🚛</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted font-medium">Welcome back</Text>
            <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
              {driver?.name ?? "Driver"}
            </Text>
            <Text className="text-xs text-muted mt-0.5">
              {driver?.role === "PRIVATE_TRANSPORTER" ? "Private Transporter" : "Company Driver"}
            </Text>
          </View>
          {/* Online indicator ring */}
          {isOnline && (
            <View className="items-center justify-center">
              <Animated.View
                style={{ transform: [{ scale: pulseAnim }] }}
                className="w-12 h-12 rounded-full border-2 border-primary/30 items-center justify-center absolute"
              />
              <View className="w-10 h-10 rounded-full bg-primary/15 border border-primary/40 items-center justify-center">
                <Text className="text-lg">✅</Text>
              </View>
            </View>
          )}
        </View>

        {/* Status caption */}
        <View className="mt-4 bg-surface rounded-2xl px-4 py-3 border border-border flex-row items-center gap-3">
          <Text className="text-xl">{isOnline ? "📡" : "😴"}</Text>
          <Text className="text-sm text-muted flex-1 leading-5">
            {isOnline
              ? "You're visible to dispatch. New assignments and marketplace loads will appear automatically."
              : "You're off duty. Toggle availability in the Account tab to start receiving loads."}
          </Text>
        </View>
      </Animated.View>

      {/* ── Stats Grid ── */}
      <View className="px-5 gap-3">
        <Animated.View style={{ opacity: headerAnim }}>
          <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Today's Overview</Text>
        </Animated.View>
        <View className="flex-row gap-3">
          <StatCard
            icon="💰"
            label="Balance"
            value={commission ? `${commission.currency ?? "ETB"} ${(commission.available ?? 0).toLocaleString()}` : "—"}
            sub="Available earnings"
            delay={100}
            color={colors.success}
          />
          <StatCard
            icon="🚦"
            label="Status"
            value={isOnline ? "Online" : "Offline"}
            sub={isOnline ? "Accepting loads" : "Go to Account →"}
            delay={180}
            color={isOnline ? colors.success : colors.muted}
          />
        </View>

        {/* Quick actions */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}
        >
          <Text className="text-xs font-bold text-muted uppercase tracking-widest mt-2 mb-3">Quick Access</Text>
          <View className="gap-2.5">
            <QuickActionRow icon="📋" label="View active trip" sub="See your current assignment" tab="orders" />
            <QuickActionRow icon="🛒" label="Marketplace" sub="Browse open loads" tab="market" />
            <QuickActionRow icon="📊" label="Trip history & earnings" sub="Review completed deliveries" tab="market" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function QuickActionRow({ icon, label, sub, tab }: { icon: string; label: string; sub: string; tab: string }) {
  const colors = useColors();
  return (
    <View className="bg-surface rounded-xl px-4 py-3.5 border border-border flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
        <Text className="text-xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Text className="text-xs text-muted mt-0.5">{sub}</Text>
      </View>
      <Text className="text-muted text-sm">›</Text>
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
