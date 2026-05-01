import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform, Animated, Easing, ScrollView } from "react-native";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { useColors } from "@/hooks/use-colors";
import { driverApi, geofencesApi } from "@/lib/api-client";
import { ScreenContainer } from "@/components/screen-container";

// GPS-only map replacement — no MapView, no Google Maps SDK crash.
// Shows live location stats + active trip + navigate button.

interface Coord { latitude: number; longitude: number }

interface ActiveAssignment {
  _id: string;
  title: string;
  status: string;
  pickupLocation?: { address?: string; city?: string; latitude?: number; longitude?: number };
  deliveryLocation?: { address?: string; city?: string; latitude?: number; longitude?: number };
  pricing?: { proposedBudget?: number; currency?: string };
}

const ACTIVE_STATUSES = ["STARTED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_DELIVERY"];

async function fetchOsrmDistance(
  fromLng: number, fromLat: number,
  toLng: number, toLat: number
): Promise<{ distanceKm: number; durationMin: number }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const json = await res.json();
    const route = json.routes?.[0];
    return {
      distanceKm: Math.round((route?.distance ?? 0) / 100) / 10,
      durationMin: Math.round((route?.duration ?? 0) / 60),
    };
  } catch {
    return { distanceKm: 0, durationMin: 0 };
  }
}

export function MapContent() {
  const colors = useColors();
  const [currentLocation, setCurrentLocation] = useState<Coord | null>(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<ActiveAssignment | null>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [geofenceWarning, setGeofenceWarning] = useState<string | null>(null);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePulse = useRef(new Animated.Value(1)).current;
  const gpsPulse = useRef(new Animated.Value(1)).current;

  // Pulsing animations
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.4, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(livePulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gpsPulse, { toValue: 1.15, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(gpsPulse, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [permissionGranted]);

  // Location permission + watch
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setIsLoading(false); return; }
      setPermissionGranted(true);
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLocation({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
      setSpeed(Math.max(0, initial.coords.speed ?? 0));
      setHeading(initial.coords.heading ?? 0);
      setAccuracy(initial.coords.accuracy);
      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 10 },
        (loc) => {
          setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setSpeed(Math.max(0, loc.coords.speed ?? 0));
          setHeading(loc.coords.heading ?? 0);
          setAccuracy(loc.coords.accuracy);
        }
      );
    })();
    return () => locationSubRef.current?.remove();
  }, []);

  // Fetch active assignment
  const fetchAssignment = async () => {
    setIsLoading(true);
    try {
      const res = await driverApi.getAssignments();
      const assignments: ActiveAssignment[] = (res.data as any)?.data?.assignments ?? [];
      const active = assignments.find(a =>
        !["DELIVERED", "CANCELLED", "COMPLETED"].includes(a.status?.toUpperCase())
      ) ?? null;
      setActiveAssignment(active);

      if (active) {
        const p = active.pickupLocation;
        const d = active.deliveryLocation;
        if (p?.latitude && p?.longitude && d?.latitude && d?.longitude) {
          const { distanceKm: dist, durationMin: dur } = await fetchOsrmDistance(
            p.longitude, p.latitude, d.longitude, d.latitude
          );
          setDistanceKm(dist);
          setDurationMin(dur);
        }
      }
    } catch {}
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchAssignment(); }, []);

  // Live GPS streaming every 30s
  useEffect(() => {
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    if (!activeAssignment || !ACTIVE_STATUSES.includes(activeAssignment.status?.toUpperCase())) {
      setIsTracking(false); return;
    }
    setIsTracking(true);
    const post = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await driverApi.streamLocation(
          activeAssignment._id,
          loc.coords.longitude, loc.coords.latitude,
          loc.coords.speed ?? 0, loc.coords.heading ?? 0,
        );
        try {
          const geoResult = await geofencesApi.checkLocation(loc.coords.latitude, loc.coords.longitude, activeAssignment._id);
          setGeofenceWarning((geoResult?.data as any)?.isRestricted ? "You are entering a restricted zone." : null);
        } catch {}
      } catch {}
    };
    post();
    trackingIntervalRef.current = setInterval(post, 30_000);
    return () => { if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current); };
  }, [activeAssignment?._id, activeAssignment?.status]);

  const openNavigation = (target?: { latitude?: number; longitude?: number; city?: string; address?: string }) => {
    if (!target?.latitude) return;
    const url = Platform.select({
      ios: `maps://app?daddr=${target.latitude},${target.longitude}`,
      android: `google.navigation:q=${target.latitude},${target.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`,
    });
    Linking.openURL(url!);
  };

  const currentIdx = activeAssignment
    ? ["ASSIGNED","STARTED","ARRIVED_AT_PICKUP","PICKED_UP","IN_TRANSIT","ARRIVED_AT_DELIVERY","DELIVERED"]
        .indexOf(activeAssignment.status?.toUpperCase())
    : -1;
  const navTarget = currentIdx < 3 ? activeAssignment?.pickupLocation : activeAssignment?.deliveryLocation;
  const speedKmh = Math.round(speed * 3.6);
  const lat = currentLocation?.latitude.toFixed(5) ?? "—";
  const lng = currentLocation?.longitude.toFixed(5) ?? "—";

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* Navy hero with live GPS stats */}
      <View className="bg-navy px-5 pt-8 pb-6">
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-2">
            <Animated.View style={{ transform: [{ scale: livePulse }] }}
              className={`w-2.5 h-2.5 rounded-full ${isTracking ? "bg-error" : permissionGranted ? "bg-success" : "bg-white/30"}`}
            />
            <Text className="text-xs font-bold uppercase tracking-widest"
              style={{ color: isTracking ? "#EE4343" : permissionGranted ? "#21C45D" : "rgba(255,255,255,0.4)" }}>
              {isTracking ? "LIVE · Streaming" : permissionGranted ? "GPS Active" : "No GPS"}
            </Text>
          </View>
          <Pressable onPress={fetchAssignment} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <View className="bg-white/10 rounded-xl px-3 py-1.5">
              <Text className="text-white text-xs font-bold">↺ Refresh</Text>
            </View>
          </Pressable>
        </View>

        {/* Speed + heading */}
        <View className="flex-row gap-3">
          <View className="bg-white/10 rounded-2xl flex-1 px-4 py-4 items-center">
            <Text className="text-white text-3xl font-bold">{speedKmh}</Text>
            <Text className="text-white/60 text-xs mt-0.5">km/h</Text>
          </View>
          <View className="bg-white/10 rounded-2xl flex-1 px-4 py-4 items-center">
            <Text className="text-white text-3xl font-bold">{Math.round(heading)}°</Text>
            <Text className="text-white/60 text-xs mt-0.5">Heading</Text>
          </View>
          <View className="bg-white/10 rounded-2xl flex-1 px-4 py-4 items-center">
            <Text className="text-white text-lg font-bold">{accuracy != null ? `${Math.round(accuracy)}m` : "—"}</Text>
            <Text className="text-white/60 text-xs mt-0.5">Accuracy</Text>
          </View>
        </View>

        {/* Coordinates */}
        {permissionGranted && (
          <View className="mt-3 bg-white/5 rounded-xl px-4 py-2.5 flex-row items-center gap-2">
            <Text className="text-base">📍</Text>
            <Text className="text-white/70 text-xs font-mono">{lat}, {lng}</Text>
          </View>
        )}
      </View>

      <View className="px-4 mt-4 gap-4">

        {/* Permission denied */}
        {!permissionGranted && (
          <View className="bg-error/10 border border-error/30 rounded-2xl p-5 items-center">
            <Text className="text-3xl mb-2">📵</Text>
            <Text className="text-error font-bold text-sm">Location Permission Required</Text>
            <Text className="text-error/70 text-xs mt-1 text-center">Enable location access in device settings to use GPS features.</Text>
          </View>
        )}

        {/* Geofence warning */}
        {geofenceWarning && (
          <View className="bg-error/15 border border-error/40 rounded-2xl px-4 py-3 flex-row items-center gap-3">
            <Text className="text-xl">🚫</Text>
            <View className="flex-1">
              <Text className="text-error font-bold text-sm">Restricted Zone</Text>
              <Text className="text-error/80 text-xs mt-0.5">{geofenceWarning}</Text>
            </View>
          </View>
        )}

        {/* Active trip */}
        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeAssignment ? (
          <>
            {/* Trip info card */}
            <View className="bg-surface rounded-2xl border border-border p-4">
              <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Active Trip</Text>
              <Text className="text-base font-bold text-foreground mb-3" numberOfLines={1}>{activeAssignment.title}</Text>

              <View className="gap-3">
                {activeAssignment.pickupLocation?.city && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 items-center justify-center">
                      <Text className="text-[9px] font-bold text-primary">A</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-primary font-bold uppercase">Pickup</Text>
                      <Text className="text-sm font-semibold text-foreground">{activeAssignment.pickupLocation.city}</Text>
                    </View>
                  </View>
                )}
                {activeAssignment.deliveryLocation?.city && (
                  <View className="flex-row items-center gap-3">
                    <View className="w-7 h-7 rounded-full bg-success/15 border border-success/30 items-center justify-center">
                      <Text className="text-[9px] font-bold text-success">B</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-success font-bold uppercase">Delivery</Text>
                      <Text className="text-sm font-semibold text-foreground">{activeAssignment.deliveryLocation.city}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View className="mt-3 pt-3 border-t border-border flex-row items-center justify-between">
                <View className="bg-primary/15 border border-primary/25 px-3 py-1 rounded-full">
                  <Text className="text-primary text-[10px] font-bold">{activeAssignment.status}</Text>
                </View>
                {activeAssignment.pricing?.proposedBudget ? (
                  <Text className="text-success font-bold text-sm">
                    {activeAssignment.pricing.currency ?? "ETB"} {activeAssignment.pricing.proposedBudget.toLocaleString()}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Distance / ETA */}
            {(distanceKm > 0 || durationMin > 0) && (
              <View className="flex-row gap-3">
                {distanceKm > 0 && (
                  <View className="bg-surface border border-border rounded-2xl px-4 py-3 flex-1 items-center">
                    <Text className="text-base font-bold text-foreground">{distanceKm} km</Text>
                    <Text className="text-[10px] text-muted mt-0.5">Route Distance</Text>
                  </View>
                )}
                {durationMin > 0 && (
                  <View className="bg-surface border border-border rounded-2xl px-4 py-3 flex-1 items-center">
                    <Text className="text-base font-bold text-foreground">
                      {durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin} min`}
                    </Text>
                    <Text className="text-[10px] text-muted mt-0.5">Est. Time</Text>
                  </View>
                )}
              </View>
            )}

            {/* Navigate buttons */}
            <View className="gap-2">
              <Pressable
                onPress={() => openNavigation(navTarget)}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <View className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2">
                  <Text className="text-xl">🧭</Text>
                  <Text className="text-white font-bold text-base">
                    Navigate to {currentIdx < 3 ? "Pickup" : "Delivery"}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => openNavigation(currentIdx < 3 ? activeAssignment.deliveryLocation : activeAssignment.pickupLocation)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className="bg-surface border border-border rounded-2xl py-3 flex-row items-center justify-center gap-2">
                  <Text className="text-sm">🗺️</Text>
                  <Text className="text-foreground font-semibold text-sm">
                    View {currentIdx < 3 ? "Delivery" : "Pickup"} Location
                  </Text>
                </View>
              </Pressable>
            </View>
          </>
        ) : (
          <View className="bg-surface rounded-2xl border border-border p-10 items-center">
            <Text className="text-4xl mb-3">🏜️</Text>
            <Text className="text-foreground font-bold text-base mb-1">No Active Trip</Text>
            <Text className="text-muted text-sm text-center">
              Accept an assignment in Orders to track your route here.
            </Text>
          </View>
        )}

        {/* GPS info note */}
        <View className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 flex-row items-center gap-3">
          <Text className="text-base">📡</Text>
          <Text className="text-foreground text-xs leading-5 flex-1">
            {isTracking
              ? "Your location is being streamed to dispatch every 30 seconds."
              : "Location streaming activates automatically when your trip is started."}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function MapScreen() {
  return (
    <ScreenContainer className="p-0">
      <MapContent />
    </ScreenContainer>
  );
}
