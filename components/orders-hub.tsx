import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useColors } from "@/hooks/use-colors";
import { SegmentedControl } from "@/components/segmented-control";
import { driverApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

// Tab Components
import { ActiveTrip } from "./orders/active-trip";
import { PendingAssignments } from "./orders/pending-assignments";
import { OrderHistory } from "./orders/order-history";

export function OrdersHub() {
  const colors = useColors();
  const { driver } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [assignments, setAssignments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

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
    // Refresh data every 30 seconds to catch new assignments
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Derived state
  const pendingOrders = assignments.filter((a) => a.status === "ASSIGNED");
  const activeOrder = assignments.find((a) => a.status === "IN_TRANSIT") || null;

  const tabs = [
    { key: "active", label: `Active` },
    { key: "pending", label: `Pending${pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ""}` },
    { key: "history", label: "History" },
  ];

  return (
    <BottomSheet
      index={1} // Start at 50%
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.muted }}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header / Tabs */}
        <View className="px-4 pb-4 border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-foreground">Orders Hub</Text>
            <View className="flex-row items-center gap-2">
              <View className={`w-2 h-2 rounded-full ${driver?.isAvailable ? "bg-success" : "bg-warning"}`} />
              <Text className="text-xs text-muted font-semibold">
                {driver?.isAvailable ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
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
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
});
