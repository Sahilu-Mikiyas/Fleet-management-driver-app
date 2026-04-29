import React, { useState, useEffect, useRef } from "react";
import { ScrollView, Text, View, Pressable, Alert, ActivityIndicator, Modal, TextInput, Animated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { ordersApi, type ApiMarketplaceOrder } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

const CARGO_TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  fragile:    { bg: "bg-warning/10",  text: "text-warning",  border: "border-warning/25",  icon: "🏺" },
  perishable: { bg: "bg-primary/10",  text: "text-primary",  border: "border-primary/25",  icon: "🌡️" },
  hazardous:  { bg: "bg-error/10",    text: "text-error",    border: "border-error/25",    icon: "⚠️" },
  standard:   { bg: "bg-success/10",  text: "text-success",  border: "border-success/25",  icon: "📦" },
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-border/50">
      <Text className="text-sm text-muted">{label}</Text>
      <Text className="text-sm font-bold text-foreground">{value}</Text>
    </View>
  );
}

export default function CargoDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { driver } = useAuth();
  const { cargoId } = useLocalSearchParams<{ cargoId: string }>();

  const [cargo, setCargo] = useState<ApiMarketplaceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProposalModalVisible, setIsProposalModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposedPrice, setProposedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");

  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ordersApi.getMarketplace()
      .then(res => {
        const orders = res.data?.data?.orders ?? res.data?.data ?? [];
        setCargo(orders.find((o: ApiMarketplaceOrder) => o._id === cargoId) ?? null);
      })
      .catch(console.error)
      .finally(() => {
        setIsLoading(false);
        Animated.spring(contentAnim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 18 }).start();
      });
  }, [cargoId]);

  const handleSubmitProposal = async () => {
    if (!proposedPrice) { Alert.alert("Required", "Please enter a proposed price."); return; }
    setIsSubmitting(true);
    try {
      await ordersApi.submitProposal(cargoId, { proposedPrice: Number(proposedPrice), currency: "ETB", message, vehicleDetails });
      setIsProposalModalVisible(false);
      Alert.alert("Proposal Submitted!", "Your proposal has been sent to the shipper.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert("Submission Failed", e.message || "Failed to submit proposal.");
    } finally { setIsSubmitting(false); }
  };

  const handleOpenMap = () => {
    if (!cargo) return;
    if (cargo.pickupLocation.latitude && cargo.deliveryLocation.latitude) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${cargo.pickupLocation.latitude},${cargo.pickupLocation.longitude}&destination=${cargo.deliveryLocation.latitude},${cargo.deliveryLocation.longitude}`);
    } else {
      const from = cargo.pickupLocation.address || cargo.pickupLocation.city || "";
      const to = cargo.deliveryLocation.address || cargo.deliveryLocation.city || "";
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center p-0">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4 text-sm">Loading details…</Text>
      </ScreenContainer>
    );
  }

  if (!cargo) {
    return (
      <ScreenContainer className="items-center justify-center p-0">
        <Text className="text-5xl mb-4">📦</Text>
        <Text className="text-foreground text-lg font-bold mb-2">Load Not Found</Text>
        <Text className="text-muted text-center text-sm mb-6">This load may have been assigned or cancelled.</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <View className="bg-primary px-8 py-3 rounded-2xl">
            <Text className="text-white font-bold">Go Back</Text>
          </View>
        </Pressable>
      </ScreenContainer>
    );
  }

  // Any authenticated driver can submit a proposal — backend enforces role permissions
  const isTransporter = !!driver;
  const cargoType = (cargo.cargo?.type || "standard").toLowerCase();
  const typeStyle = CARGO_TYPE_STYLES[cargoType] ?? CARGO_TYPE_STYLES.standard;
  const budget = cargo.pricing?.proposedBudget || 0;
  const currency = cargo.pricing?.currency || "ETB";

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Navy header */}
        <View className="bg-navy h-52 items-center justify-center relative">
          <Text style={{ fontSize: 72 }}>{typeStyle.icon}</Text>
          <Pressable
            onPress={() => router.back()}
            className="absolute top-12 left-5 w-10 h-10 rounded-full bg-black/30 items-center justify-center"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-white text-lg font-bold">←</Text>
          </Pressable>
          {/* Cargo type badge */}
          <View className={`absolute bottom-4 self-center px-3 py-1.5 rounded-full border ${typeStyle.bg} ${typeStyle.border}`}>
            <Text className={`text-xs font-bold uppercase tracking-wide ${typeStyle.text}`}>{cargoType}</Text>
          </View>
        </View>

        {/* Title bar */}
        <View className="bg-navy/90 px-5 py-4 border-b border-white/10">
          <Text className="text-white text-xl font-bold">{cargo.title}</Text>
          {cargo.description ? (
            <Text className="text-white/60 text-sm mt-1 leading-5">{cargo.description}</Text>
          ) : null}
        </View>

        <Animated.View
          className="px-4 pt-5 gap-4"
          style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}
        >
          {/* Budget */}
          <View className="bg-success/10 rounded-2xl p-5 border border-success/20">
            <Text className="text-xs font-bold text-success uppercase tracking-widest mb-1">Proposed Budget</Text>
            <Text className="text-3xl font-bold text-success">
              {budget > 0 ? `${currency} ${budget.toLocaleString()}` : "Open for Bids"}
            </Text>
            {cargo.pricing?.negotiable && (
              <Text className="text-xs text-success/80 mt-2 font-medium">✨ Price is negotiable</Text>
            )}
          </View>

          {/* Route */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Route</Text>
            <View className="flex-row gap-4">
              <View className="items-center">
                <View className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 items-center justify-center">
                  <Text className="text-[10px] font-bold text-primary">A</Text>
                </View>
                <View className="w-px flex-1 bg-border my-1" style={{ minHeight: 32 }} />
                <View className="w-8 h-8 rounded-full bg-success/15 border border-success/30 items-center justify-center">
                  <Text className="text-[10px] font-bold text-success">B</Text>
                </View>
              </View>
              <View className="flex-1 justify-between" style={{ gap: 24 }}>
                <View>
                  <Text className="text-[10px] font-bold text-primary uppercase tracking-wide">Pickup</Text>
                  <Text className="text-base font-bold text-foreground mt-0.5">
                    {cargo.pickupLocation.city || cargo.pickupLocation.address}
                  </Text>
                  <Text className="text-xs text-muted">{cargo.pickupLocation.address}</Text>
                  <Text className="text-xs text-muted mt-0.5">
                    📅 {new Date(cargo.pickupDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
                <View>
                  <Text className="text-[10px] font-bold text-success uppercase tracking-wide">Delivery</Text>
                  <Text className="text-base font-bold text-foreground mt-0.5">
                    {cargo.deliveryLocation.city || cargo.deliveryLocation.address}
                  </Text>
                  <Text className="text-xs text-muted">{cargo.deliveryLocation.address}</Text>
                  {cargo.deliveryDeadline && (
                    <Text className="text-xs text-muted mt-0.5">
                      ⏰ Deadline: {new Date(cargo.deliveryDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Cargo specs */}
          <View className="bg-surface rounded-2xl px-5 pt-4 pb-2 border border-border">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Cargo Specifics</Text>
            <DetailRow label="Weight" value={cargo.cargo?.weightKg ? `${cargo.cargo.weightKg} kg` : "Not specified"} />
            <DetailRow label="Quantity" value={cargo.cargo?.quantity ? `${cargo.cargo.quantity} ${cargo.cargo.unit || "units"}` : "Not specified"} />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-muted">Vehicle Required</Text>
              <Text className="text-sm font-bold text-foreground">{cargo.vehicleRequirements?.vehicleType || "Any"}</Text>
            </View>
          </View>

          {/* Special instructions */}
          {cargo.specialInstructions ? (
            <View className="bg-warning/10 rounded-2xl p-4 border border-warning/20">
              <Text className="text-xs font-bold text-warning uppercase tracking-widest mb-2">Special Instructions</Text>
              <Text className="text-sm text-foreground leading-5">{cargo.specialInstructions}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View className="gap-3 mt-2">
            {isTransporter && (
              <Pressable onPress={() => setIsProposalModalVisible(true)} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <View className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-2">
                  <Text className="text-xl">📝</Text>
                  <Text className="text-white font-bold text-base">Submit Proposal</Text>
                </View>
              </Pressable>
            )}
            <Pressable onPress={handleOpenMap} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <View className="bg-surface border border-primary/30 rounded-2xl py-4 flex-row items-center justify-center gap-2">
                <Text className="text-xl">🗺️</Text>
                <Text className="text-primary font-bold text-base">View Route on Map</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Proposal Modal */}
      <Modal visible={isProposalModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-10 px-6" style={{ maxHeight: "90%" }}>
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-foreground">Submit Proposal</Text>
              <Pressable onPress={() => setIsProposalModalVisible(false)}>
                <View className="w-8 h-8 bg-surface rounded-full items-center justify-center border border-border">
                  <Text className="text-foreground font-bold text-xs">✕</Text>
                </View>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-5">
              <Text className="text-sm text-muted mb-5 leading-5">
                Submit your bid for this load. The shipper will review and accept or reject it.
              </Text>
              <View className="gap-4">
                <View>
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Proposed Price (ETB) *</Text>
                  <TextInput
                    placeholder="e.g. 5000"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={proposedPrice}
                    onChangeText={setProposedPrice}
                    style={{ color: colors.foreground }}
                    className="bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm font-semibold"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Vehicle Details</Text>
                  <TextInput
                    placeholder="e.g. Isuzu NPR, Plate: AA-12345"
                    placeholderTextColor={colors.muted}
                    value={vehicleDetails}
                    onChangeText={setVehicleDetails}
                    style={{ color: colors.foreground }}
                    className="bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm"
                  />
                </View>
                <View>
                  <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Message for Shipper</Text>
                  <TextInput
                    placeholder="Add any conditions or notes…"
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={message}
                    onChangeText={setMessage}
                    style={{ color: colors.foreground }}
                    className="bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm h-28"
                  />
                </View>
              </View>
            </ScrollView>

            <Pressable onPress={handleSubmitProposal} disabled={isSubmitting} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }], opacity: isSubmitting ? 0.6 : 1 }]}>
              <View className="bg-primary rounded-2xl py-4 items-center">
                {isSubmitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Submit Bid</Text>}
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
