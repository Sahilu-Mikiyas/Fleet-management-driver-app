import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Image, Dimensions, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useFavorites } from "@/lib/favorites-context";
import { useCargoFilters } from "@/lib/cargo-filters-context";
import { ordersApi, type ApiMarketplaceOrder } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";

const { width } = Dimensions.get("window");
const cardWidth = (width - 32) / 2; // 2 columns with padding

export function MarketplaceContent() {
  const router = useRouter();
  const colors = useColors();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { filters, hasActiveFilters } = useCargoFilters();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "date" | "weight">("price");
  const [filterType, setFilterType] = useState<"all" | "fragile" | "perishable" | "hazardous" | "standard">("all");
  
  const [cargoListings, setCargoListings] = useState<ApiMarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        const response = await ordersApi.getMarketplace();
        const orders = response.data.data?.orders || response.data.data || [];
        // Filter out non-open orders just in case
        const openOrders = orders.filter((o: ApiMarketplaceOrder) => o.status === "OPEN");
        setCargoListings(openOrders);
      } catch (error) {
        console.error("Failed to fetch marketplace:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  const filteredCargo = cargoListings.filter((cargo) => {
    const matchesSearch =
      cargo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cargo.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const cType = cargo.cargo?.type?.toLowerCase() || "standard";
    const matchesType = filterType === "all" || cType === filterType;
    
    const weight = cargo.cargo?.weightKg || 0;
    const matchesWeight = weight >= filters.minWeight && weight <= filters.maxWeight;
    
    const comp = cargo.pricing?.proposedBudget || 0;
    const matchesCompensation = comp >= filters.minCompensation && comp <= filters.maxCompensation;
    
    return matchesSearch && matchesType && matchesWeight && matchesCompensation;
  });

  const sortedCargo = [...filteredCargo].sort((a, b) => {
    if (sortBy === "price") {
      return (b.pricing?.proposedBudget || 0) - (a.pricing?.proposedBudget || 0);
    } else if (sortBy === "weight") {
      return (b.cargo?.weightKg || 0) - (a.cargo?.weightKg || 0);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const getCargoTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
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
    switch (type?.toLowerCase()) {
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

  const renderCargoCard = (item: ApiMarketplaceOrder) => {
    const cargoType = item.cargo?.type || "standard";
    const budget = item.pricing?.proposedBudget || 0;
    const currency = item.pricing?.currency || "ETB";
    const weight = item.cargo?.weightKg || 0;
    
    return (
      <Pressable
        key={item._id}
        onPress={() =>
          router.push({
            pathname: "/cargo-detail" as any,
            params: { cargoId: item._id },
          })
        }
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
      >
        <View className="bg-surface rounded-lg border border-border overflow-hidden relative" style={{ width: cardWidth }}>
          {/* Cargo Image Placeholder */}
          <View className="h-32 bg-primary/10 items-center justify-center overflow-hidden">
            <Text className="text-4xl">📦</Text>
          </View>

          {/* Favorite Heart Button */}
          <Pressable
            onPress={() => {
              if (isFavorite(item._id)) {
                removeFavorite(item._id);
              } else {
                addFavorite(item._id);
              }
            }}
            className="absolute top-2 right-2 bg-white/80 dark:bg-black/80 rounded-full p-2"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-lg">{isFavorite(item._id) ? "❤️" : "🤍"}</Text>
          </Pressable>

          {/* Cargo Info */}
          <View className="p-3">
            <Text className="text-sm font-semibold text-foreground truncate">{item.title}</Text>
            <Text className="text-xs text-muted mt-1" numberOfLines={1}>{item.description || "No description provided"}</Text>

            {/* Type Badge */}
            <View className={`${getCargoTypeColor(cargoType)} rounded-full px-2 py-0.5 mt-2 self-start`}>
              <Text className={`${getCargoTypeTextColor(cargoType)} text-[10px] font-bold uppercase tracking-wider`}>
                {cargoType}
              </Text>
            </View>

            {/* Locations */}
            <View className="gap-1 mt-3 pt-3 border-t border-border">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs">📍</Text>
                <Text className="text-xs font-semibold text-foreground flex-1" numberOfLines={1}>
                  {item.pickupLocation.city || item.pickupLocation.address}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-xs">🏁</Text>
                <Text className="text-xs font-semibold text-foreground flex-1" numberOfLines={1}>
                  {item.deliveryLocation.city || item.deliveryLocation.address}
                </Text>
              </View>
            </View>

            {/* Details */}
            <View className="gap-1 mt-3 pt-3 border-t border-border">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted">Weight:</Text>
                <Text className="text-xs font-semibold text-foreground">{weight > 0 ? `${weight} kg` : "--"}</Text>
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="text-xs text-muted">Budget:</Text>
                <Text className="text-sm font-bold text-success">
                  {budget > 0 ? `${currency} ${budget.toLocaleString()}` : "Open"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 pt-12 pb-6">
          <Text className="text-white text-3xl font-bold mb-2">Marketplace</Text>
          <Text className="text-white/80 text-base">Browse and bid on open loads</Text>
        </View>

        <View className="px-4 py-6 gap-6">
          {/* Search */}
          <View>
            <TextInput
              placeholder="Search by title or description..."
              placeholderTextColor="#9BA1A6"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground text-base shadow-sm"
            />
          </View>

          {/* Sort Options */}
          <View className="gap-3">
            <Text className="text-sm font-bold text-muted uppercase tracking-wider">Sort By</Text>
            <View className="flex-row gap-2">
              {(["price", "date", "weight"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setSortBy(option)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
                  className="flex-1"
                >
                  <View
                    className={`py-2.5 rounded-lg border ${
                      sortBy === option
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`font-bold text-center text-xs uppercase tracking-wide ${
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
            <View className={`${hasActiveFilters ? "bg-primary" : "bg-surface border border-border"} rounded-xl px-4 py-3.5 flex-row items-center justify-between shadow-sm`}>
              <Text className={`${hasActiveFilters ? "text-white" : "text-foreground"} font-bold text-base`}>
                ⚙️ Advanced Filters
              </Text>
              {hasActiveFilters && (
                <View className="bg-white/20 rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-bold">Active</Text>
                </View>
              )}
            </View>
          </Pressable>

          {hasActiveFilters && (
            <View className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
              <Text className="text-primary text-xs font-bold">🔍 {filteredCargo.length} results match your filters</Text>
            </View>
          )}

          {/* Cargo Grid - 2x2 Layout */}
          <View className="gap-4 mt-2">
            <Text className="text-xl font-bold text-foreground">
              {sortedCargo.length} Available Loads
            </Text>
            
            {isLoading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-muted mt-4 font-medium">Finding loads...</Text>
              </View>
            ) : sortedCargo.length === 0 ? (
              <View className="bg-surface rounded-xl p-8 border border-border items-center">
                <Text className="text-4xl mb-3">📦</Text>
                <Text className="text-foreground font-bold text-lg mb-1">No loads found</Text>
                <Text className="text-muted text-center">Try adjusting your search or filters to see more results.</Text>
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
        <View className="h-12" />
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
