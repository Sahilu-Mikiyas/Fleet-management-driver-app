import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Alert, AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { useColors } from "@/hooks/use-colors";
import { SegmentedControl } from "@/components/segmented-control";
import { driverApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

// Tab Components
import { ActiveTrip } from "./orders/active-trip";
import { PendingAssignments } from "./orders/pending-assignments";
import { OrderHistory } from "./orders/order-history";
import { MarketplaceContent } from "@/app/(tabs)/marketplace";

// Configure notification handler (show even when app is foregrounded)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function OrdersHub() {
  const colors = useColors();
  const { driver, refreshDriver } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const previousPendingCount = useRef(0);

  // Data States
  const [assignments, setAssignments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [assignmentsRes, historyRes] = await Promise.allSettled([
        driverApi.getAssignments(),
        driverApi.getTripHistory(),
      ]);

      if (assignmentsRes.status === "fulfilled") {
        const data = assignmentsRes.value.data;
        setAssignments(data.data?.assignments || data.data || []);
      }

      if (historyRes.status === "fulfilled") {
        const data = historyRes.value.data;
        setHistory(data.data?.trips || data.data || []);
      }
    } catch (error) {
      console.error("Error fetching orders data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Push Notification on New Assignment ──
  useEffect(() => {
    const pendingOrders = assignments.filter((a) => a.status === "ASSIGNED");
    if (pendingOrders.length > previousPendingCount.current && previousPendingCount.current > 0) {
      // A new assignment just arrived!
      Notifications.scheduleNotificationAsync({
        content: {
          title: "🚛 New Assignment!",
          body: `You have ${pendingOrders.length} pending assignment${pendingOrders.length > 1 ? "s" : ""}. Tap to review.`,
          sound: true,
        },
        trigger: null, // fire immediately
      });
    }
    previousPendingCount.current = pendingOrders.length;
  }, [assignments]);

  // ── Request notification permissions on mount ──
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  // ── Refresh when app comes back to foreground ──
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchData();
      }
    });
    return () => subscription.remove();
  }, [fetchData]);

  // ── Driver Availability Toggle ──
  const handleToggleAvailability = async () => {
    if (isTogglingAvailability || !driver) return;
    setIsTogglingAvailability(true);
    try {
      const newAvailability = !driver.isAvailable;
      await driverApi.updateStatus(
        newAvailability ? "ACTIVE" : "OFFLINE",
        newAvailability
      );
      await refreshDriver();
    } catch (error: any) {
      Alert.alert("Failed", error.message || "Could not update availability.");
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Derived state
  const pendingOrders = assignments.filter((a) => a.status === "ASSIGNED");
  const activeOrder = assignments.find((a) =>
    ["IN_TRANSIT", "STARTED", "ARRIVED", "ASSIGNED"].includes(a.status?.toUpperCase())
  ) || null;

  const UMBRELLA_COMPANY_ID = process.env.EXPO_PUBLIC_UMBRELLA_COMPANY_ID;
  const isTransporter = !!UMBRELLA_COMPANY_ID && driver?.companyId === UMBRELLA_COMPANY_ID;

  const tabs = [
    { key: "active", label: `Active` },
    { key: "pending", label: `Pending${pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ""}` },
    { key: "history", label: "History" },
    ...(isTransporter ? [{ key: "market", label: "Marketplace" }] : []),
  ];

  return (
    <View style={styles.contentContainer}>
      {/* Header */}
      <View className="bg-navy px-4 pb-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white text-xl font-bold">Orders Hub</Text>
            <Text className="text-white/60 text-xs mt-0.5">Manage your assignments</Text>
          </View>

          {/* Availability Toggle */}
          <Pressable
            onPress={handleToggleAvailability}
            disabled={isTogglingAvailability}
            className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full border ${
              driver?.isAvailable
                ? "bg-success/20 border-success/40"
                : "bg-error/20 border-error/40"
            }`}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className={`w-2.5 h-2.5 rounded-full ${driver?.isAvailable ? "bg-success" : "bg-error"}`} />
            <Text className={`text-xs font-bold ${driver?.isAvailable ? "text-success" : "text-error"}`}>
              {isTogglingAvailability ? "..." : driver?.isAvailable ? "ONLINE" : "OFFLINE"}
            </Text>
          </Pressable>
        </View>
        <SegmentedControl
          segments={tabs}
          activeKey={activeTab}
          onSelect={setActiveTab}
        />
      </View>

      {/* Content Area */}
      <View className="flex-1 bg-surface">
        {activeTab === "active" && (
          <ActiveTrip assignment={activeOrder} isLoading={isLoading} onRefresh={fetchData} />
        )}
        {activeTab === "pending" && (
          <PendingAssignments assignments={pendingOrders} isLoading={isLoading} onRefresh={fetchData} />
        )}
        {activeTab === "history" && (
          <OrderHistory trips={history} isLoading={isLoading} />
        )}
        {activeTab === "market" && isTransporter && (
          <MarketplaceContent embedded />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
