import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import * as Location from "expo-location";
import * as Linking from "expo-linking";

interface RoutePoint {
  latitude: number;
  longitude: number;
  title: string;
  description: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [distance, setDistance] = useState("12.5 km");
  const [eta, setEta] = useState("45 minutes");
  const [isTracking, setIsTracking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Mock route data
  const routes: RoutePoint[][] = [
    [
      { latitude: 40.7128, longitude: -74.006, title: "Start Point", description: "Downtown Station" },
      { latitude: 40.758, longitude: -73.9855, title: "Destination", description: "Times Square" },
    ],
    [
      { latitude: 40.7489, longitude: -73.968, title: "Start Point", description: "Central Park" },
      { latitude: 40.7614, longitude: -73.9776, title: "Destination", description: "Grand Central" },
    ],
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        updateLocationState(initialLocation);
      } else {
        Alert.alert("Permission Denied", "Location permission is required to show your position on the map");
        setPermissionGranted(false);
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    }
  };

  const updateLocationState = (loc: Location.LocationObject) => {
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      speed: loc.coords.speed,
      heading: loc.coords.heading,
      accuracy: loc.coords.accuracy,
    });
  };

  const startLiveTracking = async () => {
    if (!permissionGranted) {
      await requestLocationPermission();
      return;
    }

    setIsTracking(true);
    try {
      // Subscribe to location updates
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Update every 1 second
          distanceInterval: 10, // Or every 10 meters
        },
        (loc) => {
          updateLocationState(loc);
        }
      );

      // Store subscription for cleanup
      return () => subscription.remove();
    } catch (error) {
      console.error("Error starting location tracking:", error);
      setIsTracking(false);
    }
  };

  const stopLiveTracking = () => {
    setIsTracking(false);
  };

  const handleNavigate = () => {
    const route = routes[selectedRoute];
    const origin = `${route[0].latitude},${route[0].longitude}`;
    const destination = `${route[route.length - 1].latitude},${route[route.length - 1].longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    Linking.openURL(url);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const currentRoute = routes[selectedRoute];
  const dist = calculateDistance(
    currentRoute[0].latitude,
    currentRoute[0].longitude,
    currentRoute[1].latitude,
    currentRoute[1].longitude
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Map Preview */}
        <View className="bg-surface border-b border-border">
          <View className="w-full h-64 bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 items-center justify-center relative">
            {/* Map placeholder with route visualization */}
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-muted text-sm mb-4">📍 Route Map Preview</Text>
              
              {/* Route info */}
              <View className="bg-white dark:bg-surface rounded-lg p-4 shadow-sm">
                <Text className="text-foreground font-semibold mb-2">
                  {currentRoute[0].title} → {currentRoute[1].title}
                </Text>
                <Text className="text-muted text-xs">
                  {currentRoute[0].description} to {currentRoute[1].description}
                </Text>
              </View>
            </View>

            {/* Live tracking indicator */}
            {isTracking && (
              <View className="absolute top-4 right-4 bg-red-500 rounded-full px-3 py-1 flex-row items-center gap-2">
                <View className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <Text className="text-white text-xs font-semibold">LIVE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Live Location Display */}
        {location && (
          <View className="px-4 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">📍 Your Current Location</Text>
            <View className="bg-white dark:bg-surface rounded-lg p-4 gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-muted text-sm">Latitude</Text>
                <Text className="text-foreground font-mono text-sm">{location.latitude.toFixed(6)}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-muted text-sm">Longitude</Text>
                <Text className="text-foreground font-mono text-sm">{location.longitude.toFixed(6)}</Text>
              </View>
              {location.speed !== null && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted text-sm">Speed</Text>
                  <Text className="text-foreground font-mono text-sm">
                    {(location.speed * 3.6).toFixed(1)} km/h
                  </Text>
                </View>
              )}
              {location.heading !== null && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted text-sm">Heading</Text>
                  <Text className="text-foreground font-mono text-sm">{location.heading.toFixed(0)}°</Text>
                </View>
              )}
              {location.accuracy !== null && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-muted text-sm">Accuracy</Text>
                  <Text className="text-foreground font-mono text-sm">±{location.accuracy.toFixed(1)}m</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Live Tracking Controls */}
        <View className="px-4 py-4 gap-3">
          <Pressable
            onPress={isTracking ? stopLiveTracking : startLiveTracking}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View className={`rounded-lg py-3 items-center ${isTracking ? "bg-red-500" : "bg-primary"}`}>
              <Text className="text-white font-bold">
                {isTracking ? "🛑 Stop Live Tracking" : "▶️ Start Live Tracking"}
              </Text>
            </View>
          </Pressable>

          {!permissionGranted && (
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <Text className="text-yellow-700 text-xs">
                ⚠️ Location permission required. Tap "Start Live Tracking" to enable.
              </Text>
            </View>
          )}
        </View>

        {/* Route Selection */}
        <View className="px-4 py-4 gap-3">
          <Text className="text-lg font-bold text-foreground">Select Route</Text>
          {routes.map((route, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedRoute(index)}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View
                className={`rounded-lg p-4 border-2 ${
                  selectedRoute === index
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-foreground font-semibold flex-1">
                    Route {index + 1}: {route[0].title}
                  </Text>
                  {selectedRoute === index && <Text className="text-primary">✓</Text>}
                </View>
                <Text className="text-muted text-sm mb-3">
                  {route[0].description} → {route[1].description}
                </Text>
                <View className="flex-row justify-between text-xs text-muted">
                  <Text>📏 {dist} km</Text>
                  <Text>⏱️ ~45 min</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Route Details */}
        <View className="px-4 py-4 gap-3">
          <Text className="text-lg font-bold text-foreground">Route Details</Text>
          <View className="bg-surface rounded-lg p-4 gap-3 border border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-muted text-sm">Distance</Text>
              <Text className="text-foreground font-semibold">{dist} km</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-muted text-sm">Estimated Time</Text>
              <Text className="text-foreground font-semibold">~45 minutes</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-muted text-sm">Route Type</Text>
              <Text className="text-foreground font-semibold">Standard</Text>
            </View>
          </View>
        </View>

        {/* Navigation Button */}
        <View className="px-4 py-4">
          <Pressable
            onPress={handleNavigate}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View className="bg-primary rounded-lg py-4 items-center">
              <Text className="text-white font-bold text-lg">🗺️ Open in Google Maps</Text>
            </View>
          </Pressable>
        </View>

        <View className="h-6" />
      </ScrollView>
    </ScreenContainer>
  );
}
