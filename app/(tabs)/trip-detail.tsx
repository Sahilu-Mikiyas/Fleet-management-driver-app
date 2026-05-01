import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { tripsApi } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";
import * as Linking from "expo-linking";

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  ASSIGNED:   { bg: "bg-warning/15",  text: "text-warning",  border: "border-warning/30",  icon: "📋", label: "Assigned" },
  STARTED:    { bg: "bg-primary/15",  text: "text-primary",  border: "border-primary/30",  icon: "🚀", label: "Started" },
  IN_TRANSIT: { bg: "bg-primary/15",  text: "text-primary",  border: "border-primary/30",  icon: "🚚", label: "In Transit" },
  ARRIVED:    { bg: "bg-info/15",     text: "text-info",     border: "border-info/30",     icon: "📍", label: "Arrived" },
  DELIVERED:  { bg: "bg-success/15",  text: "text-success",  border: "border-success/30",  icon: "✅", label: "Delivered" },
  COMPLETED:  { bg: "bg-success/15",  text: "text-success",  border: "border-success/30",  icon: "✅", label: "Completed" },
  CANCELLED:  { bg: "bg-error/15",    text: "text-error",    border: "border-error/30",    icon: "❌", label: "Cancelled" },
  OPEN:       { bg: "bg-muted/15",    text: "text-muted",    border: "border-border",      icon: "📦", label: "Open" },
};

function statusConfig(status: string) {
  return STATUS_CONFIG[status?.toUpperCase()] ?? {
    bg: "bg-muted/15", text: "text-muted", border: "border-border", icon: "📦", label: status || "Unknown",
  };
}

const MILESTONES = ["ASSIGNED", "STARTED", "IN_TRANSIT", "ARRIVED", "DELIVERED"];

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between items-start py-2.5 border-b border-border/40">
      <Text className="text-xs font-bold text-muted uppercase tracking-wider flex-shrink-0 mr-4">{label}</Text>
      <Text className="text-sm font-semibold text-foreground flex-1 text-right" numberOfLines={3}>{value}</Text>
    </View>
  );
}

export default function TripDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const fetchTrip = useCallback(async () => {
    if (!tripId) { setError("No trip ID provided."); setIsLoading(false); return; }
    try {
      const res = await tripsApi.getTrip(tripId);
      const d = res.data?.data ?? res.data;
      setTrip(d?.trip ?? d?.order ?? d);
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 20 }).start();
    } catch (e: any) {
      setError(e.message || "Could not load trip details.");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-3 text-sm">Loading trip…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !trip) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-4xl mb-4">⚠️</Text>
          <Text className="text-lg font-bold text-foreground text-center mb-2">Trip Not Found</Text>
          <Text className="text-sm text-muted text-center mb-6">{error || "This trip could not be loaded."}</Text>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <View className="bg-primary rounded-xl px-6 py-3">
              <Text className="text-white font-bold">Go Back</Text>
            </View>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const sc = statusConfig(trip.status);
  const currentMilestoneIdx = MILESTONES.indexOf(trip.status?.toUpperCase());

  const pickupAddr = trip.pickupLocation?.city || trip.pickupLocation?.address;
  const deliveryAddr = trip.deliveryLocation?.city || trip.deliveryLocation?.address;
  const pickupFull = [trip.pickupLocation?.address, trip.pickupLocation?.city].filter(Boolean).join(", ");
  const deliveryFull = [trip.deliveryLocation?.address, trip.deliveryLocation?.city].filter(Boolean).join(", ");

  const pickupLat = trip.pickupLocation?.latitude;
  const pickupLng = trip.pickupLocation?.longitude;
  const deliveryLat = trip.deliveryLocation?.latitude;
  const deliveryLng = trip.deliveryLocation?.longitude;

  const mapsUrl = deliveryLat && deliveryLng
    ? `https://www.google.com/maps/dir/?api=1${pickupLat ? `&origin=${pickupLat},${pickupLng}` : ""}&destination=${deliveryLat},${deliveryLng}`
    : pickupLat
    ? `https://www.google.com/maps/search/?api=1&query=${pickupLat},${pickupLng}`
    : null;

  const pickupDate = trip.pickupDate
    ? new Date(trip.pickupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const deliveryDeadline = trip.deliveryDeadline
    ? new Date(trip.deliveryDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const createdAt = trip.createdAt
    ? new Date(trip.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Navy header */}
        <Animated.View
          className="bg-navy px-5 pt-5 pb-6"
          style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }}
        >
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, alignSelf: "flex-start", marginBottom: 12 }]}>
            <View className="flex-row items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
              <Text className="text-white text-sm">←</Text>
              <Text className="text-white text-xs font-semibold">Back</Text>
            </View>
          </Pressable>

          <Text className="text-white text-xl font-bold mb-1" numberOfLines={2}>
            {trip.title || trip.orderNumber || "Trip Detail"}
          </Text>
          {trip.orderNumber && trip.title && (
            <Text className="text-white/50 text-xs mb-3">#{trip.orderNumber}</Text>
          )}

          <View className="flex-row items-center gap-2 flex-wrap">
            <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${sc.bg} ${sc.border}`}>
              <Text className="text-sm">{sc.icon}</Text>
              <Text className={`text-xs font-bold uppercase ${sc.text}`}>{sc.label}</Text>
            </View>
            {trip.pricing?.proposedBudget > 0 && (
              <View className="bg-success/20 border border-success/40 px-3 py-1.5 rounded-full">
                <Text className="text-success text-xs font-bold">
                  {trip.pricing.currency || "ETB"} {trip.pricing.proposedBudget.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View className="px-4 pt-4 gap-4">
          {/* Status timeline */}
          {currentMilestoneIdx >= 0 && (
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Trip Progress</Text>
              <View className="flex-row items-center justify-between">
                {MILESTONES.map((m, i) => {
                  const done = i <= currentMilestoneIdx;
                  const active = i === currentMilestoneIdx;
                  const ms = statusConfig(m);
                  return (
                    <React.Fragment key={m}>
                      <View className="items-center" style={{ flex: 1 }}>
                        <View className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                          active ? "bg-primary border-primary" : done ? "bg-success/20 border-success" : "bg-surface border-border"
                        }`}>
                          <Text className="text-[10px]">{done ? (active ? "●" : "✓") : "○"}</Text>
                        </View>
                        <Text className={`text-[8px] mt-1 text-center font-semibold ${active ? "text-primary" : done ? "text-success" : "text-muted"}`} numberOfLines={2}>
                          {ms.label.toUpperCase()}
                        </Text>
                      </View>
                      {i < MILESTONES.length - 1 && (
                        <View className={`h-0.5 flex-1 mx-0.5 ${i < currentMilestoneIdx ? "bg-success" : "bg-border"}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          )}

          {/* Route card */}
          {(pickupAddr || deliveryAddr) && (
            <View className="bg-surface rounded-2xl border border-border overflow-hidden">
              <View className="h-1 bg-primary/40" />
              <View className="p-4 gap-3">
                <Text className="text-xs font-bold text-muted uppercase tracking-wider">Route</Text>
                {pickupAddr && (
                  <View className="flex-row items-start gap-3">
                    <View className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 items-center justify-center mt-0.5">
                      <Text className="text-[10px] font-bold text-primary">A</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted uppercase tracking-wide">Pickup</Text>
                      <Text className="text-sm font-bold text-foreground">{pickupAddr}</Text>
                      {trip.pickupLocation?.address && trip.pickupLocation.address !== pickupAddr && (
                        <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>{trip.pickupLocation.address}</Text>
                      )}
                      {trip.pickupLocation?.contactName && (
                        <Text className="text-xs text-muted mt-0.5">👤 {trip.pickupLocation.contactName}</Text>
                      )}
                      {trip.pickupLocation?.contactPhone && (
                        <Pressable onPress={() => Linking.openURL(`tel:${trip.pickupLocation.contactPhone}`)}>
                          <Text className="text-xs text-primary mt-0.5">📞 {trip.pickupLocation.contactPhone}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
                {pickupAddr && deliveryAddr && <View className="ml-4 w-px h-4 bg-border" />}
                {deliveryAddr && (
                  <View className="flex-row items-start gap-3">
                    <View className="w-8 h-8 rounded-full bg-success/15 border border-success/25 items-center justify-center mt-0.5">
                      <Text className="text-[10px] font-bold text-success">B</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted uppercase tracking-wide">Delivery</Text>
                      <Text className="text-sm font-bold text-foreground">{deliveryAddr}</Text>
                      {trip.deliveryLocation?.address && trip.deliveryLocation.address !== deliveryAddr && (
                        <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>{trip.deliveryLocation.address}</Text>
                      )}
                      {trip.deliveryLocation?.contactName && (
                        <Text className="text-xs text-muted mt-0.5">👤 {trip.deliveryLocation.contactName}</Text>
                      )}
                      {trip.deliveryLocation?.contactPhone && (
                        <Pressable onPress={() => Linking.openURL(`tel:${trip.deliveryLocation.contactPhone}`)}>
                          <Text className="text-xs text-primary mt-0.5">📞 {trip.deliveryLocation.contactPhone}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                )}
                {mapsUrl && (
                  <Pressable
                    onPress={() => Linking.openURL(mapsUrl)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginTop: 4 }]}
                  >
                    <View className="bg-primary/10 border border-primary/25 rounded-xl py-2.5 items-center flex-row justify-center gap-2">
                      <Text className="text-sm">🗺️</Text>
                      <Text className="text-primary font-bold text-sm">Navigate</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Cargo details */}
          {trip.cargo && (trip.cargo.type || trip.cargo.description || trip.cargo.weightKg) && (
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Cargo</Text>
              <DetailRow label="Type" value={trip.cargo.type} />
              <DetailRow label="Description" value={trip.cargo.description} />
              {trip.cargo.weightKg && <DetailRow label="Weight" value={`${trip.cargo.weightKg} kg`} />}
              {trip.cargo.quantity && <DetailRow label="Quantity" value={`${trip.cargo.quantity} ${trip.cargo.unit || "items"}`} />}
              {trip.cargo.specialHandling?.length > 0 && (
                <DetailRow label="Special Handling" value={trip.cargo.specialHandling.join(", ")} />
              )}
            </View>
          )}

          {/* Schedule & pricing */}
          <View className="bg-surface rounded-2xl border border-border p-4">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Details</Text>
            <DetailRow label="Pickup Date" value={pickupDate} />
            <DetailRow label="Delivery Deadline" value={deliveryDeadline} />
            <DetailRow label="Created" value={createdAt} />
            {trip.pricing?.proposedBudget > 0 && (
              <DetailRow
                label="Compensation"
                value={`${trip.pricing.currency || "ETB"} ${trip.pricing.proposedBudget.toLocaleString()}`}
              />
            )}
            {trip.pricing?.paymentMethod && (
              <DetailRow label="Payment Method" value={trip.pricing.paymentMethod.replace("_", " ")} />
            )}
            <DetailRow label="Assignment Mode" value={trip.assignmentMode?.replace(/_/g, " ")} />
            {trip.specialInstructions && (
              <DetailRow label="Special Instructions" value={trip.specialInstructions} />
            )}
          </View>

          {/* Vehicle requirements */}
          {trip.vehicleRequirements && (trip.vehicleRequirements.vehicleType || trip.vehicleRequirements.minimumCapacityKg) && (
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Vehicle Requirements</Text>
              <DetailRow label="Type" value={trip.vehicleRequirements.vehicleType} />
              {trip.vehicleRequirements.minimumCapacityKg && (
                <DetailRow label="Min. Capacity" value={`${trip.vehicleRequirements.minimumCapacityKg} kg`} />
              )}
            </View>
          )}

          {/* Delivery proof / OTP badges */}
          {trip.status?.toUpperCase() === "DELIVERED" && (
            <View className="flex-row gap-2">
              <View className="flex-1 bg-success/10 border border-success/20 rounded-2xl p-3 items-center">
                <Text className="text-xl mb-1">🔐</Text>
                <Text className="text-xs font-bold text-success">OTP Verified</Text>
              </View>
              <View className="flex-1 bg-primary/10 border border-primary/20 rounded-2xl p-3 items-center">
                <Text className="text-xl mb-1">📸</Text>
                <Text className="text-xs font-bold text-primary">Proof Uploaded</Text>
              </View>
            </View>
          )}

          {/* Back button */}
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <View className="bg-surface border border-border rounded-2xl py-4 items-center">
              <Text className="text-foreground font-bold text-sm">← Back</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
