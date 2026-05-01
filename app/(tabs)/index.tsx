import React, { useEffect, useRef, useState } from "react";
import { ScrollView, View, Text, Animated, Easing, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { driverApi } from "@/lib/api-client";

function StatCard({ icon, label, value, sub, delay, color }: {
  icon: string; label: string; value: string; sub?: string; delay: number; color?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }], flex: 1 }}>
      <View className="bg-surface rounded-2xl p-4 border border-border" style={{ minHeight: 90 }}>
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

function QuickActionRow({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View className="bg-surface rounded-2xl px-4 py-3.5 border border-border flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
          <Text className="text-xl">{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          <Text className="text-xs text-muted mt-0.5">{sub}</Text>
        </View>
        <Text className="text-muted text-sm">›</Text>
      </View>
    </Pressable>
  );
}

export function HomeContent() {
  const colors = useColors();
  const router = useRouter();
  const { driver } = useAuth();
  const [commission, setCommission] = useState<{ available?: number; currency?: string } | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 140, friction: 18 }).start();
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
    driverApi.getCommission().then(res => setCommission(res.data?.data)).catch(() => {});
  }, []);

  const isOnline = driver?.isAvailable ?? false;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Navy header */}
      <Animated.View
        className="bg-navy px-5 pt-8 pb-6"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}
      >
        {/* Online/offline badge */}
        <View className="flex-row items-center gap-2 mb-5">
          <Animated.View style={{ transform: [{ scale: isOnline ? pulseAnim : 1 }] }}>
            <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isOnline ? colors.success : 'rgba(255,255,255,0.35)' }} />
          </Animated.View>
          <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: isOnline ? colors.success : 'rgba(255,255,255,0.35)' }}>
            {isOnline ? "Online · Ready" : "Offline · Off Duty"}
          </Text>
        </View>

        {/* Avatar + greeting */}
        <View className="flex-row items-center gap-4">
          <View className="w-16 h-16 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="text-3xl">🚛</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Welcome back</Text>
            <Text className="text-xl font-bold text-white" numberOfLines={1}>{driver?.name ?? "Driver"}</Text>
            <Text className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {driver?.role === "PRIVATE_TRANSPORTER" ? "Private Transporter" : "Company Driver"}
            </Text>
          </View>
          {isOnline && (
            <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Text className="text-lg">✅</Text>
            </View>
          )}
        </View>

        {/* Status caption */}
        <View className="mt-4 rounded-2xl px-4 py-3 flex-row items-center gap-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
          <Text className="text-xl">{isOnline ? "📡" : "😴"}</Text>
          <Text className="text-xs flex-1 leading-5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {isOnline
              ? "You're visible to dispatch. New assignments and marketplace loads will appear automatically."
              : "You're off duty. Toggle availability in Account to start receiving loads."}
          </Text>
        </View>
      </Animated.View>

      {/* Stats */}
      <View className="px-5 pt-5 gap-3">
        <Text className="text-xs font-bold text-muted uppercase tracking-widest">Today's Overview</Text>
        <View className="flex-row gap-3">
          <StatCard
            icon="💰" label="Balance"
            value={commission ? `${commission.currency ?? "ETB"} ${(commission.available ?? 0).toLocaleString()}` : "—"}
            sub="Available earnings" delay={100} color={colors.success}
          />
          <StatCard
            icon="🚦" label="Status"
            value={isOnline ? "Online" : "Offline"}
            sub={isOnline ? "Accepting loads" : "Go to Account →"}
            delay={180} color={isOnline ? colors.success : colors.muted}
          />
        </View>

        <Text className="text-xs font-bold text-muted uppercase tracking-widest mt-2">Quick Access</Text>
        <View className="gap-2.5">
          <QuickActionRow
            icon="📋" label="View active trip" sub="See your current assignment"
            onPress={() => router.navigate("/(tabs)/orders" as any)}
          />
          <QuickActionRow
            icon="🛒" label="Marketplace" sub="Browse open loads"
            onPress={() => router.navigate("/(tabs)/orders" as any)}
          />
          <QuickActionRow
            icon="📊" label="Trip history & earnings" sub="Review completed deliveries"
            onPress={() => router.navigate("/(tabs)/orders" as any)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default function HomeScreen() {
  return (
    <ScreenContainer className="p-0 bg-background" edges={["top"]}>
      <HomeContent />
    </ScreenContainer>
  );
}
