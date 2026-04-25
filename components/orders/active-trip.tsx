import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Linking, Platform, Alert } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { driverApi } from "@/lib/api-client";
import { DeliveryVerificationModal } from "./delivery-verification-modal";

interface Assignment {
  _id: string;
  title: string;
  status: string;
  pickupLocation?: { address?: string; city?: string; latitude?: number; longitude?: number };
  deliveryLocation?: { address?: string; city?: string; latitude?: number; longitude?: number };
  cargo?: { description?: string; weightKg?: number };
}

interface ActiveTripProps {
  assignment: Assignment | null;
  isLoading: boolean;
  onRefresh: () => void;
}

// ── Status Timeline Steps ──
const TIMELINE_STEPS = [
  { key: "ASSIGNED",   label: "Assigned",   icon: "📋" },
  { key: "STARTED",    label: "Started",    icon: "🚀" },
  { key: "IN_TRANSIT", label: "In Transit", icon: "🚚" },
  { key: "ARRIVED",    label: "Arrived",    icon: "📍" },
  { key: "DELIVERED",  label: "Delivered",  icon: "✅" },
];

function getStepIndex(status: string): number {
  const normalized = status?.toUpperCase();
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

// ── Status Banner Config ──
function getStatusBanner(status: string) {
  const s = status?.toUpperCase();
  switch (s) {
    case "ASSIGNED":
      return { text: "ASSIGNED — WAITING TO START", bg: "bg-warning/10", border: "border-warning/20", textColor: "text-warning" };
    case "STARTED":
      return { text: "STARTED — EN ROUTE TO PICKUP", bg: "bg-blue-500/10", border: "border-blue-500/20", textColor: "text-blue-500" };
    case "IN_TRANSIT":
      return { text: "ON DUTY — IN TRANSIT", bg: "bg-primary/10", border: "border-primary/20", textColor: "text-primary" };
    case "ARRIVED":
      return { text: "ARRIVED — READY TO DELIVER", bg: "bg-success/10", border: "border-success/20", textColor: "text-success" };
    default:
      return { text: "ACTIVE TRIP", bg: "bg-primary/10", border: "border-primary/20", textColor: "text-primary" };
  }
}

export function ActiveTrip({ assignment, isLoading, onRefresh }: ActiveTripProps) {
  const colors = useColors();
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleMilestone = async (action: "start" | "arrive") => {
    if (!assignment || actionLoading) return;
    setActionLoading(true);
    try {
      if (action === "start") {
        await driverApi.startAssignment(assignment._id);
      } else {
        await driverApi.arriveAtPickup(assignment._id);
      }
      onRefresh();
    } catch (error: any) {
      Alert.alert("Action Failed", error.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Open Google Maps Navigation ──
  const handleOpenNavigation = () => {
    if (!assignment) return;
    const status = assignment.status?.toUpperCase();
    // If not yet arrived, navigate to pickup. If arrived, navigate to delivery.
    const target = (status === "ARRIVED" || status === "IN_TRANSIT")
      ? assignment.deliveryLocation
      : assignment.pickupLocation;

    if (target?.latitude && target?.longitude) {
      const url = Platform.select({
        ios: `maps://app?daddr=${target.latitude},${target.longitude}`,
        android: `google.navigation:q=${target.latitude},${target.longitude}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`,
      });
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web URL
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`);
      });
    } else {
      // Fallback: search by address
      const address = target?.address || target?.city || "Unknown";
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
    }
  };

  if (isLoading) {
    return (
      <View className="py-8 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-2">Loading active trip...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 items-center justify-center p-6 mt-10">
        <Text className="text-4xl mb-4">🛣️</Text>
        <Text className="text-lg font-semibold text-foreground text-center mb-2">
          No Active Trip
        </Text>
        <Text className="text-sm text-muted text-center">
          You are not currently executing any trips. Accept a pending assignment or bid on a marketplace load to start driving.
        </Text>
      </View>
    );
  }

  const currentStep = getStepIndex(assignment.status);
  const banner = getStatusBanner(assignment.status);
  const status = assignment.status?.toUpperCase();

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Status Banner */}
        <View className={`${banner.bg} border ${banner.border} rounded-xl p-4 flex-row items-center justify-between`}>
          <View className="flex-1">
            <Text className={`${banner.textColor} font-bold text-lg`}>{banner.text}</Text>
            <Text className="text-sm text-foreground font-semibold mt-1">{assignment.title || "Trip in progress"}</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-xl">🚚</Text>
          </View>
        </View>

        {/* ── Trip Status Timeline ── */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-sm font-bold text-muted mb-4 uppercase">Trip Progress</Text>
          <View className="flex-row justify-between items-start px-1">
            {TIMELINE_STEPS.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              return (
                <View key={step.key} className="items-center flex-1">
                  {/* Connector line (before this step) */}
                  <View className="flex-row items-center w-full">
                    {index > 0 && (
                      <View className={`flex-1 h-[2px] ${index <= currentStep ? "bg-primary" : "bg-border"}`} />
                    )}
                    <View className={`w-8 h-8 rounded-full items-center justify-center ${
                      isCurrent ? "bg-primary" : isCompleted ? "bg-primary/80" : "bg-surface border-2 border-border"
                    }`}>
                      <Text className="text-xs">{isCompleted ? step.icon : "○"}</Text>
                    </View>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <View className={`flex-1 h-[2px] ${index < currentStep ? "bg-primary" : "bg-border"}`} />
                    )}
                  </View>
                  <Text className={`text-[9px] mt-1 text-center ${isCurrent ? "text-primary font-bold" : isCompleted ? "text-foreground font-semibold" : "text-muted"}`}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Itinerary */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-sm font-bold text-muted mb-4 uppercase">Current Itinerary</Text>
          <View className="gap-0">
            {/* Pickup */}
            <View className="flex-row gap-4">
              <View className="items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                  status === "ARRIVED" || status === "DELIVERED" ? "bg-success/20 border-success" : "bg-blue-100 dark:bg-blue-900/40 border-blue-500"
                }`}>
                  <Text className="text-xs">{status === "ARRIVED" || status === "DELIVERED" ? "✓" : "1"}</Text>
                </View>
                <View className="w-[2px] h-12 bg-border my-1" />
              </View>
              <View className="flex-1 pb-6">
                <Text className="text-sm text-muted font-semibold">PICKUP</Text>
                <Text className="text-base text-foreground font-bold mt-1">
                  {assignment.pickupLocation?.address || "Unknown Address"}
                </Text>
                <Text className="text-sm text-muted">{assignment.pickupLocation?.city}</Text>
              </View>
            </View>
            {/* Delivery */}
            <View className="flex-row gap-4">
              <View className="items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                  status === "DELIVERED" ? "bg-success/20 border-success" : "bg-surface border-border"
                }`}>
                  <Text className="text-xs">{status === "DELIVERED" ? "✓" : "2"}</Text>
                </View>
              </View>
              <View className="flex-1 pb-2">
                <Text className="text-sm text-muted font-semibold">DELIVERY</Text>
                <Text className="text-base text-foreground font-bold mt-1">
                  {assignment.deliveryLocation?.address || "Unknown Address"}
                </Text>
                <Text className="text-sm text-muted">{assignment.deliveryLocation?.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cargo Quick Info */}
        {assignment.cargo && (
          <View className="bg-surface rounded-xl p-4 border border-border flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-muted">Cargo Content</Text>
              <Text className="text-sm font-semibold text-foreground mt-1">
                {assignment.cargo.description || "General Freight"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs text-muted">Weight</Text>
              <Text className="text-sm font-semibold text-foreground mt-1">
                {assignment.cargo.weightKg ? `${assignment.cargo.weightKg} kg` : "—"}
              </Text>
            </View>
          </View>
        )}

        {/* ── State-Aware Action Buttons ── */}
        <View className="gap-3 mt-4">
          {/* Navigation — always visible */}
          <Pressable
            onPress={handleOpenNavigation}
            className="bg-surface border border-primary/30 rounded-xl py-4 flex-row items-center justify-center gap-2"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-lg">🗺️</Text>
            <Text className="text-primary font-bold text-base">
              {status === "ARRIVED" ? "Navigate to Delivery" : "Navigate to Pickup"}
            </Text>
          </Pressable>

          {/* ASSIGNED → Show "Start Trip" */}
          {status === "ASSIGNED" && (
            <Pressable
              onPress={() => handleMilestone("start")}
              disabled={actionLoading}
              className={`rounded-xl py-4 flex-row items-center justify-center shadow-sm ${actionLoading ? "bg-primary/50" : "bg-primary"}`}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              {actionLoading ? <ActivityIndicator color="white" /> : (
                <Text className="text-white font-bold text-base text-center">🚀 Start Trip</Text>
              )}
            </Pressable>
          )}

          {/* STARTED / IN_TRANSIT → Show "Report Arrival" */}
          {(status === "STARTED" || status === "IN_TRANSIT") && (
            <Pressable
              onPress={() => handleMilestone("arrive")}
              disabled={actionLoading}
              className={`rounded-xl py-4 flex-row items-center justify-center shadow-sm ${actionLoading ? "bg-primary/50" : "bg-primary"}`}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              {actionLoading ? <ActivityIndicator color="white" /> : (
                <Text className="text-white font-bold text-base text-center">📍 Report Arrival</Text>
              )}
            </Pressable>
          )}

          {/* ARRIVED → Show "Complete & Upload POD" (OTP-gated) */}
          {status === "ARRIVED" && (
            <Pressable
              onPress={() => setIsVerificationModalVisible(true)}
              className="bg-success rounded-xl py-4 flex-row items-center justify-center shadow-sm"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <Text className="text-white font-bold text-base text-center">
                📸 Verify & Complete Delivery
              </Text>
            </Pressable>
          )}
        </View>

        <View className="h-12" />
      </ScrollView>

      <DeliveryVerificationModal
        tripId={assignment._id}
        isVisible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
        onSuccess={() => {
          setIsVerificationModalVisible(false);
          onRefresh();
        }}
      />
    </>
  );
}
