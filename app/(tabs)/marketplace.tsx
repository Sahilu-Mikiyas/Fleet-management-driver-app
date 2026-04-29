import React, { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Dimensions, ActivityIndicator, Alert, Animated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useFavorites } from "@/lib/favorites-context";
import { useCargoFilters } from "@/lib/cargo-filters-context";
import { ordersApi, type ApiMarketplaceOrder, type ApiOrderProposal } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const cardWidth = (width - 40) / 2;

const CARGO_TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  fragile:    { bg: "bg-warning/10",  text: "text-warning",  border: "border-warning/25"  },
  perishable: { bg: "bg-primary/10",  text: "text-primary",  border: "border-primary/25"  },
  hazardous:  { bg: "bg-error/10",    text: "text-error",    border: "border-error/25"    },
  standard:   { bg: "bg-success/10",  text: "text-success",  border: "border-success/25"  },
};

const CARGO_ICONS: Record<string, string> = {
  fragile: "🏺", perishable: "🌡️", hazardous: "⚠️", standard: "📦",
};

const PROPOSAL_STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PENDING:   { bg: "bg-warning/10",  text: "text-warning",  border: "border-warning/25",  label: "Pending" },
  ACCEPTED:  { bg: "bg-success/10",  text: "text-success",  border: "border-success/25",  label: "Accepted" },
  REJECTED:  { bg: "bg-error/10",    text: "text-error",    border: "border-error/25",    label: "Rejected" },
  WITHDRAWN: { bg: "bg-muted/10",    text: "text-muted",    border: "border-border",      label: "Withdrawn" },
};

function CargoCard({ item, index }: { item: ApiMarketplaceOrder; index: number }) {
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 40 }).start();
  }, []);
  const cargoType = (item.cargo?.type || "standard").toLowerCase();
  const typeStyle = CARGO_TYPE_STYLES[cargoType] ?? CARGO_TYPE_STYLES.standard;
  const budget = item.pricing?.proposedBudget;
  const currency = item.pricing?.currency || "ETB";
  const fav = isFavorite(item._id);

  return (
    <Animated.View style={{ width: cardWidth, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <Pressable
        onPress={() => router.push({ pathname: "/cargo-detail" as any, params: { cargoId: item._id } })}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}
      >
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          <View className="h-28 bg-navy/80 items-center justify-center relative">
            <Text style={{ fontSize: 42 }}>{CARGO_ICONS[cargoType] ?? "📦"}</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fav ? removeFavorite(item._id) : addFavorite(item._id); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 items-center justify-center"
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ fontSize: 14 }}>{fav ? "❤️" : "🤍"}</Text>
            </Pressable>
          </View>

          <View className="p-3">
            <Text className="text-xs font-bold text-foreground" numberOfLines={1}>{item.title}</Text>
            <View className={`self-start px-2 py-0.5 rounded-full border mt-1.5 ${typeStyle.bg} ${typeStyle.border}`}>
              <Text className={`text-[9px] font-bold uppercase tracking-wide ${typeStyle.text}`}>{cargoType}</Text>
            </View>
            <View className="mt-2 gap-0.5">
              <View className="flex-row items-center gap-1">
                <Text style={{ fontSize: 9 }}>🔵</Text>
                <Text className="text-[10px] text-muted flex-1" numberOfLines={1}>
                  {item.pickupLocation?.city || item.pickupLocation?.address}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text style={{ fontSize: 9 }}>🟢</Text>
                <Text className="text-[10px] text-muted flex-1" numberOfLines={1}>
                  {item.deliveryLocation?.city || item.deliveryLocation?.address}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-border/50">
              {item.cargo?.weightKg
                ? <Text className="text-[10px] text-muted">{item.cargo.weightKg} kg</Text>
                : <View />
              }
              <Text className="text-sm font-bold text-success">
                {budget ? `${currency} ${budget.toLocaleString()}` : "Open"}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ProposalCard({ proposal, index, onWithdraw }: { proposal: ApiOrderProposal; index: number; onWithdraw: (id: string) => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50 }).start();
  }, []);

  const order = typeof proposal.orderId === "object" ? proposal.orderId : null;
  const statusStyle = PROPOSAL_STATUS_STYLE[proposal.status] ?? PROPOSAL_STATUS_STYLE.PENDING;
  const date = new Date(proposal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <View className="bg-surface rounded-2xl border border-border p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {order?.title ?? "Cargo Load"}
            </Text>
            {order && (
              <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                {order.pickupLocation?.city ?? ""} → {order.deliveryLocation?.city ?? ""}
              </Text>
            )}
          </View>
          <View className={`px-3 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.border}`}>
            <Text className={`text-[10px] font-bold ${statusStyle.text}`}>{statusStyle.label}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-muted">Your Bid</Text>
            <Text className="text-base font-bold text-primary">
              {proposal.currency} {proposal.proposedPrice.toLocaleString()}
            </Text>
          </View>
          <Text className="text-xs text-muted">{date}</Text>
        </View>

        {proposal.message ? (
          <Text className="text-xs text-muted mt-2 leading-4 italic" numberOfLines={2}>"{proposal.message}"</Text>
        ) : null}

        {proposal.rejectionReason ? (
          <View className="mt-2 bg-error/8 border border-error/20 rounded-xl px-3 py-2">
            <Text className="text-xs text-error">Reason: {proposal.rejectionReason}</Text>
          </View>
        ) : null}

        {proposal.status === "PENDING" && (
          <Pressable
            onPress={() => onWithdraw(proposal._id)}
            className="mt-3"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="border border-error/30 rounded-xl py-2 items-center">
              <Text className="text-error text-xs font-bold">Withdraw Bid</Text>
            </View>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function MarketplaceContent() {
  const router = useRouter();
  const colors = useColors();
  const { filters, hasActiveFilters } = useCargoFilters();
  const [activeTab, setActiveTab] = useState<"loads" | "bids">("loads");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "date" | "weight">("price");
  const [cargoListings, setCargoListings] = useState<ApiMarketplaceOrder[]>([]);
  const [proposals, setProposals] = useState<ApiOrderProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBidsLoading, setIsBidsLoading] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  useEffect(() => {
    ordersApi.getMarketplace()
      .then(res => {
        const orders = res.data?.data?.orders ?? res.data?.data ?? [];
        setCargoListings(orders.filter((o: ApiMarketplaceOrder) => o.status === "OPEN"));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const fetchProposals = useCallback(async () => {
    setIsBidsLoading(true);
    try {
      const res = await ordersApi.getMyProposals();
      setProposals(res.data?.data?.proposals ?? res.data?.data ?? []);
    } catch {}
    finally { setIsBidsLoading(false); }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const handleWithdraw = async (proposalId: string) => {
    Alert.alert("Withdraw Bid", "Are you sure you want to withdraw this bid?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          try {
            await ordersApi.withdrawProposal(proposalId);
            fetchProposals();
          } catch (e: any) {
            Alert.alert("Error", e.message || "Could not withdraw bid.");
          }
        },
      },
    ]);
  };

  const filtered = cargoListings.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
    const weight = c.cargo?.weightKg || 0;
    const budget = c.pricing?.proposedBudget || 0;
    return matchSearch && weight >= filters.minWeight && weight <= filters.maxWeight
      && budget >= filters.minCompensation && budget <= filters.maxCompensation;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price")  return (b.pricing?.proposedBudget || 0) - (a.pricing?.proposedBudget || 0);
    if (sortBy === "weight") return (b.cargo?.weightKg || 0) - (a.cargo?.weightKg || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = proposals.filter(p => p.status === "PENDING").length;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Navy header */}
      <Animated.View
        className="bg-navy px-6 pt-8 pb-5"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
      >
        <Text className="text-white text-2xl font-bold">Marketplace</Text>
        <Text className="text-white/60 text-sm mt-1">Browse and bid on open loads</Text>

        {/* Tab switcher */}
        <View className="flex-row bg-white/10 rounded-2xl p-1 mt-4">
          {([
            { key: "loads", label: "Open Loads" },
            { key: "bids", label: `My Bids${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          ] as const).map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-xl items-center"
              style={{ backgroundColor: activeTab === tab.key ? "rgba(255,255,255,0.2)" : "transparent" }}
            >
              <Text className={`text-xs font-bold ${activeTab === tab.key ? "text-white" : "text-white/50"}`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Search — only on loads tab */}
        {activeTab === "loads" && (
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 mt-3 gap-2">
            <Text className="text-base">🔍</Text>
            <TextInput
              placeholder="Search loads…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 py-3 text-sm"
              style={{ color: "white" }}
            />
          </View>
        )}
      </Animated.View>

      {activeTab === "loads" ? (
        <View className="px-4 pt-4 gap-4">
          {/* Sort chips */}
          <View className="flex-row gap-2">
            {(["price", "date", "weight"] as const).map((opt) => (
              <Pressable key={opt} onPress={() => setSortBy(opt)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <View className={`px-4 py-2 rounded-full border ${sortBy === opt ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                  <Text className={`text-xs font-bold capitalize ${sortBy === opt ? "text-white" : "text-foreground"}`}>{opt}</Text>
                </View>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push("/filters-modal" as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginLeft: "auto" }]}
            >
              <View className={`px-4 py-2 rounded-full border flex-row items-center gap-1 ${hasActiveFilters ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                <Text className="text-base">⚙️</Text>
                <Text className={`text-xs font-bold ${hasActiveFilters ? "text-white" : "text-foreground"}`}>Filter</Text>
              </View>
            </Pressable>
          </View>

          {hasActiveFilters && (
            <View className="bg-primary/10 border border-primary/25 rounded-xl px-3 py-2">
              <Text className="text-primary text-xs font-bold">🔍 {sorted.length} results match your filters</Text>
            </View>
          )}

          <Text className="text-xs font-bold text-muted uppercase tracking-widest">{sorted.length} Available Loads</Text>

          {isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-3">Finding loads…</Text>
            </View>
          ) : sorted.length === 0 ? (
            <View className="bg-surface rounded-2xl border border-border p-10 items-center">
              <Text className="text-4xl mb-3">📦</Text>
              <Text className="text-foreground font-bold text-base mb-1">No Loads Found</Text>
              <Text className="text-muted text-sm text-center">Try adjusting your search or filters.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {Array.from({ length: Math.ceil(sorted.length / 2) }).map((_, row) => (
                <View key={row} className="flex-row gap-3">
                  <CargoCard item={sorted[row * 2]} index={row * 2} />
                  {sorted[row * 2 + 1]
                    ? <CargoCard item={sorted[row * 2 + 1]} index={row * 2 + 1} />
                    : <View style={{ width: cardWidth }} />
                  }
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="px-4 pt-4 gap-3">
          <Text className="text-xs font-bold text-muted uppercase tracking-widest">
            {proposals.length} Submitted Bid{proposals.length !== 1 ? "s" : ""}
          </Text>
          {isBidsLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-3">Loading bids…</Text>
            </View>
          ) : proposals.length === 0 ? (
            <View className="bg-surface rounded-2xl border border-border p-10 items-center">
              <Text className="text-4xl mb-3">📝</Text>
              <Text className="text-foreground font-bold text-base mb-1">No Bids Yet</Text>
              <Text className="text-muted text-sm text-center">Browse open loads and submit a proposal to get started.</Text>
            </View>
          ) : (
            proposals.map((p, i) => (
              <ProposalCard key={p._id} proposal={p} index={i} onWithdraw={handleWithdraw} />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

export default function MarketplaceScreen() {
  return <ScreenContainer className="p-0"><MarketplaceContent /></ScreenContainer>;
}
