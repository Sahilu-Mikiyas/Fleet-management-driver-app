import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams, useRouter } from "expo-router";
import { mockCargoListings } from "@/lib/mock-cargo";
import * as Linking from "expo-linking";

export default function CargoDetailScreen() {
  const router = useRouter();
  const { cargoId } = useLocalSearchParams<{ cargoId: string }>();
  const [isAccepting, setIsAccepting] = useState(false);

  const cargo = mockCargoListings.find((c) => c.id === cargoId);

  if (!cargo) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-foreground text-lg">Cargo not found</Text>
      </ScreenContainer>
    );
  }

  const handleAcceptCargo = () => {
    Alert.alert("Accept Cargo", `Accept "${cargo.title}" for $${cargo.compensation.toFixed(2)}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => {
          setIsAccepting(true);
          setTimeout(() => {
            Alert.alert(
              "Cargo Accepted!",
              `You've accepted "${cargo.title}". Waiting for admin approval...`,
              [{ text: "OK", onPress: () => router.back() }]
            );
            setIsAccepting(false);
          }, 1000);
        },
      },
    ]);
  };

  const handleOpenMap = () => {
    const origin = `${cargo.pickupLat},${cargo.pickupLng}`;
    const destination = `${cargo.deliveryLat},${cargo.deliveryLng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    Linking.openURL(url);
  };

  const getCargoTypeColor = (type: string) => {
    switch (type) {
      case "fragile":
        return "bg-yellow-100 dark:bg-yellow-900";
      case "perishable":
        return "bg-blue-100 dark:bg-blue-900";
      case "hazardous":
        return "bg-red-100 dark:bg-red-900";
      default:
        return "bg-green-100 dark:bg-green-900";
    }
  };

  const getCargoTypeTextColor = (type: string) => {
    switch (type) {
      case "fragile":
        return "text-yellow-700 dark:text-yellow-200";
      case "perishable":
        return "text-blue-700 dark:text-blue-200";
      case "hazardous":
        return "text-red-700 dark:text-red-200";
      default:
        return "text-green-700 dark:text-green-200";
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Image */}
        <View className="bg-gray-300 dark:bg-gray-700 h-40 items-center justify-center relative">
          <Text className="text-7xl">{cargo.image}</Text>
          <Pressable onPress={() => router.back()} className="absolute top-6 left-6 bg-black/50 rounded-full p-2">
            <Text className="text-white text-lg">←</Text>
          </Pressable>
        </View>

        {/* Title */}
        <View className="bg-primary px-6 py-4">
          <Text className="text-white text-2xl font-bold">{cargo.title}</Text>
          <Text className="text-white text-sm opacity-80 mt-1">{cargo.description}</Text>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Compensation */}
          <View className="bg-success/10 rounded-lg p-4 border border-success/20">
            <Text className="text-xs text-muted mb-1">Compensation</Text>
            <Text className="text-3xl font-bold text-success">${cargo.compensation.toFixed(2)}</Text>
            <Text className="text-xs text-muted mt-2">{cargo.estimatedTime} estimated</Text>
          </View>

          {/* Cargo Type */}
          <View className={`${getCargoTypeColor(cargo.cargoType)} rounded-lg p-4 border`}>
            <Text className={`${getCargoTypeTextColor(cargo.cargoType)} font-semibold capitalize`}>
              {cargo.cargoType} Cargo
            </Text>
            <Text className={`${getCargoTypeTextColor(cargo.cargoType)} text-sm mt-1`}>
              Handle with appropriate care
            </Text>
          </View>

          {/* Pickup & Delivery - Prominent Display */}
          <View className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">📍 Route Details</Text>
            <View className="gap-4">
              <View className="bg-white dark:bg-blue-800 rounded-lg p-3">
                <Text className="text-xs text-blue-600 dark:text-blue-300 font-semibold mb-1">🚩 STARTING POINT</Text>
                <Text className="text-base font-bold text-blue-900 dark:text-blue-100">{cargo.pickupLocation}</Text>
                <Text className="text-sm text-blue-700 dark:text-blue-200 mt-1">{cargo.pickupAddress}</Text>
              </View>
              <View className="py-2 items-center">
                <Text className="text-2xl text-blue-600 dark:text-blue-300">↓</Text>
              </View>
              <View className="bg-white dark:bg-blue-800 rounded-lg p-3">
                <Text className="text-xs text-blue-600 dark:text-blue-300 font-semibold mb-1">🎯 DESTINATION</Text>
                <Text className="text-base font-bold text-blue-900 dark:text-blue-100">{cargo.deliveryLocation}</Text>
                <Text className="text-sm text-blue-700 dark:text-blue-200 mt-1">{cargo.deliveryAddress}</Text>
              </View>
            </View>
          </View>

          {/* Cargo Details */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Cargo Details</Text>
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Weight</Text>
                <Text className="text-sm font-semibold text-foreground">{cargo.weight} kg</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Dimensions</Text>
                <Text className="text-sm font-semibold text-foreground">{cargo.dimensions}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Distance</Text>
                <Text className="text-sm font-semibold text-foreground">{cargo.distance} km</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Estimated Time</Text>
                <Text className="text-sm font-semibold text-foreground">{cargo.estimatedTime}</Text>
              </View>
            </View>
          </View>

          {/* Shipper Info */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Shipper Information</Text>
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Shipper</Text>
                <Text className="text-sm font-semibold text-foreground">{cargo.shipperName}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Rating</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-semibold">⭐ {cargo.shipperRating}</Text>
                  <Text className="text-xs text-muted">({cargo.shipperReviews} reviews)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Special Instructions */}
          {cargo.specialInstructions && (
            <View className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <Text className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Special Instructions
              </Text>
              <Text className="text-sm text-blue-800 dark:text-blue-200">{cargo.specialInstructions}</Text>
            </View>
          )}

          {/* Description */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
            <Text className="text-sm text-muted leading-relaxed">{cargo.description}</Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={handleAcceptCargo}
              disabled={isAccepting}
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed && !isAccepting ? 0.97 : 1 }],
                  opacity: isAccepting ? 0.6 : 1,
                },
              ]}
            >
              <View className="bg-primary rounded-lg py-4 items-center">
                <Text className="text-base font-semibold text-white">
                  {isAccepting ? "Accepting..." : "Accept Cargo"}
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleOpenMap}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-surface border border-border rounded-lg py-4 items-center">
                <Text className="text-base font-semibold text-foreground">View Route on Map</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-surface border border-border rounded-lg py-4 items-center">
                <Text className="text-base font-semibold text-foreground">Back to Marketplace</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
