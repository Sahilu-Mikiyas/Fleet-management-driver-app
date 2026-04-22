import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Image, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { mockCargoListings, sortCargoBy, CargoListing } from "@/lib/mock-cargo";
import { useFavorites } from "@/lib/favorites-context";
import { useCargoFilters } from "@/lib/cargo-filters-context";

const { width } = Dimensions.get("window");
const cardWidth = (width - 32) / 2; // 2 columns with padding

export function MarketplaceContent() {
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { filters, hasActiveFilters } = useCargoFilters();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "distance" | "weight" | "rating">("price");
  const [filterType, setFilterType] = useState<"all" | "fragile" | "perishable" | "hazardous" | "standard">("all");

  const filteredCargo = mockCargoListings.filter((cargo) => {
    const matchesSearch =
      cargo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cargo.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || cargo.cargoType === filterType;
    const matchesWeight = cargo.weight >= filters.minWeight && cargo.weight <= filters.maxWeight;
    const matchesCompensation = cargo.compensation >= filters.minCompensation && cargo.compensation <= filters.maxCompensation;
    return matchesSearch && matchesType && matchesWeight && matchesCompensation;
  });

  const sortedCargo = sortCargoBy(filteredCargo, sortBy);

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

  const renderCargoCard = (item: CargoListing) => (
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

        {/* Favorite Heart Button */}
        <Pressable
          onPress={() => {
            if (isFavorite(item.id)) {
              removeFavorite(item.id);
            } else {
              addFavorite(item.id);
            }
          }}
          className="absolute top-2 right-2 bg-white/80 dark:bg-black/80 rounded-full p-2"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text className="text-lg">{isFavorite(item.id) ? "❤️" : "🤍"}</Text>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6">
          <Text className="text-white text-2xl font-bold mb-2">Cargo Marketplace</Text>
          <Text className="text-white text-sm opacity-80">Browse and accept cargo jobs</Text>
        </View>

        <View className="px-4 py-6 gap-6">
          {/* Search */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Search Cargo</Text>
            <TextInput
              placeholder="Search by title or description..."
              placeholderTextColor="#9BA1A6"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            />
          </View>

          {/* Sort Options */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Sort By</Text>
            <View className="flex-row gap-2">
              {(["price", "distance", "weight", "rating"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setSortBy(option)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                  className="flex-1"
                >
                  <View
                    className={`p-2 rounded-lg border ${
                      sortBy === option
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-center text-xs capitalize ${
                        sortBy === option ? "text-white" : "text-foreground"
                      }`}
                    >
                      {option}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Advanced Filters Button */}
          <Pressable
            onPress={() => router.push("/filters-modal" as any)}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
          >
            <View className={`${hasActiveFilters ? "bg-primary" : "bg-surface border border-border"} rounded-lg px-4 py-3 flex-row items-center justify-between`}>
              <Text className={`${hasActiveFilters ? "text-white" : "text-foreground"} font-semibold`}>
                ⚙️ Advanced Filters
              </Text>
              {hasActiveFilters && (
                <View className="bg-white/20 rounded-full px-2 py-1">
                  <Text className="text-white text-xs font-bold">Active</Text>
                </View>
              )}
            </View>
          </Pressable>

          {hasActiveFilters && (
            <View className="bg-primary/10 border border-primary rounded-lg px-3 py-2">
              <Text className="text-primary text-xs font-semibold">🔍 {filteredCargo.length} results match your filters</Text>
            </View>
          )}

          {/* Filter by Type */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Filter by Type</Text>
            <View className="flex-row gap-2 flex-wrap">
              {(["all", "fragile", "perishable", "hazardous", "standard"] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setFilterType(type)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                >
                  <View
                    className={`px-3 py-2 rounded-full border ${
                      filterType === type
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-xs capitalize ${
                        filterType === type ? "text-white" : "text-foreground"
                      }`}
                    >
                      {type}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Cargo Grid - 2x2 Layout */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              {sortedCargo.length} Available Cargo
            </Text>
            {sortedCargo.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 border border-border items-center">
                <Text className="text-muted">No cargo found matching your criteria</Text>
              </View>
            ) : (
              <View className="gap-3">
                {/* Create rows of 2 items */}
                {Array.from({ length: Math.ceil(sortedCargo.length / 2) }).map((_, rowIndex) => (
                  <View key={rowIndex} className="flex-row gap-3 justify-between">
                    {renderCargoCard(sortedCargo[rowIndex * 2])}
                    {sortedCargo[rowIndex * 2 + 1] && renderCargoCard(sortedCargo[rowIndex * 2 + 1])}
                    {!sortedCargo[rowIndex * 2 + 1] && <View style={{ width: cardWidth }} />}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
  );
}

export default function MarketplaceScreen() {
  return (
    <ScreenContainer className="p-0">
      <MarketplaceContent />
    </ScreenContainer>
  );
}
