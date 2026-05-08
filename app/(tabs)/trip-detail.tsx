import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { tripsApi, driverApi } from "@/lib/api-client";
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
      // Try the generic trips endpoint first
      const res = await tripsApi.getTrip(tripId);
      const d = res.data?.data ?? res.data;
      const t = d?.trip ?? d?.order ?? d;
      if (t?._id) {
        setTrip(t);
        Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 20 }).start();
        return;
      }
      throw new Error("empty");
    } catch {
      // Fallback: find the trip in the driver's own trips list
      try {
        const res = await driverApi.getDriverTrips();
        const raw: any[] = res.data?.data?.trips ?? res.data?.data ?? [];
        const found = raw.find((t: any) => t._id === tripId);
        if (found) {
          setTrip(found);
          Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 20 }).start();
        } else {
          setError("Trip not found.");
        }
      } catch (e: any) {
        setError(e.message || "Could not load trip details.");
      }
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

  // Trip objects from GET /trips/:id have nested orderId; assignments have fields directly
  const order = trip.orderId ?? trip;
  const status = trip.milestone ?? trip.status;

  const sc = statusConfig(status);
  const currentMilestoneIdx = MILESTONES.indexOf(status?.toUpperCase());

  const pickupAddr = order.pickupLocation?.city || order.pickupLocation?.address;
  const deliveryAddr = order.deliveryLocation?.city || order.deliveryLocation?.address;
  const pickupFull = [order.pickupLocation?.address, order.pickupLocation?.city].filter(Boolean).join(", ");
  const deliveryFull = [order.deliveryLocation?.address, order.deliveryLocation?.city].filter(Boolean).join(", ");

  const pickupLat = order.pickupLocation?.latitude;
  const pickupLng = order.pickupLocation?.longitude;
  const deliveryLat = order.deliveryLocation?.latitude;
  const deliveryLng = order.deliveryLocation?.longitude;

  const mapsUrl = deliveryLat && deliveryLng
    ? `https://www.google.com/maps/dir/?api=1${pickupLat ? `&origin=${pickupLat},${pickupLng}` : ""}&destination=${deliveryLat},${deliveryLng}`
    : pickupLat
    ? `https://www.google.com/maps/search/?api=1&query=${pickupLat},${pickupLng}`
    : null;

  const pickupDate = order.pickupDate
    ? new Date(order.pickupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const deliveryDeadline = order.deliveryDeadline
    ? new Date(order.deliveryDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;
  const createdAt = (trip.createdAt || order.createdAt)
    ? new Date(trip.createdAt || order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
            {order.title || order.orderNumber || "Trip Detail"}
          </Text>
          {order.orderNumber && (
            <Text className="text-white/50 text-xs mb-3">#{order.orderNumber}</Text>
          )}

          <View className="flex-row items-center gap-2 flex-wrap">
            <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${sc.bg} ${sc.border}`}>
              <Text className="text-sm">{sc.icon}</Text>
              <Text className={`text-xs font-bold uppercase ${sc.text}`}>{sc.label}</Text>
            </View>
            {order.pricing?.proposedBudget > 0 && (
              <View className="bg-success/20 border border-success/40 px-3 py-1.5 rounded-full">
                <Text className="text-success text-xs font-bold">
                  {order.pricing.currency || "ETB"} {order.pricing.proposedBudget.toLocaleString()}
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
                      {order.pickupLocation?.address && order.pickupLocation.address !== pickupAddr && (
                        <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>{order.pickupLocation.address}</Text>
                      )}
                      {order.pickupLocation?.contactName && (
                        <Text className="text-xs text-muted mt-0.5">👤 {order.pickupLocation.contactName}</Text>
                      )}
                      {order.pickupLocation?.contactPhone && (
                        <Pressable onPress={() => Linking.openURL(`tel:${order.pickupLocation.contactPhone}`)}>
                          <Text className="text-xs text-primary mt-0.5">📞 {order.pickupLocation.contactPhone}</Text>
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
                      {order.deliveryLocation?.address && order.deliveryLocation.address !== deliveryAddr && (
                        <Text className="text-xs text-muted mt-0.5" numberOfLines={2}>{order.deliveryLocation.address}</Text>
                      )}
                      {order.deliveryLocation?.contactName && (
                        <Text className="text-xs text-muted mt-0.5">👤 {order.deliveryLocation.contactName}</Text>
                      )}
                      {order.deliveryLocation?.contactPhone && (
                        <Pressable onPress={() => Linking.openURL(`tel:${order.deliveryLocation.contactPhone}`)}>
                          <Text className="text-xs text-primary mt-0.5">📞 {order.deliveryLocation.contactPhone}</Text>
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
          {order.cargo && (order.cargo.type || order.cargo.description || order.cargo.weightKg) && (
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Cargo</Text>
              <DetailRow label="Type" value={order.cargo.type} />
              <DetailRow label="Description" value={order.cargo.description} />
              {order.cargo.weightKg && <DetailRow label="Weight" value={`${order.cargo.weightKg} kg`} />}
              {order.cargo.quantity && <DetailRow label="Quantity" value={`${order.cargo.quantity} ${order.cargo.unit || "items"}`} />}
              {order.cargo.specialHandling?.length > 0 && (
                <DetailRow label="Special Handling" value={order.cargo.specialHandling.join(", ")} />
              )}
            </View>
          )}

          {/* Vehicle (for trip objects that have vehicleId populated) */}
          {trip.vehicleId && (trip.vehicleId.plateNumber || trip.vehicleId.vehicleType) && (
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Vehicle</Text>
              <DetailRow label="Plate" value={trip.vehicleId.plateNumber} />
              <DetailRow label="Type" value={trip.vehicleId.vehicleType} />
              <DetailRow label="Model" value={trip.vehicleId.model} />
            </View>
          )}

          {/* Milestone history (for trip objects) */}
          {trip.milestoneHistory?.length > 0 && (
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Milestone History</Text>
              {[...trip.milestoneHistory].reverse().map((h: any, i: number) => (
                <View key={i} className="flex-row gap-3 pb-3 mb-3 border-b border-border/40 last:border-0 last:mb-0 last:pb-0">
                  <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{h.milestone?.replace(/_/g, " ")}</Text>
                    <Text className="text-xs text-muted mt-0.5">{new Date(h.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Text>
                    {h.note ? <Text className="text-xs text-muted/80 mt-0.5 italic">"{h.note}"</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Schedule & pricing */}
          <View className="bg-surface rounded-2xl border border-border p-4">
            <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Details</Text>
            <DetailRow label="Pickup Date" value={pickupDate} />
            <DetailRow label="Delivery Deadline" value={deliveryDeadline} />
            <DetailRow label="Created" value={createdAt} />
            {order.pricing?.proposedBudget > 0 && (
              <DetailRow
                label="Compensation"
                value={`${order.pricing.currency || "ETB"} ${order.pricing.proposedBudget.toLocaleString()}`}
              />
            )}
            {order.pricing?.paymentMethod && (
              <DetailRow label="Payment Method" value={order.pricing.paymentMethod.replace("_", " ")} />
            )}
            <DetailRow label="Assignment Mode" value={order.assignmentMode?.replace(/_/g, " ")} />
            {order.specialInstructions && (
              <DetailRow label="Special Instructions" value={order.specialInstructions} />
            )}
          </View>

          {/* Vehicle requirements (for order/assignment objects) */}
          {order.vehicleRequirements && (order.vehicleRequirements.vehicleType || order.vehicleRequirements.minimumCapacityKg) && (
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Vehicle Requirements</Text>
              <DetailRow label="Type" value={order.vehicleRequirements.vehicleType} />
              {order.vehicleRequirements.minimumCapacityKg && (
                <DetailRow label="Min. Capacity" value={`${order.vehicleRequirements.minimumCapacityKg} kg`} />
              )}
            </View>
          )}

          {/* Delivery proof / OTP badges */}
          {status?.toUpperCase() === "DELIVERED" && (
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
