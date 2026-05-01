import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollView, Text, View, Pressable, TextInput,
  ActivityIndicator, Alert, Animated,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useFavorites } from "@/lib/favorites-context";
import { useCargoFilters } from "@/lib/cargo-filters-context";
import { ordersApi, type ApiMarketplaceOrder, type ApiOrderProposal } from "@/lib/api-client";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

// ── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d}d ago`;
  const h = Math.floor(diff / 3_600_000);
  if (h > 0) return `${h}h ago`;
  return `${Math.max(1, Math.floor(diff / 60_000))}m ago`;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  MATCHED: "Matched",
  ASSIGNED: "Assigned",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const PROPOSAL_STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PENDING:   { bg: "bg-warning/10",  text: "text-warning",  border: "border-warning/25",  label: "Pending" },
  ACCEPTED:  { bg: "bg-success/10",  text: "text-success",  border: "border-success/25",  label: "Accepted" },
  REJECTED:  { bg: "bg-error/10",    text: "text-error",    border: "border-error/25",    label: "Rejected" },
  WITHDRAWN: { bg: "bg-muted/10",    text: "text-muted",    border: "border-border",      label: "Withdrawn" },
};

const ASSIGNMENT_MODE_LABEL: Record<string, string> = {
  OPEN_MARKETPLACE:           "Open Marketplace",
  DIRECT_COMPANY:             "Direct Company",
  DIRECT_PRIVATE_TRANSPORTER: "Direct Private",
};

// ── OrderCard (list style, matches web app) ───────────────────────────────────

function OrderCard({ item, index }: { item: ApiMarketplaceOrder; index: number }) {
  const router = useRouter();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50 }).start();
  }, []);

  const isOpen = item.status === "OPEN";
  const budget = item.pricing?.proposedBudget;
  const currency = item.pricing?.currency || "ETB";
  const ago = timeAgo(item.createdAt);
  const createdByName = typeof item.createdBy === "object" ? (item.createdBy as any)?.fullName ?? (item.createdBy as any)?.name : null;
  const pickupDate = item.pickupDate
    ? new Date(item.pickupDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    : null;
  const fav = isFavorite(item._id);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      <Pressable
        onPress={() => router.push({ pathname: "/cargo-detail" as any, params: { cargoId: item._id } })}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          {/* Top row: availability + time + budget */}
          <View className="px-4 pt-3.5 pb-2.5 flex-row items-start justify-between">
            <View className="flex-row items-center gap-2 flex-wrap flex-1 mr-3">
              <View className={`px-2 py-0.5 rounded-md border ${isOpen ? "bg-success/10 border-success/30" : "bg-error/10 border-error/30"}`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wide ${isOpen ? "text-success" : "text-error"}`}>
                  {isOpen ? "Available" : "Not Available"}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-[11px]">🕐</Text>
                <Text className="text-[11px] text-muted">{ago}</Text>
              </View>
              <View className={`px-2 py-0.5 rounded-md border bg-primary/8 border-primary/20`}>
                <Text className="text-[9px] font-bold uppercase text-primary">
                  {ASSIGNMENT_MODE_LABEL[item.assignmentMode] ?? item.assignmentMode}
                </Text>
              </View>
            </View>
            <View className="items-end">
              {budget ? (
                <>
                  <Text className="text-base font-bold text-warning">{currency} {budget.toLocaleString()}</Text>
                  <Text className="text-[9px] text-muted">Budget</Text>
                </>
              ) : (
                <Text className="text-xs text-muted italic">Open bid</Text>
              )}
            </View>
          </View>

          {/* Title */}
          <View className="flex-row items-center justify-between px-4 pb-2">
            <Text className="text-sm font-bold text-foreground flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                fav ? removeFavorite(item._id) : addFavorite(item._id);
              }}
              hitSlop={8}
            >
              <Text className="text-base">{fav ? "❤️" : "🤍"}</Text>
            </Pressable>
          </View>

          {/* Route */}
          <View className="px-4 pb-3 flex-row items-center gap-1.5">
            <Text className="text-xs">📍</Text>
            <Text className="text-xs font-semibold text-foreground flex-1" numberOfLines={1}>
              {item.pickupLocation?.city || item.pickupLocation?.address}
              {" → "}
              {item.deliveryLocation?.city || item.deliveryLocation?.address}
            </Text>
          </View>

          {/* Divider */}
          <View className="h-px bg-border/50" />

          {/* Info row */}
          <View className="px-4 py-2.5 flex-row items-center flex-wrap gap-x-3 gap-y-1">
            {(item.cargo?.type || item.cargo?.weightKg) ? (
              <View className="flex-row items-center gap-1">
                <Text className="text-[11px]">📦</Text>
                <Text className="text-[11px] text-muted">
                  {[item.cargo.type, item.cargo.weightKg && `${item.cargo.weightKg} Kg`].filter(Boolean).join(" • ")}
                </Text>
              </View>
            ) : null}
            {pickupDate && (
              <View className="flex-row items-center gap-1">
                <Text className="text-[11px]">📅</Text>
                <Text className="text-[11px] text-muted">Pickup: {pickupDate}</Text>
              </View>
            )}
            {createdByName && (
              <View className="flex-row items-center gap-1">
                <Text className="text-[11px]">👤</Text>
                <Text className="text-[11px] text-muted">By {createdByName}</Text>
              </View>
            )}
            <View className="ml-auto flex-row items-center gap-1">
              <Text className={`text-[11px] font-bold ${isOpen ? "text-success" : "text-muted"}`}>
                {ORDER_STATUS_LABEL[item.status] ?? item.status}
              </Text>
              <Text className="text-muted text-xs">›</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── ProposalCard ──────────────────────────────────────────────────────────────

function ProposalCard({ proposal, index, onWithdraw }: {
  proposal: ApiOrderProposal; index: number; onWithdraw: (id: string) => void;
}) {
  const router = useRouter();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 50 }).start();
  }, []);

  const order = typeof proposal.orderId === "object" ? proposal.orderId as ApiMarketplaceOrder : null;
  const s = PROPOSAL_STATUS_STYLE[proposal.status] ?? PROPOSAL_STATUS_STYLE.PENDING;
  const date = new Date(proposal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      <Pressable
        onPress={() => order && router.push({ pathname: "/cargo-detail" as any, params: { cargoId: order._id } })}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      >
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          {/* Status accent bar */}
          <View className={`h-1 ${s.bg}`} />

          <View className="p-4">
            {/* Header: title + status */}
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                  {order?.title ?? "Cargo Load"}
                </Text>
                {order && (
                  <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                    {order.pickupLocation?.city ?? ""} → {order.deliveryLocation?.city ?? ""}
                  </Text>
                )}
              </View>
              <View className={`px-2.5 py-1 rounded-full border ${s.bg} ${s.border}`}>
                <Text className={`text-[10px] font-bold ${s.text}`}>{s.label}</Text>
              </View>
            </View>

            {/* Bid + date */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] text-muted uppercase tracking-wide">Your Bid</Text>
                <Text className="text-base font-bold text-primary mt-0.5">
                  {proposal.currency} {proposal.proposedPrice.toLocaleString()}
                </Text>
              </View>
              <Text className="text-xs text-muted">{date}</Text>
            </View>

            {/* Optional vehicle details */}
            {proposal.vehicleDetails ? (
              <View className="flex-row items-center gap-1.5 mt-2">
                <Text className="text-[11px]">🚛</Text>
                <Text className="text-[11px] text-muted flex-1" numberOfLines={1}>{proposal.vehicleDetails}</Text>
              </View>
            ) : null}

            {/* Message */}
            {proposal.message ? (
              <Text className="text-xs text-muted mt-2 leading-4 italic" numberOfLines={2}>"{proposal.message}"</Text>
            ) : null}

            {/* Rejection reason */}
            {proposal.rejectionReason ? (
              <View className="mt-2 bg-error/8 border border-error/20 rounded-xl px-3 py-2">
                <Text className="text-xs text-error">Reason: {proposal.rejectionReason}</Text>
              </View>
            ) : null}

            {/* Withdraw button (PENDING only) */}
            {proposal.status === "PENDING" && (
              <Pressable
                onPress={(e) => { e.stopPropagation?.(); onWithdraw(proposal._id); }}
                className="mt-3"
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className="border border-error/30 rounded-xl py-2 items-center">
                  <Text className="text-error text-xs font-bold">Withdraw Bid</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── MarketplaceContent ────────────────────────────────────────────────────────

interface MarketplaceContentProps {
  /** When true, hides the navy header (used when embedded inside OrdersHub) */
  embedded?: boolean;
}

export function MarketplaceContent({ embedded = false }: MarketplaceContentProps) {
  const colors = useColors();
  const router = useRouter();
  const { filters, hasActiveFilters } = useCargoFilters();
  const [activeTab, setActiveTab] = useState<"loads" | "bids">("loads");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "date" | "weight">("date");
  const [assignmentMode, setAssignmentMode] = useState<
    "ALL" | "OPEN_MARKETPLACE" | "DIRECT_COMPANY" | "DIRECT_PRIVATE_TRANSPORTER"
  >("ALL");
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [cargoListings, setCargoListings] = useState<ApiMarketplaceOrder[]>([]);
  const [proposals, setProposals] = useState<ApiOrderProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isBidsLoading, setIsBidsLoading] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await ordersApi.getMarketplace();
      const orders = res.data?.data?.orders ?? res.data?.data ?? [];
      setCargoListings(orders);
    } catch (e) {
      console.error(e);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProposals = useCallback(async () => {
    setIsBidsLoading(true);
    try {
      const res = await ordersApi.getMyProposals();
      setProposals(res.data?.data?.proposals ?? res.data?.data ?? []);
    } catch {}
    finally { setIsBidsLoading(false); }
  }, []);

  useEffect(() => { fetchListings(); fetchProposals(); }, [fetchListings, fetchProposals]);

  const handleWithdraw = (proposalId: string) => {
    Alert.alert("Withdraw Bid", "Are you sure you want to withdraw this bid?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw", style: "destructive",
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

  // Filter and sort
  const filtered = cargoListings.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q
      || c.title.toLowerCase().includes(q)
      || (c.description || "").toLowerCase().includes(q)
      || (c.pickupLocation?.city || "").toLowerCase().includes(q)
      || (c.deliveryLocation?.city || "").toLowerCase().includes(q)
      || (c.cargo?.type || "").toLowerCase().includes(q);
    const weight = c.cargo?.weightKg || 0;
    const budget = c.pricing?.proposedBudget || 0;
    const matchMode = assignmentMode === "ALL" || c.assignmentMode === assignmentMode;
    const matchStatus = showAllStatuses || c.status === "OPEN";
    return matchSearch && matchMode && matchStatus
      && weight >= filters.minWeight && weight <= filters.maxWeight
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
      {/* Navy header — hidden when embedded */}
      {!embedded && (
        <Animated.View
          className="bg-navy px-6 pt-8 pb-5"
          style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
        >
          <Text className="text-white text-2xl font-bold">Open Marketplace</Text>
          <Text className="text-white/60 text-sm mt-1">Discover and bid on available freight orders in real-time</Text>

          {/* Tab switcher */}
          <View className="flex-row bg-white/10 rounded-2xl p-1 mt-4">
            {([
              { key: "loads", label: "Explore Orders" },
              { key: "bids", label: `My Proposals${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
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

          {/* Search */}
          {activeTab === "loads" && (
            <View className="flex-row items-center bg-white/10 rounded-2xl px-4 mt-3 gap-2">
              <Text className="text-base">🔍</Text>
              <TextInput
                placeholder="Search by city, title, or cargo type…"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 py-3 text-sm"
                style={{ color: "white" }}
              />
            </View>
          )}
        </Animated.View>
      )}

      {/* Embedded tab bar (when inside OrdersHub) */}
      {embedded && (
        <View className="px-4 pt-3 pb-2 flex-row gap-2">
          {([
            { key: "loads", label: "Explore Orders" },
            { key: "bids", label: `My Proposals${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
          ] as const).map(tab => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View className={`px-4 py-2 rounded-full border ${activeTab === tab.key ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                <Text className={`text-xs font-bold ${activeTab === tab.key ? "text-white" : "text-foreground"}`}>
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {activeTab === "loads" ? (
        <View className="px-4 pt-3 gap-3">
          {/* Search bar when embedded */}
          {embedded && (
            <View className="flex-row items-center bg-surface border border-border rounded-2xl px-3 gap-2">
              <Text className="text-base">🔍</Text>
              <TextInput
                placeholder="Search by city, title, or cargo type…"
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ color: colors.foreground, flex: 1, paddingVertical: 12, fontSize: 13 }}
              />
            </View>
          )}

          {/* Assignment Mode filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            <View className="flex-row gap-2 pb-1">
              {([
                { key: "ALL",                        label: "All Types" },
                { key: "OPEN_MARKETPLACE",           label: "Open Marketplace" },
                { key: "DIRECT_COMPANY",             label: "Direct Company" },
                { key: "DIRECT_PRIVATE_TRANSPORTER", label: "Direct Private" },
              ] as const).map(opt => (
                <Pressable key={opt.key} onPress={() => setAssignmentMode(opt.key)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                  <View className={`px-4 py-2 rounded-full border ${assignmentMode === opt.key ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                    <Text className={`text-xs font-bold ${assignmentMode === opt.key ? "text-white" : "text-foreground"}`}>{opt.label}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Sort + filter row */}
          <View className="flex-row items-center gap-2 flex-wrap">
            {(["date", "price", "weight"] as const).map((opt) => (
              <Pressable key={opt} onPress={() => setSortBy(opt)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <View className={`px-3 py-1.5 rounded-full border ${sortBy === opt ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                  <Text className={`text-xs font-bold capitalize ${sortBy === opt ? "text-white" : "text-foreground"}`}>
                    {opt === "date" ? "Newest" : opt === "price" ? "Price" : "Weight"}
                  </Text>
                </View>
              </Pressable>
            ))}
            {/* All statuses toggle */}
            <Pressable onPress={() => setShowAllStatuses(v => !v)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <View className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${showAllStatuses ? "bg-warning/20 border-warning/40" : "bg-surface border-border"}`}>
                <Text className={`text-xs font-bold ${showAllStatuses ? "text-warning" : "text-foreground"}`}>All Statuses</Text>
              </View>
            </Pressable>
            {/* Advanced filters */}
            <Pressable
              onPress={() => router.push("/filters-modal" as any)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1, marginLeft: "auto" }]}
            >
              <View className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1 ${hasActiveFilters ? "bg-primary border-primary" : "bg-surface border-border"}`}>
                <Text className="text-sm">⚙️</Text>
                <Text className={`text-xs font-bold ${hasActiveFilters ? "text-white" : "text-foreground"}`}>Filters</Text>
              </View>
            </Pressable>
          </View>

          {hasActiveFilters && (
            <View className="bg-primary/10 border border-primary/25 rounded-xl px-3 py-2">
              <Text className="text-primary text-xs font-bold">🔍 {sorted.length} results match your filters</Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest">
              {sorted.length} {showAllStatuses ? "Total" : "Available"} Order{sorted.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-3">Finding orders…</Text>
            </View>
          ) : loadError ? (
            <View className="bg-surface rounded-2xl border border-border p-10 items-center">
              <Text className="text-4xl mb-3">⚠️</Text>
              <Text className="text-foreground font-bold text-base mb-1">Could Not Load</Text>
              <Text className="text-muted text-sm text-center mb-4">Check your connection and try again.</Text>
              <Pressable onPress={fetchListings} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <View className="bg-primary px-6 py-2.5 rounded-xl">
                  <Text className="text-white font-bold text-sm">Retry</Text>
                </View>
              </Pressable>
            </View>
          ) : sorted.length === 0 ? (
            <View className="bg-surface rounded-2xl border border-border p-10 items-center">
              <Text className="text-4xl mb-3">📦</Text>
              <Text className="text-foreground font-bold text-base mb-1">No Orders Found</Text>
              <Text className="text-muted text-sm text-center">Try adjusting your search or filters.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {sorted.map((item, i) => <OrderCard key={item._id} item={item} index={i} />)}
            </View>
          )}
        </View>
      ) : (
        <View className="px-4 pt-3 gap-3">
          <Text className="text-xs font-bold text-muted uppercase tracking-widest">
            {proposals.length} Submitted Proposal{proposals.length !== 1 ? "s" : ""}
          </Text>
          {isBidsLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-3">Loading proposals…</Text>
            </View>
          ) : proposals.length === 0 ? (
            <View className="bg-surface rounded-2xl border border-border p-10 items-center">
              <Text className="text-4xl mb-3">📝</Text>
              <Text className="text-foreground font-bold text-base mb-1">No Proposals Yet</Text>
              <Text className="text-muted text-sm text-center mb-4">Browse open orders and submit a proposal to get started.</Text>
              <Pressable onPress={() => setActiveTab("loads")} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <View className="bg-primary px-6 py-2.5 rounded-xl">
                  <Text className="text-white font-bold text-sm">Browse Orders</Text>
                </View>
              </Pressable>
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
