import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Platform, Animated, Easing } from "react-native";
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { useColors } from "@/hooks/use-colors";
import { driverApi, geofencesApi } from "@/lib/api-client";
import { ScreenContainer } from "@/components/screen-container";

interface Coord { latitude: number; longitude: number }

interface ActiveAssignment {
  _id: string;
  title: string;
  status: string;
  pickupLocation?: { address?: string; city?: string; latitude?: number; longitude?: number };
  deliveryLocation?: { address?: string; city?: string; latitude?: number; longitude?: number };
  pricing?: { proposedBudget?: number; currency?: string };
}

interface Geofence {
  _id: string;
  name: string;
  type: "CIRCLE" | "POLYGON";
  center?: { coordinates: [number, number] };
  radius?: number;
  isRestricted?: boolean;
}

interface RouteInfo { coords: Coord[]; distanceKm: number; durationMin: number }

async function fetchOsrmRoute(
  fromLng: number, fromLat: number,
  toLng: number, toLat: number
): Promise<RouteInfo> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    const route = json.routes?.[0];
    const coords: Coord[] = (route?.geometry?.coordinates ?? [] as [number, number][])
      .map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
    return {
      coords,
      distanceKm: Math.round((route?.distance ?? 0) / 100) / 10,
      durationMin: Math.round((route?.duration ?? 0) / 60),
    };
  } catch {
    return {
      coords: [{ latitude: fromLat, longitude: fromLng }, { latitude: toLat, longitude: toLng }],
      distanceKm: 0,
      durationMin: 0,
    };
  }
}

const ACTIVE_STATUSES = ["STARTED", "ARRIVED_AT_PICKUP", "PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_DELIVERY"];

export function MapContent() {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);

  const [currentLocation, setCurrentLocation] = useState<Coord | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<ActiveAssignment | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteFetching, setIsRouteFetching] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePulse = useRef(new Animated.Value(1)).current;

  // Pulsing LIVE dot animation
  useEffect(() => {
    if (!isTracking) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1.4, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(livePulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isTracking]);

  // Request location permission + start watching
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setIsLoading(false); return; }
      setPermissionGranted(true);

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLocation({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
      setSpeed(Math.max(0, initial.coords.speed ?? 0));

      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 20 },
        (loc) => {
          setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setSpeed(Math.max(0, loc.coords.speed ?? 0));
        }
      );
    })();
    return () => locationSubRef.current?.remove();
  }, []);

  // Fetch assignment + route + geofences
  useEffect(() => { fetchAssignment(); }, []);

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
        try {
          const geoRes = await geofencesApi.getByTrip(active._id);
          setGeofences((geoRes.data as any)?.data?.geofences ?? []);
        } catch {}

        const p = active.pickupLocation;
        const d = active.deliveryLocation;
        if (p?.latitude && p?.longitude && d?.latitude && d?.longitude) {
          setIsRouteFetching(true);
          const { coords, distanceKm: dist, durationMin: dur } = await fetchOsrmRoute(
            p.longitude, p.latitude, d.longitude, d.latitude
          );
          setRouteCoords(coords);
          setDistanceKm(dist);
          setDurationMin(dur);
          setIsRouteFetching(false);
          if (mapRef.current && coords.length > 1) {
            mapRef.current.fitToCoordinates(coords, {
              edgePadding: { top: 60, right: 60, bottom: 240, left: 60 },
              animated: true,
            });
          }
        }
      }
    } catch (e) {
      console.error("Map fetch error", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Live location streaming to backend every 30s during active trip
  useEffect(() => {
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);

    if (!activeAssignment || !ACTIVE_STATUSES.includes(activeAssignment.status?.toUpperCase())) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);

    const postLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await driverApi.streamLocation(
          activeAssignment._id,
          loc.coords.longitude,
          loc.coords.latitude,
          loc.coords.speed ?? 0,
          loc.coords.heading ?? 0,
        );
      } catch {}
    };

    postLocation();
    trackingIntervalRef.current = setInterval(postLocation, 30_000);
    return () => {
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };
  }, [activeAssignment?._id, activeAssignment?.status]);

  const handleNavigate = () => {
    if (!activeAssignment) return;
    const dest = activeAssignment.pickupLocation?.latitude
      ? activeAssignment.pickupLocation
      : activeAssignment.deliveryLocation;
    if (!dest?.latitude) return;
    const url = Platform.select({
      ios: `maps://app?daddr=${dest.latitude},${dest.longitude}`,
      android: `google.navigation:q=${dest.latitude},${dest.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}`,
    });
    Linking.openURL(url!);
  };

  const recenter = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({ ...currentLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
    }
  };

  const initialRegion = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.08, longitudeDelta: 0.08 }
    : { latitude: 9.03, longitude: 38.74, latitudeDelta: 0.5, longitudeDelta: 0.5 };

  const speedKmh = Math.round(speed * 3.6);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={permissionGranted}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeColor={colors.primary} strokeWidth={4} />
        )}
        {activeAssignment?.pickupLocation?.latitude && (
          <Marker
            coordinate={{ latitude: activeAssignment.pickupLocation.latitude!, longitude: activeAssignment.pickupLocation.longitude! }}
            title="Pickup"
            description={activeAssignment.pickupLocation.city || activeAssignment.pickupLocation.address}
            pinColor="#3B82F6"
          />
        )}
        {activeAssignment?.deliveryLocation?.latitude && (
          <Marker
            coordinate={{ latitude: activeAssignment.deliveryLocation.latitude!, longitude: activeAssignment.deliveryLocation.longitude! }}
            title="Delivery"
            description={activeAssignment.deliveryLocation.city || activeAssignment.deliveryLocation.address}
            pinColor="#21C45D"
          />
        )}
        {geofences.map(gf => {
          if (gf.type === "CIRCLE" && gf.center?.coordinates && gf.radius) {
            const [lng, lat] = gf.center.coordinates;
            return (
              <Circle
                key={gf._id}
                center={{ latitude: lat, longitude: lng }}
                radius={gf.radius}
                strokeColor={gf.isRestricted ? "#EE4343" : "#F68E27"}
                fillColor={gf.isRestricted ? "rgba(238,67,67,0.12)" : "rgba(246,142,39,0.10)"}
                strokeWidth={2}
              />
            );
          }
          return null;
        })}
      </MapView>

      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-background/60">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Top-left: LIVE tracking badge + route fetching */}
      <View className="absolute top-3 left-3 gap-2">
        {isTracking && (
          <View className="bg-surface border border-border rounded-xl px-3 py-2 flex-row items-center gap-2 shadow-sm">
            <Animated.View style={{ transform: [{ scale: livePulse }] }} className="w-2 h-2 rounded-full bg-error" />
            <Text className="text-xs font-bold text-foreground">LIVE</Text>
          </View>
        )}
        {isRouteFetching && (
          <View className="bg-surface border border-border rounded-xl px-3 py-2 flex-row items-center gap-2 shadow-sm">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-xs text-muted font-medium">Routing…</Text>
          </View>
        )}
        {/* Speed badge */}
        {permissionGranted && (
          <View className="bg-navy rounded-xl px-3 py-2 items-center shadow-sm">
            <Text className="text-white text-sm font-bold">{speedKmh}</Text>
            <Text className="text-white/60 text-[9px]">km/h</Text>
          </View>
        )}
      </View>

      {/* Top-right controls */}
      <View className="absolute top-3 right-3 gap-2">
        <Pressable
          onPress={fetchAssignment}
          className="bg-surface border border-border rounded-xl w-10 h-10 items-center justify-center shadow-sm"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text>🔄</Text>
        </Pressable>
        <Pressable
          onPress={recenter}
          className="bg-surface border border-border rounded-xl w-10 h-10 items-center justify-center shadow-sm"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text>📍</Text>
        </Pressable>
      </View>

      {/* Bottom panel */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-3xl px-5 pt-4 pb-8 shadow-lg">
        {!permissionGranted ? (
          <View className="items-center py-2">
            <Text className="text-sm font-bold text-error mb-1">Location Permission Required</Text>
            <Text className="text-xs text-muted text-center">Enable location access to use the map</Text>
          </View>
        ) : activeAssignment ? (
          <>
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-0.5">Active Trip</Text>
                <Text className="text-sm font-bold text-foreground" numberOfLines={1}>{activeAssignment.title}</Text>
                <View className="flex-row gap-3 mt-1 flex-wrap">
                  {activeAssignment.pickupLocation?.city && (
                    <Text className="text-xs text-muted">🔵 {activeAssignment.pickupLocation.city}</Text>
                  )}
                  {activeAssignment.deliveryLocation?.city && (
                    <Text className="text-xs text-muted">🟢 {activeAssignment.deliveryLocation.city}</Text>
                  )}
                </View>
              </View>
              <View className="items-end gap-1">
                <View className="bg-primary/15 border border-primary/30 px-3 py-1 rounded-xl">
                  <Text className="text-primary text-xs font-bold">{activeAssignment.status}</Text>
                </View>
              </View>
            </View>

            {/* Distance / ETA row */}
            {(distanceKm > 0 || durationMin > 0) && (
              <View className="flex-row gap-3 mb-3">
                {distanceKm > 0 && (
                  <View className="bg-background border border-border rounded-xl px-3 py-2 flex-1 items-center">
                    <Text className="text-sm font-bold text-foreground">{distanceKm} km</Text>
                    <Text className="text-[10px] text-muted">Distance</Text>
                  </View>
                )}
                {durationMin > 0 && (
                  <View className="bg-background border border-border rounded-xl px-3 py-2 flex-1 items-center">
                    <Text className="text-sm font-bold text-foreground">
                      {durationMin >= 60 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : `${durationMin} min`}
                    </Text>
                    <Text className="text-[10px] text-muted">Est. Time</Text>
                  </View>
                )}
                {speedKmh > 0 && (
                  <View className="bg-background border border-border rounded-xl px-3 py-2 flex-1 items-center">
                    <Text className="text-sm font-bold text-foreground">{speedKmh} km/h</Text>
                    <Text className="text-[10px] text-muted">Speed</Text>
                  </View>
                )}
              </View>
            )}

            <Pressable
              onPress={handleNavigate}
              className="bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <Text className="text-lg">🧭</Text>
              <Text className="text-white font-bold">Open Navigation</Text>
            </Pressable>
          </>
        ) : (
          <View className="items-center py-2">
            <Text className="text-base font-bold text-foreground mb-1">No Active Trip</Text>
            <Text className="text-xs text-muted text-center">
              Accept an assignment in Orders to see your route here.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MapScreen() {
  return (
    <ScreenContainer className="p-0">
      <MapContent />
    </ScreenContainer>
  );
}
