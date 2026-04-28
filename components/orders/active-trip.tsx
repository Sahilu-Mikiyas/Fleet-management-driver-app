import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  Linking, Platform, Alert, TextInput, Animated, Easing,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { driverApi, geofencesApi } from "@/lib/api-client";
import { DeliveryVerificationModal } from "./delivery-verification-modal";

interface LocationPoint {
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
}

interface Assignment {
  _id: string;
  title: string;
  status: string;
  pickupLocation?: LocationPoint;
  deliveryLocation?: LocationPoint;
  cargo?: { description?: string; weightKg?: number; type?: string; quantity?: number; unit?: string };
  pricing?: { proposedBudget?: number; currency?: string };
  vehicleInfo?: { plateNumber?: string; type?: string; model?: string };
}

interface ActiveTripProps {
  assignment: Assignment | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const TIMELINE_STEPS = [
  { key: "ASSIGNED",            label: "Assigned",   icon: "📋", color: "#64748B" },
  { key: "STARTED",             label: "Started",    icon: "🚀", color: "#3B82F6" },
  { key: "ARRIVED_AT_PICKUP",   label: "At Pickup",  icon: "📍", color: "#F68E27" },
  { key: "PICKED_UP",           label: "Picked Up",  icon: "📦", color: "#F68E27" },
  { key: "IN_TRANSIT",          label: "In Transit", icon: "🚚", color: "#F49E0A" },
  { key: "ARRIVED_AT_DELIVERY", label: "At Dest.",   icon: "🏁", color: "#21C45D" },
  { key: "DELIVERED",           label: "Delivered",  icon: "✅", color: "#21C45D" },
];

function getStepIndex(status: string): number {
  const normalized = status?.toUpperCase();
  if (normalized === "ARRIVED") return 2;
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}

// Animated card wrapper
function AnimatedCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 22 }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={[{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

interface Coord { latitude: number; longitude: number }

async function fetchOsrmRoute(
  fromLng: number, fromLat: number,
  toLng: number, toLat: number
): Promise<Coord[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    const coords: [number, number][] = json.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  } catch {
    return [
      { latitude: fromLat, longitude: fromLng },
      { latitude: toLat, longitude: toLng },
    ];
  }
}

export function ActiveTrip({ assignment, isLoading, onRefresh }: ActiveTripProps) {
  const colors = useColors();
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [milestoneNote, setMilestoneNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [geofenceWarning, setGeofenceWarning] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const geofencePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (geofenceWarning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(geofencePulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
          Animated.timing(geofencePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [geofenceWarning]);

  // Fetch OSRM route when assignment changes
  useEffect(() => {
    if (!assignment) { setRouteCoords([]); return; }
    const p = assignment.pickupLocation;
    const d = assignment.deliveryLocation;
    if (p?.latitude && p?.longitude && d?.latitude && d?.longitude) {
      fetchOsrmRoute(p.longitude, p.latitude, d.longitude, d.latitude)
        .then(setRouteCoords);
    }
  }, [assignment?._id]);

  // Stream GPS location and check geofences every 30 seconds during active trip
  useEffect(() => {
    if (!assignment || !["STARTED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_DELIVERY"].includes(assignment.status?.toUpperCase())) return;
    const stream = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await driverApi.streamLocation(
          assignment._id,
          loc.coords.longitude,
          loc.coords.latitude,
          loc.coords.speed || 0,
          loc.coords.heading || 0
        );
        // Check geofences
        const geoResult = await geofencesApi.checkLocation(loc.coords.latitude, loc.coords.longitude, assignment._id);
        if ((geoResult?.data as any)?.isRestricted) {
          setGeofenceWarning("⚠️ You are in a restricted zone!");
        } else {
          setGeofenceWarning(null);
        }
      } catch (_) {}
    };
    stream();
    const interval = setInterval(stream, 30_000);
    return () => clearInterval(interval);
  }, [assignment?._id, assignment?.status]);

  const callContact = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenNavigation = (currentIdx: number) => {
    const target = currentIdx >= 3 ? assignment?.deliveryLocation : assignment?.pickupLocation;
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      let loc = null;
      if (status === "granted") {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      if (type === "start") {
        await driverApi.startAssignment(assignment._id);
      } else {
        await driverApi.arriveAtPickup(assignment._id);
      }
      if (loc) {
        await driverApi.streamLocation(
          assignment._id, loc.coords.longitude, loc.coords.latitude,
          loc.coords.speed || 0, loc.coords.heading || 0
        );
      }
      setMilestoneNote("");
      setShowNoteInput(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRefresh();
    } catch (error: any) {
      Alert.alert("Update Failed", error.message || "Something went wrong.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNextMilestone = async () => {
    if (!assignment || actionLoading) return;
    setActionLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let loc = null;
      if (status === "granted") {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      const currentIdx = getStepIndex(assignment.status);
      const nextStep = TIMELINE_STEPS[currentIdx + 1];
      if (!nextStep) return;

      switch (nextStep.key) {
        case "STARTED":          await driverApi.startAssignment(assignment._id); break;
        case "ARRIVED_AT_PICKUP": await driverApi.arriveAtPickup(assignment._id); break;
        case "DELIVERED":
          setActionLoading(false);
          setIsVerificationModalVisible(true);
          return;
        default:
          await driverApi.updateMilestone(assignment._id, nextStep.key, {
            longitude: loc?.coords.longitude,
            latitude: loc?.coords.latitude,
            note: milestoneNote.trim() || undefined,
          });
      }
      if (loc) {
        await driverApi.streamLocation(
          assignment._id, loc.coords.longitude, loc.coords.latitude,
          loc.coords.speed || 0, loc.coords.heading || 0
        );
      }
      setMilestoneNote("");
      setShowNoteInput(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRefresh();
    } catch (error: any) {
      Alert.alert("Status Update Failed", error.message || "Something went wrong.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted text-sm mt-3">Loading trip details...</Text>
      </View>
    );
  }

  if (!assignment) {
    return (
      <View className="flex-1 items-center justify-center p-8 mt-10">
        <View className="w-24 h-24 rounded-3xl bg-primary/10 items-center justify-center mb-6">
          <Text className="text-5xl">🏜️</Text>
        </View>
        <Text className="text-xl font-bold text-foreground text-center mb-2">No Active Trip</Text>
        <Text className="text-sm text-muted text-center px-4 leading-5">
          You don't have an active trip. Accept a pending assignment or bid on a marketplace load to get started.
        </Text>
      </View>
    );
  }

  const currentIdx = getStepIndex(assignment.status);
  const nextStep = TIMELINE_STEPS[currentIdx + 1];
  const status = assignment.status?.toUpperCase();

  return (
    <View className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Geofence Warning Banner ── */}
        {geofenceWarning && (
          <Animated.View
            style={{ transform: [{ scale: geofencePulse }] }}
            className="mx-4 mt-3 bg-error/15 border border-error/40 rounded-xl px-4 py-3 flex-row items-center gap-3"
          >
            <Text className="text-xl">🚫</Text>
            <View className="flex-1">
              <Text className="text-error font-bold text-sm">Restricted Zone Detected</Text>
              <Text className="text-error/80 text-xs mt-0.5">{geofenceWarning}</Text>
            </View>
          </Animated.View>
        )}

        {/* ── Live Map ── */}
        <AnimatedCard delay={0}>
          <View className="h-52 mx-4 mt-3 rounded-2xl overflow-hidden border border-border shadow-sm">
            <MapView
              provider={PROVIDER_GOOGLE}
              className="flex-1"
              initialRegion={{
                latitude: assignment.pickupLocation?.latitude || 9.03,
                longitude: assignment.pickupLocation?.longitude || 38.74,
                latitudeDelta: 0.12,
                longitudeDelta: 0.12,
              }}
              showsUserLocation
              scrollEnabled
              zoomEnabled
            >
              {assignment.pickupLocation?.latitude && (
                <Marker
                  coordinate={{ latitude: assignment.pickupLocation.latitude!, longitude: assignment.pickupLocation.longitude! }}
                  title="Pickup"
                  pinColor="#3B82F6"
                />
              )}
              {assignment.deliveryLocation?.latitude && (
                <Marker
                  coordinate={{ latitude: assignment.deliveryLocation.latitude!, longitude: assignment.deliveryLocation.longitude! }}
                  title="Delivery"
                  pinColor="#21C45D"
                />
              )}
              {routeCoords.length > 1 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={colors.primary}
                  strokeWidth={4}
                />
              )}
            </MapView>
            {/* GPS overlay button */}
            <Pressable
              onPress={() => handleOpenNavigation(currentIdx)}
              className="absolute bottom-3 right-3 bg-primary px-3 py-2 rounded-xl shadow-lg flex-row items-center gap-1.5"
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <Text className="text-base">🧭</Text>
              <Text className="text-white font-bold text-xs">Navigate</Text>
            </Pressable>
          </View>
        </AnimatedCard>

        <View className="px-4 mt-3 gap-3">

          {/* ── Progress Timeline ── */}
          <AnimatedCard delay={60}>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Trip Progress</Text>
              <View className="flex-row justify-between items-start">
                {TIMELINE_STEPS.map((step, index) => {
                  const isCompleted = index < currentIdx;
                  const isCurrent = index === currentIdx;
                  const isUpcoming = index > currentIdx;
                  return (
                    <View key={step.key} className="items-center flex-1">
                      <View className="flex-row items-center w-full">
                        {index > 0 && (
                          <View className={`flex-1 h-0.5 ${index <= currentIdx ? "bg-primary" : "bg-border"}`} />
                        )}
                        <View
                          className={`w-7 h-7 rounded-full items-center justify-center ${
                            isCurrent ? "bg-primary" : isCompleted ? "bg-primary/70" : "bg-surface border-2 border-border"
                          }`}
                        >
                          <Text className="text-[9px]">
                            {isCompleted ? "✓" : isCurrent ? step.icon : "○"}
                          </Text>
                        </View>
                        {index < TIMELINE_STEPS.length - 1 && (
                          <View className={`flex-1 h-0.5 ${index < currentIdx ? "bg-primary" : "bg-border"}`} />
                        )}
                      </View>
                      <Text
                        className={`text-[7px] mt-1 text-center font-medium ${isCurrent ? "text-primary" : isUpcoming ? "text-muted/60" : "text-muted"}`}
                        numberOfLines={1}
                      >
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View className="mt-3 pt-3 border-t border-border flex-row items-center justify-between">
                <Text className="text-xs text-muted">Current status</Text>
                <View className="bg-primary/15 px-3 py-1 rounded-full">
                  <Text className="text-primary text-xs font-bold">{TIMELINE_STEPS[currentIdx]?.label ?? status}</Text>
                </View>
              </View>
            </View>
          </AnimatedCard>

          {/* ── Load Details ── */}
          <AnimatedCard delay={120}>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-foreground" numberOfLines={1}>{assignment.title}</Text>
                  {assignment.cargo?.type && (
                    <Text className="text-xs text-muted mt-0.5">{assignment.cargo.type}</Text>
                  )}
                </View>
                {assignment.pricing?.proposedBudget && (
                  <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                    <Text className="text-primary font-bold text-sm">
                      {assignment.pricing.currency ?? "ETB"} {assignment.pricing.proposedBudget.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              <View className="gap-2">
                {assignment.cargo?.weightKg && (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">⚖️</Text>
                    <Text className="text-sm text-muted">Weight</Text>
                    <Text className="text-sm font-semibold text-foreground ml-auto">{assignment.cargo.weightKg} kg</Text>
                  </View>
                )}
                {assignment.cargo?.quantity && (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">📦</Text>
                    <Text className="text-sm text-muted">Quantity</Text>
                    <Text className="text-sm font-semibold text-foreground ml-auto">
                      {assignment.cargo.quantity} {assignment.cargo.unit ?? "units"}
                    </Text>
                  </View>
                )}
                {assignment.cargo?.description && (
                  <View className="flex-row items-start gap-2">
                    <Text className="text-base">📝</Text>
                    <Text className="text-sm text-muted flex-1">{assignment.cargo.description}</Text>
                  </View>
                )}
                {assignment.vehicleInfo?.plateNumber && (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">🚛</Text>
                    <Text className="text-sm text-muted">Vehicle</Text>
                    <Text className="text-sm font-semibold text-foreground ml-auto">
                      {assignment.vehicleInfo.plateNumber}
                      {assignment.vehicleInfo.type ? ` · ${assignment.vehicleInfo.type}` : ""}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </AnimatedCard>

          {/* ── Pickup Contact ── */}
          {(assignment.pickupLocation?.city || assignment.pickupLocation?.contactName) && (
            <AnimatedCard delay={160}>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Pickup</Text>
                <View className="gap-2">
                  {assignment.pickupLocation?.address && (
                    <View className="flex-row items-start gap-2">
                      <Text className="text-base">📍</Text>
                      <Text className="text-sm text-foreground flex-1">
                        {assignment.pickupLocation.address}{assignment.pickupLocation.city ? `, ${assignment.pickupLocation.city}` : ""}
                      </Text>
                    </View>
                  )}
                  {assignment.pickupLocation?.contactName && (
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 flex-1">
                        <Text className="text-base">👤</Text>
                        <Text className="text-sm text-foreground">{assignment.pickupLocation.contactName}</Text>
                      </View>
                      {assignment.pickupLocation.contactPhone && (
                        <Pressable
                          onPress={() => callContact(assignment.pickupLocation?.contactPhone)}
                          className="bg-primary/15 border border-primary/25 px-3 py-1.5 rounded-xl flex-row items-center gap-1"
                        >
                          <Text className="text-sm">📞</Text>
                          <Text className="text-primary text-xs font-bold">Call</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </AnimatedCard>
          )}

          {/* ── Delivery Contact ── */}
          {(assignment.deliveryLocation?.city || assignment.deliveryLocation?.contactName) && (
            <AnimatedCard delay={200}>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Delivery</Text>
                <View className="gap-2">
                  {assignment.deliveryLocation?.address && (
                    <View className="flex-row items-start gap-2">
                      <Text className="text-base">🏁</Text>
                      <Text className="text-sm text-foreground flex-1">
                        {assignment.deliveryLocation.address}{assignment.deliveryLocation.city ? `, ${assignment.deliveryLocation.city}` : ""}
                      </Text>
                    </View>
                  )}
                  {assignment.deliveryLocation?.contactName && (
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 flex-1">
                        <Text className="text-base">👤</Text>
                        <Text className="text-sm text-foreground">{assignment.deliveryLocation.contactName}</Text>
                      </View>
                      {assignment.deliveryLocation.contactPhone && (
                        <Pressable
                          onPress={() => callContact(assignment.deliveryLocation?.contactPhone)}
                          className="bg-success/15 border border-success/25 px-3 py-1.5 rounded-xl flex-row items-center gap-1"
                        >
                          <Text className="text-sm">📞</Text>
                          <Text className="text-success text-xs font-bold">Call</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </AnimatedCard>
          )}

          {/* ── Next Milestone Action ── */}
          {nextStep && (
            <AnimatedCard delay={240}>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Next Action</Text>

                {/* Optional note */}
                <Pressable
                  onPress={() => setShowNoteInput(!showNoteInput)}
                  className="flex-row items-center gap-2 mb-3"
                >
                  <Text className="text-sm text-primary font-medium">
                    {showNoteInput ? "▾ Hide note" : "▸ Add a note (optional)"}
                  </Text>
                </Pressable>
                {showNoteInput && (
                  <TextInput
                    value={milestoneNote}
                    onChangeText={setMilestoneNote}
                    placeholder="Add a note for this milestone..."
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={2}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground mb-3"
                    style={{ textAlignVertical: "top" }}
                  />
                )}

                <Pressable
                  onPress={handleNextMilestone}
                  disabled={actionLoading}
                  className={`rounded-xl py-3.5 flex-row items-center justify-center gap-2 ${actionLoading ? "bg-primary/50" : "bg-primary"}`}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-xl">{nextStep.icon}</Text>
                      <Text className="text-white font-bold text-base">Mark as {nextStep.label}</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </AnimatedCard>
          )}

          {/* ── State-Specific Quick Actions ── */}
          <AnimatedCard delay={280}>
            <View className="gap-2.5">
              {/* Navigate button — always visible */}
              <Pressable
                onPress={() => handleOpenNavigation(currentIdx)}
                className="bg-surface border border-primary/30 rounded-xl py-3.5 flex-row items-center justify-center gap-2"
                style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
              >
                <Text className="text-base">🗺️</Text>
                <Text className="text-primary font-bold text-sm">
                  {currentIdx >= 3 ? "Navigate to Delivery" : "Navigate to Pickup"}
                </Text>
              </Pressable>

              {status === "ASSIGNED" && (
                <Pressable
                  onPress={() => handleMilestone("start")}
                  disabled={actionLoading}
                  className={`rounded-xl py-3.5 flex-row items-center justify-center gap-2 ${actionLoading ? "bg-primary/50" : "bg-primary"}`}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  {actionLoading ? <ActivityIndicator color="white" /> : (
                    <>
                      <Text className="text-base">🚀</Text>
                      <Text className="text-white font-bold text-sm">Start Trip</Text>
                    </>
                  )}
                </Pressable>
              )}

              {(status === "STARTED" || status === "IN_TRANSIT") && (
                <Pressable
                  onPress={() => handleMilestone("arrive")}
                  disabled={actionLoading}
                  className={`rounded-xl py-3.5 flex-row items-center justify-center gap-2 ${actionLoading ? "bg-primary/50" : "bg-primary"}`}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  {actionLoading ? <ActivityIndicator color="white" /> : (
                    <>
                      <Text className="text-base">📍</Text>
                      <Text className="text-white font-bold text-sm">Report Arrival at Pickup</Text>
                    </>
                  )}
                </Pressable>
              )}

              {status === "ARRIVED" && (
                <Pressable
                  onPress={() => setIsVerificationModalVisible(true)}
                  className="bg-success rounded-xl py-3.5 flex-row items-center justify-center gap-2"
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
                >
                  <Text className="text-base">📸</Text>
                  <Text className="text-white font-bold text-sm">Verify & Complete Delivery</Text>
                </Pressable>
              )}
            </View>
          </AnimatedCard>

        </View>

        <View className="h-8" />
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
