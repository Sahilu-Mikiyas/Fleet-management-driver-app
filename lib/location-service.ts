import * as Location from "expo-location";
import { Platform } from "react-native";

export interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export async function requestLocationPermissions() {
  if (Platform.OS === "web") {
    return { status: "granted" };
  }

  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== "granted") {
      console.log("Foreground location permission not granted");
      return { status: foregroundStatus, granted: false };
    }

    // Request background location permission for iOS
    if (Platform.OS === "ios") {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== "granted") {
        console.log("Background location permission not granted");
      }
    }

    return { status: foregroundStatus, granted: true };
  } catch (error) {
    console.error("Error requesting location permissions:", error);
    return { status: "error", granted: false };
  }
}

export async function getCurrentLocation(): Promise<DriverLocation | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    return null;
  }
}

export async function startLocationTracking(
  callback: (location: DriverLocation) => void,
  intervalSeconds: number = 10
) {
  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: intervalSeconds * 1000,
        distanceInterval: 10, // Update if moved 10 meters
      },
      (location) => {
        const driverLocation: DriverLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: location.timestamp,
        };
        callback(driverLocation);
      }
    );

    return subscription;
  } catch (error) {
    console.error("Error starting location tracking:", error);
    return null;
  }
}

export async function stopLocationTracking(subscription: Location.LocationSubscription | null) {
  if (subscription) {
    subscription.remove();
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
