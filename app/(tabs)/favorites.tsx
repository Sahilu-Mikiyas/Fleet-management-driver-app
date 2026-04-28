import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useFavorites } from "@/lib/favorites-context";
import { ordersApi, type ApiMarketplaceOrder } from "@/lib/api-client";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2;

function CargoCard({ item, onRemove }: { item: ApiMarketplaceOrder; onRemove: () => void }) {
  const router = useRouter();
  const pickup = item.pickupLocation?.city || item.pickupLocation?.address || "—";
  const delivery = item.deliveryLocation?.city || item.deliveryLocation?.address || "—";
  const budget = item.pricing?.proposedBudget;
  const currency = item.pricing?.currency || "ETB";

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/cargo-detail" as any, params: { cargoId: item._id } })}
      style={({ pressed }) => [{ width: cardWidth, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
    >
      <View className="bg-surface rounded-2xl border border-border overflow-hidden">
        <View className="h-1 bg-primary/60" />
        <View className="p-3">
          {/* Remove button */}
          <Pressable
            onPress={onRemove}
            className="absolute top-2 right-2 bg-error/15 rounded-full w-6 h-6 items-center justify-center"
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Text className="text-error text-xs font-bold">✕</Text>
          </Pressable>

          <Text className="text-xs font-bold text-foreground pr-6" numberOfLines={1}>{item.title}</Text>
          {item.cargo?.type && (
            <View className="bg-primary/10 self-start px-2 py-0.5 rounded-full mt-1">
              <Text className="text-primary text-[10px] font-bold">{item.cargo.type}</Text>
            </View>
          )}
          <View className="gap-1 mt-2 pt-2 border-t border-border/60">
            <View className="flex-row items-center gap-1">
              <Text className="text-[10px]">🔵</Text>
              <Text className="text-[10px] text-muted flex-1" numberOfLines={1}>{pickup}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-[10px]">🟢</Text>
              <Text className="text-[10px] text-muted flex-1" numberOfLines={1}>{delivery}</Text>
            </View>
          </View>
          {budget != null && (
            <Text className="text-sm font-bold text-primary mt-2">
              {currency} {budget.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function FavoritesContent() {
  const router = useRouter();
  const colors = useColors();
  const { favorites, removeFavorite } = useFavorites();
  const [allOrders, setAllOrders] = useState<ApiMarketplaceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchMarketplace(); }, []);

  const fetchMarketplace = async () => {
    setIsLoading(true);
    try {
      const res = await ordersApi.getMarketplace({ page: 1, limit: 100 });
      setAllOrders((res.data as any)?.data?.orders ?? []);
    } catch (e) {
      console.error("Favorites fetch error", e);
    } finally {
      setIsLoading(false);
    }
  };

  const favoriteOrders = allOrders.filter((o) => favorites.includes(o._id));

  const handleRemove = async (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeFavorite(orderId);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="bg-navy px-6 pt-8 pb-6">
        <Text className="text-white text-2xl font-bold">Saved Loads</Text>
        <Text className="text-white/70 text-sm mt-1">{favorites.length} bookmarked</Text>
      </View>

      <View className="px-4 pt-4">
        {isLoading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted text-sm mt-3">Loading saved loads…</Text>
          </View>
        ) : favoriteOrders.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Text className="text-5xl mb-4">🔖</Text>
            <Text className="text-lg font-bold text-foreground mb-2">No Saved Loads</Text>
            <Text className="text-sm text-muted text-center mb-6 leading-5">
              Tap the bookmark icon on any load in the Marketplace to save it here.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/marketplace" as any)}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-primary rounded-2xl px-6 py-3">
                <Text className="text-white font-bold">Browse Marketplace</Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3">
            {Array.from({ length: Math.ceil(favoriteOrders.length / 2) }).map((_, rowIdx) => (
              <View key={rowIdx} className="flex-row gap-3">
                <CargoCard
                  item={favoriteOrders[rowIdx * 2]}
                  onRemove={() => handleRemove(favoriteOrders[rowIdx * 2]._id)}
                />
                {favoriteOrders[rowIdx * 2 + 1] ? (
                  <CargoCard
                    item={favoriteOrders[rowIdx * 2 + 1]}
                    onRemove={() => handleRemove(favoriteOrders[rowIdx * 2 + 1]._id)}
                  />
                ) : (
                  <View style={{ width: cardWidth }} />
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function FavoritesScreen() {
  return (
    <ScreenContainer className="p-0">
      <FavoritesContent />
    </ScreenContainer>
  );
}
