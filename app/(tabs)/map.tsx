import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, ActivityIndicator, Platform,
} from "react-native";
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

export function MapContent() {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);

  const [currentLocation, setCurrentLocation] = useState<Coord | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<ActiveAssignment | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coord[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteFetching, setIsRouteFetching] = useState(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setIsLoading(false); return; }
      setPermissionGranted(true);

      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLocation({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });

      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 20 },
        (loc) => setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      );
    })();
    return () => locationSubRef.current?.remove();
  }, []);

  useEffect(() => { fetchAssignment(); }, []);

  const fetchAssignment = async () => {
    setIsLoading(true);
    try {
      const res = await driverApi.getAssignments();
      const assignments: ActiveAssignment[] = (res.data as any)?.data?.assignments ?? [];
      const active = assignments.find((a) =>
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
          const route = await fetchOsrmRoute(p.longitude, p.latitude, d.longitude, d.latitude);
          setRouteCoords(route);
          setIsRouteFetching(false);
          if (mapRef.current && route.length > 1) {
            mapRef.current.fitToCoordinates(route, {
              edgePadding: { top: 60, right: 60, bottom: 220, left: 60 },
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
            coordinate={{
              latitude: activeAssignment.pickupLocation.latitude!,
              longitude: activeAssignment.pickupLocation.longitude!,
            }}
            title="Pickup"
            description={activeAssignment.pickupLocation.city || activeAssignment.pickupLocation.address}
            pinColor="#3B82F6"
          />
        )}
        {activeAssignment?.deliveryLocation?.latitude && (
          <Marker
            coordinate={{
              latitude: activeAssignment.deliveryLocation.latitude!,
              longitude: activeAssignment.deliveryLocation.longitude!,
            }}
            title="Delivery"
            description={activeAssignment.deliveryLocation.city || activeAssignment.deliveryLocation.address}
            pinColor="#21C45D"
          />
        )}
        {geofences.map((gf) => {
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

      {/* Top right controls */}
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

      {isRouteFetching && (
        <View className="absolute top-3 left-3 bg-surface border border-border rounded-xl px-3 py-2 flex-row items-center gap-2 shadow-sm">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-xs text-muted font-medium">Calculating route…</Text>
        </View>
      )}

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
                <View className="flex-row gap-3 mt-1">
                  {activeAssignment.pickupLocation?.city && (
                    <Text className="text-xs text-muted">🔵 {activeAssignment.pickupLocation.city}</Text>
                  )}
                  {activeAssignment.deliveryLocation?.city && (
                    <Text className="text-xs text-muted">🟢 {activeAssignment.deliveryLocation.city}</Text>
                  )}
                </View>
              </View>
              <View className="bg-primary/15 border border-primary/30 px-3 py-1 rounded-xl">
                <Text className="text-primary text-xs font-bold">{activeAssignment.status}</Text>
              </View>
            </View>
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
