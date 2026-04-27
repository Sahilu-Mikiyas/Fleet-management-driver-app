import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Linking, Platform, Alert } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
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
  pricing?: { proposedBudget?: number; currency?: string };
}

interface ActiveTripProps {
  assignment: Assignment | null;
  isLoading: boolean;
  onRefresh: () => void;
}

// ── Status Timeline Steps (Synced with Backend State Machine) ──
const TIMELINE_STEPS = [
  { key: "ASSIGNED",            label: "Assigned",   icon: "📋" },
  { key: "STARTED",             label: "Started",    icon: "🚀" },
  { key: "ARRIVED_AT_PICKUP",   label: "At Pickup",  icon: "📍" },
  { key: "PICKED_UP",           label: "Picked Up",  icon: "📦" },
  { key: "IN_TRANSIT",          label: "In Transit", icon: "🚚" },
  { key: "ARRIVED_AT_DELIVERY", label: "At Dest.",   icon: "🏁" },
  { key: "DELIVERED",           label: "Delivered",  icon: "✅" },
];

function getStepIndex(status: string): number {
  const normalized = status?.toUpperCase();
  // Map some variations if necessary
  if (normalized === "ARRIVED") return 2; // ARRIVED_AT_PICKUP
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

export function ActiveTrip({ assignment, isLoading, onRefresh }: ActiveTripProps) {
  const colors = useColors();
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  // ── Fetch Current Location ──
  const updateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation(loc);
      return loc;
    } catch (e) {
      console.error("Location error:", e);
      return null;
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  const handleNextMilestone = async () => {
    if (!assignment || actionLoading) return;
    setActionLoading(true);
    
    try {
      const loc = await updateLocation();
      const currentIdx = getStepIndex(assignment.status);
      const nextStep = TIMELINE_STEPS[currentIdx + 1];
      
      if (!nextStep) return;

      // Call the corresponding API based on the next milestone
      switch (nextStep.key) {
        case "STARTED":
          await driverApi.startAssignment(assignment._id);
          break;
        case "ARRIVED_AT_PICKUP":
          await driverApi.arriveAtPickup(assignment._id);
          break;
        case "DELIVERED":
          setIsVerificationModalVisible(true);
          setActionLoading(false);
          return;
        default:
          await driverApi.updateMilestone(assignment._id, nextStep.key);
      }

      // Stream the location linked to this milestone
      if (loc) {
        await driverApi.streamLocation(
          assignment._id,
          loc.coords.longitude,
          loc.coords.latitude,
          loc.coords.speed || 0,
          loc.coords.heading || 0
        );
      }

      onRefresh();
    } catch (error: any) {
      Alert.alert("Status Update Failed", error.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 items-center justify-center p-8 mt-10">
        <View className="w-20 h-20 rounded-full bg-muted/20 items-center justify-center mb-6">
          <Text className="text-4xl text-muted">🏜️</Text>
        </View>
        <Text className="text-xl font-bold text-foreground text-center mb-2">No Active Trips</Text>
        <Text className="text-sm text-muted text-center px-4">
          You are not currently executing any trips. Accept a pending assignment or bid on a marketplace load to start driving.
        </Text>
      </View>
    );
  }

  const currentIdx = getStepIndex(assignment.status);
  const nextStep = TIMELINE_STEPS[currentIdx + 1];

  const handleOpenNavigation = () => {
    const target = currentIdx >= 3 ? assignment.deliveryLocation : assignment.pickupLocation;
    if (target?.latitude) {
      const url = Platform.select({
        ios: `maps://app?daddr=${target.latitude},${target.longitude}`,
        android: `google.navigation:q=${target.latitude},${target.longitude}`,
        default: `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`,
      });
      Linking.openURL(url!);
    }
  };

  const handleMilestone = async (type: "start" | "arrive") => {
    if (!assignment || actionLoading) return;
    setActionLoading(true);
    try {
      const loc = await updateLocation();
      if (type === "start") {
        await driverApi.startAssignment(assignment._id);
      } else {
        await driverApi.arriveAtPickup(assignment._id);
      }
      if (loc) {
        await driverApi.streamLocation(
          assignment._id,
          loc.coords.longitude,
          loc.coords.latitude,
          loc.coords.speed || 0,
          loc.coords.heading || 0
        );
      }
      onRefresh();
    } catch (error: any) {
      Alert.alert("Status Update Failed", error.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* ── Real-time Map View ── */}
        <View className="h-64 w-full bg-muted overflow-hidden">
          <MapView
            provider={PROVIDER_GOOGLE}
            className="flex-1"
            initialRegion={{
              latitude: assignment.pickupLocation?.latitude || 9.03,
              longitude: assignment.pickupLocation?.longitude || 38.74,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation
            scrollEnabled={true}
            zoomEnabled={true}
          >
            {assignment.pickupLocation?.latitude && (
              <Marker
                coordinate={{ latitude: assignment.pickupLocation.latitude!, longitude: assignment.pickupLocation.longitude! }}
                title="Pickup"
                pinColor="blue"
              />
            )}
            {assignment.deliveryLocation?.latitude && (
              <Marker
                coordinate={{ latitude: assignment.deliveryLocation.latitude!, longitude: assignment.deliveryLocation.longitude! }}
                title="Delivery"
                pinColor="green"
              />
            )}
            {assignment.pickupLocation?.latitude && assignment.deliveryLocation?.latitude && (
              <Polyline
                coordinates={[
                  { latitude: assignment.pickupLocation.latitude!, longitude: assignment.pickupLocation.longitude! },
                  { latitude: assignment.deliveryLocation.latitude!, longitude: assignment.deliveryLocation.longitude! },
                ]}
                strokeColor={colors.primary}
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>
          
          <Pressable 
            onPress={() => {
              const target = (currentIdx >= 3) ? assignment.deliveryLocation : assignment.pickupLocation;
              if (target?.latitude) {
                const url = Platform.select({
                  ios: `maps://app?daddr=${target.latitude},${target.longitude}`,
                  android: `google.navigation:q=${target.latitude},${target.longitude}`,
                  default: `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`,
                });
                Linking.openURL(url);
              }
            }}
            className="absolute bottom-4 right-4 bg-primary px-4 py-2 rounded-full shadow-lg flex-row items-center gap-2"
          >
            <Text className="text-white font-bold">Open GPS</Text>
            <Text>🧭</Text>
          </Pressable>
        </View>

        <View className="px-4 mt-4 gap-4">
          {/* ── Status Timeline ── */}
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm">
            <Text className="text-xs font-bold text-muted mb-4 uppercase tracking-widest">Trip Progress</Text>
            <View className="flex-row justify-between items-start px-1">
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index <= currentIdx;
                const isCurrent = index === currentIdx;
                return (
                  <View key={step.key} className="items-center flex-1">
                    <View className="flex-row items-center w-full">
                      {index > 0 && <View className={`flex-1 h-[2px] ${index <= currentIdx ? "bg-primary" : "bg-border"}`} />}
                      <View className={`w-7 h-7 rounded-full items-center justify-center ${
                        isCurrent ? "bg-primary" : isCompleted ? "bg-primary/80" : "bg-surface border-2 border-border"
                      }`}>
                        <Text className="text-[10px]">{isCompleted ? step.icon : "○"}</Text>
                      </View>
                      {index < TIMELINE_STEPS.length - 1 && <View className={`flex-1 h-[2px] ${index < currentIdx ? "bg-primary" : "bg-border"}`} />}
                    </View>
                    <Text className={`text-[8px] mt-1 text-center ${isCurrent ? "text-primary font-bold" : "text-muted"}`} numberOfLines={1}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Cargo Details ── */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xl font-bold text-foreground">{assignment.title}</Text>
                <Text className="text-sm text-muted">{assignment.cargo?.description || "Cargo Details"}</Text>
              </View>
              <View className="bg-primary/10 px-3 py-1 rounded-lg">
                <Text className="text-primary font-bold">{assignment.pricing?.currency} {assignment.pricing?.proposedBudget?.toLocaleString()}</Text>
              </View>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center"><Text>📦</Text></View>
                <View>
                  <Text className="text-xs text-muted">Weight</Text>
                  <Text className="text-sm font-semibold">{assignment.cargo?.weightKg} kg</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-green-50 items-center justify-center"><Text>📍</Text></View>
                <View className="flex-1">
                  <Text className="text-xs text-muted">Destination</Text>
                  <Text className="text-sm font-semibold" numberOfLines={1}>{assignment.deliveryLocation?.city}, {assignment.deliveryLocation?.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Milestone Action ── */}
          {nextStep && (
            <Pressable
              onPress={handleNextMilestone}
              disabled={actionLoading}
              className="bg-primary rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }], opacity: actionLoading ? 0.7 : 1 }]}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg mr-2">
                    Update to: {nextStep.label}
                  </Text>
                </>
              )}
            </Pressable>
          )}
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
    </View>
  );
}
