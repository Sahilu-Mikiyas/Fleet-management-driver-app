import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, ActivityIndicator,
  Linking, Platform, Alert, TextInput, Animated,
} from "react-native";
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

// Full milestone pipeline
const TIMELINE_STEPS = [
  { key: "ASSIGNED",            label: "Assigned",    icon: "📋", desc: "You have been assigned this load." },
  { key: "STARTED",             label: "En Route",    icon: "🚀", desc: "Head to the pickup location." },
  { key: "ARRIVED_AT_PICKUP",   label: "At Pickup",   icon: "📍", desc: "You have arrived — prepare to load cargo." },
  { key: "PICKED_UP",           label: "Loaded",      icon: "📦", desc: "Cargo is loaded — begin transit to delivery." },
  { key: "IN_TRANSIT",          label: "In Transit",  icon: "🚚", desc: "Head to the delivery destination." },
  { key: "ARRIVED_AT_DELIVERY", label: "At Delivery", icon: "🏁", desc: "You have arrived at the delivery address." },
  { key: "DELIVERED",           label: "Delivered",   icon: "✅", desc: "Complete with photo proof + receiver OTP." },
];

// What the NEXT button says for each current status
const NEXT_ACTION_LABEL: Record<string, string> = {
  ASSIGNED:            "Start Trip →",
  STARTED:             "Arrived at Pickup →",
  ARRIVED_AT_PICKUP:   "Cargo Loaded →",
  PICKED_UP:           "Begin Transit →",
  IN_TRANSIT:          "Arrived at Delivery →",
  ARRIVED_AT_DELIVERY: "Complete Delivery →",
};

function getStepIndex(status: string): number {
  const n = status?.toUpperCase();
  if (n === "ARRIVED") return 2; // legacy mapping
  const idx = TIMELINE_STEPS.findIndex(s => s.key === n);
  return idx >= 0 ? idx : 0;
}

function AnimatedCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

export function ActiveTrip({ assignment, isLoading, onRefresh }: ActiveTripProps) {
  const colors = useColors();
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [milestoneNote, setMilestoneNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [geofenceWarning, setGeofenceWarning] = useState<string | null>(null);
  const geofencePulse = useRef(new Animated.Value(1)).current;

  // Geofence warning pulse animation
  useEffect(() => {
    if (!geofenceWarning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(geofencePulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(geofencePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [geofenceWarning]);

  // Stream GPS location + check geofences every 30s during active trip
  useEffect(() => {
    const ACTIVE = ["STARTED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_DELIVERY"];
    if (!assignment || !ACTIVE.includes(assignment.status?.toUpperCase())) return;

    const stream = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await driverApi.streamLocation(
          assignment._id,
          loc.coords.longitude, loc.coords.latitude,
          loc.coords.speed ?? 0, loc.coords.heading ?? 0,
        );
        try {
          const geoResult = await geofencesApi.checkLocation(loc.coords.latitude, loc.coords.longitude, assignment._id);
          setGeofenceWarning((geoResult?.data as any)?.isRestricted ? "You are entering a restricted zone." : null);
        } catch {}
      } catch {}
    };

    stream();
    const interval = setInterval(stream, 30_000);
    return () => clearInterval(interval);
  }, [assignment?._id, assignment?.status]);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;
    return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  };

  const openNavigation = (target?: LocationPoint) => {
    if (!target?.latitude) return;
    const url = Platform.select({
      ios: `maps://app?daddr=${target.latitude},${target.longitude}`,
      android: `google.navigation:q=${target.latitude},${target.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`,
    });
    Linking.openURL(url!);
  };

  const callContact = (phone?: string) => { if (phone) Linking.openURL(`tel:${phone}`); };

  // Advance to next milestone
  const handleNextMilestone = async () => {
    if (!assignment || actionLoading) return;
    setActionLoading(true);

    try {
      const loc = await getLocation();
      const currentIdx = getStepIndex(assignment.status);
      const nextStep = TIMELINE_STEPS[currentIdx + 1];
      if (!nextStep) return;

      if (nextStep.key === "DELIVERED") {
        setActionLoading(false);
        setIsVerificationModalVisible(true);
        return;
      }

      switch (nextStep.key) {
        case "STARTED":
          await driverApi.startAssignment(assignment._id);
          break;
        case "ARRIVED_AT_PICKUP":
          await driverApi.arriveAtPickup(assignment._id);
          break;
        default:
          await driverApi.updateMilestone(assignment._id, nextStep.key, {
            longitude: loc?.coords.longitude,
            latitude: loc?.coords.latitude,
            note: milestoneNote.trim() || undefined,
          });
      }

      // Post location after milestone
      if (loc) {
        await driverApi.streamLocation(
          assignment._id,
          loc.coords.longitude, loc.coords.latitude,
          loc.coords.speed ?? 0, loc.coords.heading ?? 0,
        );
      }

      setMilestoneNote("");
      setShowNoteInput(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRefresh();
    } catch (error: any) {
      Alert.alert("Update Failed", error.message || "Could not update trip status.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted text-sm mt-3">Loading trip…</Text>
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
        <Text className="text-sm text-muted text-center leading-5">
          Accept a pending assignment or bid on a marketplace load to get started.
        </Text>
      </View>
    );
  }

  const currentIdx = getStepIndex(assignment.status);
  const currentStep = TIMELINE_STEPS[currentIdx];
  const nextStep = TIMELINE_STEPS[currentIdx + 1];
  const status = assignment.status?.toUpperCase();
  const isDelivered = status === "DELIVERED" || status === "COMPLETED";

  // Navigate to pickup if not yet picked up, otherwise delivery
  const navTarget = currentIdx < 3 ? assignment.pickupLocation : assignment.deliveryLocation;

  return (
    <View className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Geofence warning */}
        {geofenceWarning && (
          <Animated.View
            style={{ transform: [{ scale: geofencePulse }] }}
            className="mx-4 mt-3 bg-error/15 border border-error/40 rounded-2xl px-4 py-3 flex-row items-center gap-3"
          >
            <Text className="text-xl">🚫</Text>
            <View className="flex-1">
              <Text className="text-error font-bold text-sm">Restricted Zone</Text>
              <Text className="text-error/80 text-xs mt-0.5">{geofenceWarning}</Text>
            </View>
          </Animated.View>
        )}

        {/* Route overview card (replaces MapView — no native crash) */}
        <AnimatedCard delay={0}>
          <View className="mx-4 mt-3 rounded-2xl border border-border bg-navy overflow-hidden">
            {/* Header row */}
            <View className="px-4 pt-4 pb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-white text-sm font-bold">Route</Text>
                {assignment.status && (
                  <View className="bg-white/15 px-2 py-0.5 rounded-full">
                    <Text className="text-white/80 text-[10px] font-bold uppercase">{assignment.status.replace(/_/g, " ")}</Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => openNavigation(navTarget)}
                className="bg-primary px-3 py-1.5 rounded-xl flex-row items-center gap-1.5"
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
              >
                <Text className="text-sm">🧭</Text>
                <Text className="text-white font-bold text-xs">Navigate</Text>
              </Pressable>
            </View>

            {/* A → B route */}
            <View className="px-4 pb-4 flex-row gap-3">
              <View className="items-center pt-1">
                <View className="w-7 h-7 rounded-full bg-primary/25 border border-primary/50 items-center justify-center">
                  <Text className="text-[10px] font-bold text-primary">A</Text>
                </View>
                <View className="w-px flex-1 bg-white/15 my-1" style={{ minHeight: 24 }} />
                <View className="w-7 h-7 rounded-full bg-success/25 border border-success/50 items-center justify-center">
                  <Text className="text-[10px] font-bold text-success">B</Text>
                </View>
              </View>
              <View className="flex-1 justify-between gap-3">
                <View>
                  <Text className="text-white/50 text-[10px] uppercase tracking-wide">Pickup</Text>
                  <Text className="text-white font-semibold text-sm mt-0.5" numberOfLines={1}>
                    {assignment.pickupLocation?.city || assignment.pickupLocation?.address || "—"}
                  </Text>
                  {assignment.pickupLocation?.address && assignment.pickupLocation?.city && (
                    <Text className="text-white/50 text-xs mt-0.5" numberOfLines={1}>{assignment.pickupLocation.address}</Text>
                  )}
                </View>
                <View>
                  <Text className="text-white/50 text-[10px] uppercase tracking-wide">Delivery</Text>
                  <Text className="text-white font-semibold text-sm mt-0.5" numberOfLines={1}>
                    {assignment.deliveryLocation?.city || assignment.deliveryLocation?.address || "—"}
                  </Text>
                  {assignment.deliveryLocation?.address && assignment.deliveryLocation?.city && (
                    <Text className="text-white/50 text-xs mt-0.5" numberOfLines={1}>{assignment.deliveryLocation.address}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </AnimatedCard>

        <View className="px-4 mt-3 gap-3">

          {/* Progress timeline */}
          <AnimatedCard delay={60}>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Trip Progress</Text>
              <View className="flex-row justify-between items-start">
                {TIMELINE_STEPS.map((step, index) => {
                  const done = index < currentIdx;
                  const active = index === currentIdx;
                  return (
                    <View key={step.key} className="items-center flex-1">
                      <View className="flex-row items-center w-full">
                        {index > 0 && (
                          <View className={`flex-1 h-0.5 ${index <= currentIdx ? "bg-primary" : "bg-border"}`} />
                        )}
                        <View className={`w-7 h-7 rounded-full items-center justify-center ${active ? "bg-primary" : done ? "bg-primary/70" : "bg-surface border-2 border-border"}`}>
                          <Text className="text-[9px]">{done ? "✓" : active ? step.icon : "·"}</Text>
                        </View>
                        {index < TIMELINE_STEPS.length - 1 && (
                          <View className={`flex-1 h-0.5 ${index < currentIdx ? "bg-primary" : "bg-border"}`} />
                        )}
                      </View>
                      <Text className={`text-[7px] mt-1 text-center font-medium ${active ? "text-primary" : done ? "text-muted" : "text-muted/50"}`} numberOfLines={1}>
                        {step.label}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Current step description */}
              <View className="mt-3 pt-3 border-t border-border flex-row items-center gap-2">
                <Text className="text-lg">{currentStep?.icon}</Text>
                <Text className="text-xs text-muted flex-1 leading-4">{currentStep?.desc}</Text>
                <View className="bg-primary/15 px-3 py-1 rounded-full">
                  <Text className="text-primary text-[10px] font-bold">{currentStep?.label}</Text>
                </View>
              </View>
            </View>
          </AnimatedCard>

          {/* Load details */}
          <AnimatedCard delay={100}>
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-bold text-foreground" numberOfLines={1}>{assignment.title}</Text>
                  {assignment.cargo?.type && <Text className="text-xs text-muted mt-0.5">{assignment.cargo.type}</Text>}
                </View>
                {assignment.pricing?.proposedBudget ? (
                  <View className="bg-success/10 border border-success/20 px-3 py-1.5 rounded-xl">
                    <Text className="text-success font-bold text-sm">
                      {assignment.pricing.currency ?? "ETB"} {assignment.pricing.proposedBudget.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="gap-2">
                {assignment.cargo?.weightKg ? (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">⚖️</Text>
                    <Text className="text-sm text-muted flex-1">Weight</Text>
                    <Text className="text-sm font-semibold text-foreground">{assignment.cargo.weightKg} kg</Text>
                  </View>
                ) : null}
                {assignment.cargo?.quantity ? (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">📦</Text>
                    <Text className="text-sm text-muted flex-1">Quantity</Text>
                    <Text className="text-sm font-semibold text-foreground">{assignment.cargo.quantity} {assignment.cargo.unit ?? "units"}</Text>
                  </View>
                ) : null}
                {assignment.vehicleInfo?.plateNumber ? (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base">🚛</Text>
                    <Text className="text-sm text-muted flex-1">Vehicle</Text>
                    <Text className="text-sm font-semibold text-foreground">{assignment.vehicleInfo.plateNumber}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </AnimatedCard>

          {/* Route contacts */}
          {(assignment.pickupLocation?.address || assignment.pickupLocation?.contactName) ? (
            <AnimatedCard delay={140}>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 items-center justify-center">
                    <Text className="text-[9px] font-bold text-primary">A</Text>
                  </View>
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest">Pickup</Text>
                </View>
                {assignment.pickupLocation?.address ? (
                  <Text className="text-sm text-foreground mb-2">
                    {assignment.pickupLocation.address}{assignment.pickupLocation.city ? `, ${assignment.pickupLocation.city}` : ""}
                  </Text>
                ) : null}
                {assignment.pickupLocation?.contactName ? (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-sm">👤</Text>
                      <Text className="text-sm text-foreground">{assignment.pickupLocation.contactName}</Text>
                    </View>
                    {assignment.pickupLocation.contactPhone ? (
                      <Pressable onPress={() => callContact(assignment.pickupLocation?.contactPhone)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                        <View className="bg-primary/15 border border-primary/25 px-3 py-1.5 rounded-xl flex-row items-center gap-1">
                          <Text className="text-sm">📞</Text>
                          <Text className="text-primary text-xs font-bold">Call</Text>
                        </View>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </AnimatedCard>
          ) : null}

          {(assignment.deliveryLocation?.address || assignment.deliveryLocation?.contactName) ? (
            <AnimatedCard delay={170}>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-6 h-6 rounded-full bg-success/15 border border-success/30 items-center justify-center">
                    <Text className="text-[9px] font-bold text-success">B</Text>
                  </View>
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest">Delivery</Text>
                </View>
                {assignment.deliveryLocation?.address ? (
                  <Text className="text-sm text-foreground mb-2">
                    {assignment.deliveryLocation.address}{assignment.deliveryLocation.city ? `, ${assignment.deliveryLocation.city}` : ""}
                  </Text>
                ) : null}
                {assignment.deliveryLocation?.contactName ? (
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-sm">👤</Text>
                      <Text className="text-sm text-foreground">{assignment.deliveryLocation.contactName}</Text>
                    </View>
                    {assignment.deliveryLocation.contactPhone ? (
                      <Pressable onPress={() => callContact(assignment.deliveryLocation?.contactPhone)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                        <View className="bg-success/15 border border-success/25 px-3 py-1.5 rounded-xl flex-row items-center gap-1">
                          <Text className="text-sm">📞</Text>
                          <Text className="text-success text-xs font-bold">Call</Text>
                        </View>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </AnimatedCard>
          ) : null}

          {/* Next milestone action — single source of truth */}
          {!isDelivered && nextStep ? (
            <AnimatedCard delay={200}>
              <View className="bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Next Action</Text>
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-xl">{nextStep.icon}</Text>
                  <Text className="text-sm text-foreground flex-1 leading-4">{nextStep.desc}</Text>
                </View>

                {/* Optional note */}
                <Pressable onPress={() => setShowNoteInput(v => !v)} className="mb-3">
                  <Text className="text-xs text-primary font-medium">
                    {showNoteInput ? "▾ Hide note" : "▸ Add a note (optional)"}
                  </Text>
                </Pressable>
                {showNoteInput && (
                  <TextInput
                    value={milestoneNote}
                    onChangeText={setMilestoneNote}
                    placeholder="Add a note for this milestone…"
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={2}
                    style={{ color: colors.foreground, textAlignVertical: "top" }}
                    className="bg-background border border-border rounded-xl px-3 py-2.5 text-sm mb-3"
                  />
                )}

                <Pressable
                  onPress={handleNextMilestone}
                  disabled={actionLoading}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], opacity: actionLoading ? 0.6 : 1 }]}
                >
                  <View className={`rounded-2xl py-3.5 flex-row items-center justify-center gap-2 ${nextStep.key === "DELIVERED" ? "bg-success" : "bg-primary"}`}>
                    {actionLoading
                      ? <ActivityIndicator color="white" />
                      : <>
                          <Text className="text-xl">{nextStep.icon}</Text>
                          <Text className="text-white font-bold text-base">
                            {NEXT_ACTION_LABEL[status] ?? `Mark as ${nextStep.label}`}
                          </Text>
                        </>
                    }
                  </View>
                </Pressable>
              </View>
            </AnimatedCard>
          ) : isDelivered ? (
            <AnimatedCard delay={200}>
              <View className="bg-success/10 border border-success/25 rounded-2xl p-5 items-center">
                <Text className="text-4xl mb-2">✅</Text>
                <Text className="text-success font-bold text-base">Delivery Complete</Text>
                <Text className="text-success/80 text-xs mt-1 text-center">This trip has been successfully delivered.</Text>
              </View>
            </AnimatedCard>
          ) : null}

        </View>
      </ScrollView>

      <DeliveryVerificationModal
        tripId={assignment._id}
        isVisible={isVerificationModalVisible}
        onClose={() => setIsVerificationModalVisible(false)}
        onSuccess={() => { setIsVerificationModalVisible(false); onRefresh(); }}
      />
    </View>
  );
}
