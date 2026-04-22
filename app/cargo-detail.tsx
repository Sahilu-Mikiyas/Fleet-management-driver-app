import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Alert, ActivityIndicator, Modal, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { ordersApi, type ApiMarketplaceOrder } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function CargoDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { driver } = useAuth();
  const { cargoId } = useLocalSearchParams<{ cargoId: string }>();
  
  const [cargo, setCargo] = useState<ApiMarketplaceOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Proposal State
  const [isProposalModalVisible, setIsProposalModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposedPrice, setProposedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersApi.getMarketplace();
        const orders = response.data.data?.orders || response.data.data || [];
        const found = orders.find((o: ApiMarketplaceOrder) => o._id === cargoId);
        setCargo(found || null);
      } catch (error) {
        console.error("Failed to fetch cargo details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [cargoId]);

  const handleSubmitProposal = async () => {
    if (!proposedPrice) {
      Alert.alert("Required", "Please enter a proposed price.");
      return;
    }

    setIsSubmitting(true);
    try {
      await ordersApi.submitProposal(cargoId, {
        proposedPrice: Number(proposedPrice),
        currency: "ETB",
        message,
        vehicleDetails,
      });
      
      setIsProposalModalVisible(false);
      Alert.alert(
        "Proposal Submitted!",
        "Your proposal has been successfully sent to the shipper.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Submission Failed", error.message || "Failed to submit proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMap = () => {
    if (!cargo) return;
    const origin = `${cargo.pickupLocation.latitude},${cargo.pickupLocation.longitude}`;
    const destination = `${cargo.deliveryLocation.latitude},${cargo.deliveryLocation.longitude}`;
    
    // If we have coordinates, use them. Otherwise search by address.
    if (cargo.pickupLocation.latitude && cargo.deliveryLocation.latitude) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`);
    } else {
      const from = cargo.pickupLocation.address || cargo.pickupLocation.city;
      const to = cargo.deliveryLocation.address || cargo.deliveryLocation.city;
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from || "")}&destination=${encodeURIComponent(to || "")}`);
    }
  };

  const getCargoTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "fragile": return "bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800";
      case "perishable": return "bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800";
      case "hazardous": return "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800";
      default: return "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800";
    }
  };

  const getCargoTypeTextColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "fragile": return "text-yellow-700 dark:text-yellow-200";
      case "perishable": return "text-blue-700 dark:text-blue-200";
      case "hazardous": return "text-red-700 dark:text-red-200";
      default: return "text-green-700 dark:text-green-200";
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center p-0">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading details...</Text>
      </ScreenContainer>
    );
  }

  if (!cargo) {
    return (
      <ScreenContainer className="items-center justify-center p-0">
        <Text className="text-4xl mb-4">📦</Text>
        <Text className="text-foreground text-lg font-bold mb-2">Load Not Found</Text>
        <Text className="text-muted text-center mb-6">This load may have been assigned or cancelled.</Text>
        <Pressable onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-xl">
          <Text className="text-white font-bold">Go Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const isTransporter = driver?.role === "PRIVATE_TRANSPORTER";
  const cargoType = cargo.cargo?.type || "standard";
  const budget = cargo.pricing?.proposedBudget || 0;
  const currency = cargo.pricing?.currency || "ETB";

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Image Placeholder */}
        <View className="bg-primary/10 h-48 items-center justify-center relative">
          <Text className="text-6xl">📦</Text>
          <Pressable onPress={() => router.back()} className="absolute top-12 left-6 bg-black/40 rounded-full p-2 w-10 h-10 items-center justify-center">
            <Text className="text-white text-xl font-bold">←</Text>
          </Pressable>
        </View>

        {/* Title */}
        <View className="bg-primary px-6 py-5">
          <Text className="text-white text-2xl font-bold">{cargo.title}</Text>
          <Text className="text-white/80 text-sm mt-1 leading-relaxed">
            {cargo.description || "No description provided"}
          </Text>
        </View>

        <View className="px-5 py-6 gap-5">
          {/* Compensation */}
          <View className="bg-success/10 rounded-xl p-5 border border-success/20">
            <Text className="text-xs font-bold text-success uppercase tracking-wider mb-1">Proposed Budget</Text>
            <Text className="text-3xl font-bold text-success">
              {budget > 0 ? `${currency} ${budget.toLocaleString()}` : "Open for Bids"}
            </Text>
            {cargo.pricing?.negotiable && (
              <Text className="text-xs text-success/80 mt-2 font-medium">✨ Price is negotiable</Text>
            )}
          </View>

          {/* Cargo Type */}
          <View className={`${getCargoTypeColor(cargoType)} rounded-xl p-4 border`}>
            <Text className={`${getCargoTypeTextColor(cargoType)} font-bold uppercase tracking-wider`}>
              {cargoType} Cargo
            </Text>
            <Text className={`${getCargoTypeTextColor(cargoType)} text-sm mt-1 opacity-90`}>
              Special handling instructions may apply.
            </Text>
          </View>

          {/* Route Details */}
          <View className="bg-surface rounded-xl p-5 border border-border shadow-sm">
            <Text className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Route Details</Text>
            <View className="gap-0">
              {/* Pickup */}
              <View className="flex-row gap-4">
                <View className="items-center">
                  <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center border-2 border-blue-500">
                    <Text className="text-xs">1</Text>
                  </View>
                  <View className="w-[2px] h-12 bg-border my-1" />
                </View>
                <View className="flex-1 pb-6">
                  <Text className="text-xs font-bold text-blue-500 uppercase">Pickup</Text>
                  <Text className="text-base text-foreground font-bold mt-1">
                    {cargo.pickupLocation.city || cargo.pickupLocation.address}
                  </Text>
                  <Text className="text-sm text-muted">{cargo.pickupLocation.address}</Text>
                  <Text className="text-xs text-muted font-medium mt-1">
                    Date: {new Date(cargo.pickupDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Delivery */}
              <View className="flex-row gap-4">
                <View className="items-center">
                  <View className="w-8 h-8 rounded-full bg-surface items-center justify-center border-2 border-border">
                    <Text className="text-xs">2</Text>
                  </View>
                </View>
                <View className="flex-1 pb-2">
                  <Text className="text-xs font-bold text-muted uppercase">Delivery</Text>
                  <Text className="text-base text-foreground font-bold mt-1">
                    {cargo.deliveryLocation.city || cargo.deliveryLocation.address}
                  </Text>
                  <Text className="text-sm text-muted">{cargo.deliveryLocation.address}</Text>
                  {cargo.deliveryDeadline && (
                    <Text className="text-xs text-muted font-medium mt-1">
                      Deadline: {new Date(cargo.deliveryDeadline).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Cargo Details */}
          <View className="bg-surface rounded-xl p-5 border border-border shadow-sm">
            <Text className="text-sm font-bold text-muted uppercase tracking-wider mb-4">Cargo Specifics</Text>
            <View className="gap-3">
              <View className="flex-row justify-between items-center pb-2 border-b border-border/50">
                <Text className="text-sm text-muted">Weight</Text>
                <Text className="text-sm font-bold text-foreground">
                  {cargo.cargo?.weightKg ? `${cargo.cargo.weightKg} kg` : "Not specified"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pb-2 border-b border-border/50">
                <Text className="text-sm text-muted">Quantity</Text>
                <Text className="text-sm font-bold text-foreground">
                  {cargo.cargo?.quantity ? `${cargo.cargo.quantity} ${cargo.cargo.unit || 'units'}` : "Not specified"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Vehicle Required</Text>
                <Text className="text-sm font-bold text-foreground">
                  {cargo.vehicleRequirements?.vehicleType || "Any suitable vehicle"}
                </Text>
              </View>
            </View>
          </View>

          {/* Special Instructions */}
          {cargo.specialInstructions && (
            <View className="bg-warning/10 rounded-xl p-4 border border-warning/20">
              <Text className="text-xs font-bold text-warning uppercase tracking-wider mb-2">
                Special Instructions
              </Text>
              <Text className="text-sm text-foreground leading-relaxed">{cargo.specialInstructions}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3 mt-4">
            {isTransporter && (
              <Pressable
                onPress={() => setIsProposalModalVisible(true)}
                className="bg-primary rounded-xl py-4 items-center shadow-sm"
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              >
                <Text className="text-base font-bold text-white">📝 Submit Proposal</Text>
              </Pressable>
            )}

            <Pressable
              onPress={handleOpenMap}
              className="bg-surface border border-primary/30 rounded-xl py-4 items-center shadow-sm"
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <Text className="text-base font-bold text-primary">🗺️ View Route on Map</Text>
            </Pressable>
          </View>
        </View>
        <View className="h-12" />
      </ScrollView>

      {/* ── Proposal Modal ── */}
      <Modal visible={isProposalModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-background rounded-t-3xl pt-6 pb-10 px-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-foreground">Submit Proposal</Text>
              <Pressable onPress={() => setIsProposalModalVisible(false)} className="w-8 h-8 bg-surface rounded-full items-center justify-center">
                <Text className="text-foreground font-bold">✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
              <Text className="text-sm text-muted mb-6">
                Submit your bid for this load. The shipper will review your proposal and accept or reject it.
              </Text>

              <View className="gap-4">
                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Proposed Price (ETB) *</Text>
                  <TextInput
                    placeholder="e.g. 5000"
                    placeholderTextColor="#9BA1A6"
                    keyboardType="numeric"
                    value={proposedPrice}
                    onChangeText={setProposedPrice}
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground font-semibold"
                  />
                </View>

                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Vehicle Details</Text>
                  <TextInput
                    placeholder="e.g. Isuzu NPR, Plate: AA-12345"
                    placeholderTextColor="#9BA1A6"
                    value={vehicleDetails}
                    onChangeText={setVehicleDetails}
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground"
                  />
                </View>

                <View>
                  <Text className="text-sm font-bold text-foreground mb-2">Message for Shipper</Text>
                  <TextInput
                    placeholder="Add any conditions or notes..."
                    placeholderTextColor="#9BA1A6"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={message}
                    onChangeText={setMessage}
                    className="bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground h-32"
                  />
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSubmitProposal}
              disabled={isSubmitting}
              className={`rounded-xl py-4 items-center shadow-sm ${isSubmitting ? "bg-primary/50" : "bg-primary"}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Submit Bid</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
