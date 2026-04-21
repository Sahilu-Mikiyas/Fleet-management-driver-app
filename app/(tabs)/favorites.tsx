import React from "react";
import { ScrollView, Text, View, Pressable, Image, Dimensions, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useFavorites } from "@/lib/favorites-context";
import { mockCargoListings } from "@/lib/mock-cargo";

const { width } = Dimensions.get("window");
const cardWidth = (width - 32) / 2;

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, removeFavorite } = useFavorites();

  const favoritesCargo = mockCargoListings.filter((cargo) => favorites.includes(cargo.id));

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

  const renderCargoCard = (item: any) => (
    <Pressable
      key={item.id}
      onPress={() =>
        router.push({
          pathname: "/cargo-detail" as any,
          params: { cargoId: item.id },
        })
      }
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
    >
      <View className="bg-surface rounded-lg border border-border overflow-hidden relative" style={{ width: cardWidth }}>
        {/* Cargo Image */}
        <View className="h-32 bg-gray-200 dark:bg-gray-800 items-center justify-center overflow-hidden">
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </View>

        {/* Remove from Favorites Button */}
        <Pressable
          onPress={() => removeFavorite(item.id)}
          className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Text className="text-white text-lg">✕</Text>
        </Pressable>

        {/* Cargo Info */}
        <View className="p-2">
          <Text className="text-xs font-semibold text-foreground truncate">{item.title}</Text>
          <Text className="text-xs text-muted mt-1 line-clamp-1">{item.description}</Text>

          {/* Type Badge */}
          <View className={`${getCargoTypeColor(item.cargoType)} rounded-full px-2 py-0.5 mt-2 self-start`}>
            <Text className={`${getCargoTypeTextColor(item.cargoType)} text-xs font-semibold capitalize`}>
              {item.cargoType}
            </Text>
          </View>

          {/* Locations */}
          <View className="gap-1 mt-2 pt-2 border-t border-border">
            <View className="gap-0.5">
              <Text className="text-xs text-muted">📍 From:</Text>
              <Text className="text-xs font-semibold text-foreground truncate">{item.pickupLocation}</Text>
            </View>
            <View className="gap-0.5">
              <Text className="text-xs text-muted">📍 To:</Text>
              <Text className="text-xs font-semibold text-foreground truncate">{item.deliveryLocation}</Text>
            </View>
          </View>

          {/* Details */}
          <View className="gap-1 mt-2 pt-2 border-t border-border">
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">Distance:</Text>
              <Text className="text-xs font-semibold text-foreground">{item.distance} km</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted">Compensation:</Text>
              <Text className="text-xs font-bold text-primary">${item.compensation.toFixed(0)}</Text>
            </View>
          </View>

          {/* Shipper Rating */}
          <View className="flex-row items-center gap-1 mt-2">
            <Text className="text-xs">⭐ {item.shipperRating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold">Saved Cargo</Text>
          <Text className="text-white text-sm opacity-80 mt-1">{favorites.length} bookmarked</Text>
        </View>

        <View className="px-4 py-6">
          {favoritesCargo.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-2xl mb-2">❤️</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No Saved Cargo</Text>
              <Text className="text-sm text-muted text-center mb-6">
                Bookmark cargo listings to save them for later
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/marketplace" as any)}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <View className="bg-primary rounded-lg px-6 py-3">
                  <Text className="text-white font-semibold">Browse Marketplace</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {/* Create rows of 2 items */}
              {Array.from({ length: Math.ceil(favoritesCargo.length / 2) }).map((_, rowIndex) => (
                <View key={rowIndex} className="flex-row gap-3 justify-between">
                  {renderCargoCard(favoritesCargo[rowIndex * 2])}
                  {favoritesCargo[rowIndex * 2 + 1] && renderCargoCard(favoritesCargo[rowIndex * 2 + 1])}
                  {!favoritesCargo[rowIndex * 2 + 1] && <View style={{ width: cardWidth }} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
