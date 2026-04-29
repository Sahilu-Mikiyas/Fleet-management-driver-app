import React, { useRef, useEffect, useState } from "react";
import {
  ScrollView, Text, View, Pressable, Alert, Modal, TextInput, ActivityIndicator,
  Animated, Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { driverApi, authApi } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-border/50">
      <Text className="text-xs font-bold text-muted uppercase tracking-widest">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
}

function AnimatedCard({ children, delay = 0 }: AnimatedCardProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 18,
      delay,
    }).start();
  }, []);
  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function ProfileContent() {
  const router = useRouter();
  const colors = useColors();
  const { driver, signOut, refreshDriver } = useAuth();
  const [isOnDuty, setIsOnDuty] = useState(driver?.isAvailable ?? false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [driverProfile, setDriverProfile] = useState<any>(null);

  useEffect(() => {
    driverApi.getProfile()
      .then(res => setDriverProfile(res.data?.data?.driver ?? res.data?.data ?? null))
      .catch(() => {});
  }, []);

  // Header animation
  const headerAnim = useRef(new Animated.Value(0)).current;
  // Pulsing duty indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 20,
    }).start();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    if (isOnDuty) loop.start();
    else loop.stop();
    return () => loop.stop();
  }, [isOnDuty]);

  useEffect(() => {
    if (driver) setIsOnDuty(driver.isAvailable);
  }, [driver?.isAvailable]);

  const handleToggleAvailability = async () => {
    const newStatus = !isOnDuty;
    setIsOnDuty(newStatus);
    setIsTogglingStatus(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await driverApi.updateStatus(newStatus ? "ACTIVE" : "INACTIVE", newStatus);
      await refreshDriver();
    } catch (error) {
      setIsOnDuty(!newStatus);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update status");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Required", "Please fill in all password fields."); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords don't match."); return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Too Short", "Password must be at least 8 characters."); return;
    }
    setIsChangingPassword(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await authApi.updatePassword(currentPassword, newPassword, confirmPassword);
      setShowPasswordModal(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("✅ Updated", "Your password has been changed successfully.");
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Could not change password.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login" as any);
          } catch {
            Alert.alert("Error", "Failed to sign out");
          }
        },
      },
    ]);
  };

  const initials = (driver?.name ?? "D")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = driver?.createdAt
    ? new Date(driver.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Hero Header ── */}
      <Animated.View
        className="bg-navy px-6 pt-10 pb-8 items-center"
        style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
        }}
      >
        {/* Avatar circle */}
        <View
          className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-3"
          style={{ borderWidth: 3, borderColor: colors.primary }}
        >
          <Text className="text-3xl font-bold text-primary">{initials}</Text>
        </View>

        <Text className="text-white text-xl font-bold text-center">{driver?.name || "Driver"}</Text>
        {driver?.email && (
          <Text className="text-white/60 text-xs mt-0.5">{driver.email}</Text>
        )}
        {driver?.phoneNumber && (
          <Text className="text-white/60 text-xs mt-0.5">{driver.phoneNumber}</Text>
        )}

        {/* Badges row */}
        <View className="flex-row gap-2 mt-4 flex-wrap justify-center">
          <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/40">
            <Text className="text-primary text-xs font-bold">{driver?.role || "DRIVER"}</Text>
          </View>
          <View className={`px-3 py-1 rounded-full border ${driver?.isApproved ? "bg-success/20 border-success/40" : "bg-warning/20 border-warning/40"}`}>
            <Text className={`text-xs font-bold ${driver?.isApproved ? "text-success" : "text-warning"}`}>
              {driver?.isApproved ? "✓ Approved" : driver?.status || "Pending"}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View className="px-4 pt-5 gap-4">

        {/* ── Duty Toggle Card ── */}
        <AnimatedCard delay={80}>
          <View className="bg-surface rounded-2xl border border-border p-5">
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-bold text-foreground">Availability Status</Text>
                <Text className="text-xs text-muted mt-0.5">
                  {isOnDuty ? "You're visible to dispatch" : "You won't receive new assignments"}
                </Text>
              </View>

              {/* Animated indicator + toggle */}
              <Pressable
                onPress={handleToggleAvailability}
                disabled={isTogglingStatus}
                style={{ opacity: isTogglingStatus ? 0.6 : 1 }}
              >
                <View className={`flex-row items-center gap-2 px-4 py-2.5 rounded-2xl ${isOnDuty ? "bg-success/15 border border-success/30" : "bg-error/10 border border-error/20"}`}>
                  <Animated.View
                    style={{ transform: [{ scale: isOnDuty ? pulseAnim : 1 }] }}
                    className={`w-2.5 h-2.5 rounded-full ${isOnDuty ? "bg-success" : "bg-error"}`}
                  />
                  <Text className={`text-sm font-bold ${isOnDuty ? "text-success" : "text-error"}`}>
                    {isTogglingStatus ? "Updating…" : isOnDuty ? "On Duty" : "Off Duty"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </AnimatedCard>

        {/* ── Account Info Card ── */}
        <AnimatedCard delay={160}>
          <View className="bg-surface rounded-2xl border border-border px-5 pb-2 pt-4">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Account</Text>
            <InfoRow label="Full Name" value={driver?.name || "—"} />
            <InfoRow label="Email" value={driver?.email || "—"} />
            <InfoRow label="Phone" value={driver?.phoneNumber || "—"} />
            <InfoRow label="Role" value={driver?.role || "—"} />
            <InfoRow label="Status" value={driver?.status || "—"} />
          </View>
        </AnimatedCard>

        {/* ── Driver Application Card ── */}
        {driverProfile && (
          <AnimatedCard delay={200}>
            <View className="bg-surface rounded-2xl border border-border px-5 pb-2 pt-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Driver Application</Text>
              {driverProfile.fullName && <InfoRow label="Full Name" value={driverProfile.fullName} />}
              {driverProfile.email && <InfoRow label="Email" value={driverProfile.email} />}
              {driverProfile.phoneNumber && <InfoRow label="Phone" value={driverProfile.phoneNumber} />}
              {driverProfile.vehicleType && <InfoRow label="Vehicle Type" value={driverProfile.vehicleType} />}
              {driverProfile.licenseNumber && <InfoRow label="License #" value={driverProfile.licenseNumber} />}
              <InfoRow label="Status" value={driverProfile.status || "—"} />
            </View>
          </AnimatedCard>
        )}

        {/* ── Settings Items ── */}
        <AnimatedCard delay={240}>
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            {[
              { icon: "🔔", label: "Notifications", onPress: () => {} },
              { icon: "🌓", label: "Appearance", onPress: () => {} },
              { icon: "🔒", label: "Change Password", onPress: () => setShowPasswordModal(true) },
              { icon: "❓", label: "Help & Support", onPress: () => {} },
            ].map((item, i, arr) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className={`flex-row items-center px-5 py-4 gap-3 ${i < arr.length - 1 ? "border-b border-border/50" : ""}`}>
                  <Text className="text-lg">{item.icon}</Text>
                  <Text className="flex-1 text-sm font-semibold text-foreground">{item.label}</Text>
                  <Text className="text-muted text-sm">›</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </AnimatedCard>

        {/* ── Sign Out ── */}
        <AnimatedCard delay={320}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View className="bg-error/10 border border-error/20 rounded-2xl py-4 flex-row items-center justify-center gap-2">
              <Text className="text-lg">🚪</Text>
              <Text className="text-error font-bold text-base">Sign Out</Text>
            </View>
          </Pressable>
        </AnimatedCard>

        {/* App version note */}
        <Text className="text-center text-xs text-muted/60 mt-2">Fleet Driver v1.0.0</Text>
      </View>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-10 px-6">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-foreground">Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)}>
                <View className="w-8 h-8 bg-surface rounded-full items-center justify-center border border-border">
                  <Text className="text-foreground font-bold text-xs">✕</Text>
                </View>
              </Pressable>
            </View>
            <View className="gap-4">
              {[
                { label: "Current Password", value: currentPassword, onChange: setCurrentPassword },
                { label: "New Password", value: newPassword, onChange: setNewPassword },
                { label: "Confirm New Password", value: confirmPassword, onChange: setConfirmPassword },
              ].map(({ label, value, onChange }) => (
                <View key={label}>
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2">{label}</Text>
                  <TextInput
                    secureTextEntry
                    value={value}
                    onChangeText={onChange}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    style={{ color: colors.foreground }}
                    className="bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm"
                  />
                </View>
              ))}
            </View>
            <Pressable
              onPress={handleChangePassword}
              disabled={isChangingPassword}
              className="mt-6"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], opacity: isChangingPassword ? 0.6 : 1 }]}
            >
              <View className="bg-primary rounded-2xl py-4 items-center">
                {isChangingPassword
                  ? <ActivityIndicator color="white" />
                  : <Text className="text-white font-bold text-base">Update Password</Text>
                }
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>
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
