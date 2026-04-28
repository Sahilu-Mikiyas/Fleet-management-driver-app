import React, { useEffect, useRef } from "react";
import { ScrollView, Text, View, Animated } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const NOTIF_TYPES: Record<string, { icon: string; color: string }> = {
  assignment: { icon: "🚛", color: "bg-primary/10 border-primary/20" },
  approved:   { icon: "✅", color: "bg-success/10 border-success/20" },
  alert:      { icon: "⚠️", color: "bg-warning/10 border-warning/20" },
  system:     { icon: "ℹ️", color: "bg-border/50 border-border" },
};

const mockNotifications = [
  { id: "n1", type: "assignment", title: "New Assignment Ready", message: "A new load has been assigned to you. Tap Orders to review.", time: "2 min ago" },
  { id: "n2", type: "approved",   title: "Account Approved",     message: "Your driver account is now active. You can accept assignments.", time: "1 day ago" },
  { id: "n3", type: "alert",      title: "Vehicle Inspection",   message: "Please complete your vehicle inspection before your next trip.", time: "3 days ago" },
  { id: "n4", type: "system",     title: "App Updated",          message: "Fleet Driver has been updated with new features.", time: "5 days ago" },
];

function NotifCard({ notif, index }: { notif: typeof mockNotifications[0]; index: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true, tension: 90, friction: 18, delay: index * 70,
    }).start();
  }, []);
  const style = NOTIF_TYPES[notif.type] ?? NOTIF_TYPES.system;
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      <View className={`bg-surface rounded-2xl border ${style.color} p-4 flex-row gap-3`}>
        <View className="w-10 h-10 rounded-xl bg-border/30 items-center justify-center mt-0.5">
          <Text className="text-lg">{style.icon}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-start mb-1">
            <Text className="text-sm font-bold text-foreground flex-1 pr-2">{notif.title}</Text>
            <Text className="text-[10px] text-muted">{notif.time}</Text>
          </View>
          <Text className="text-xs text-muted leading-4">{notif.message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export function NotificationsContent() {
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <Animated.View
        className="bg-navy px-6 pt-8 pb-6"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
      >
        <Text className="text-white text-2xl font-bold">Updates</Text>
        <Text className="text-white/60 text-sm mt-1">{mockNotifications.length} notifications</Text>
      </Animated.View>

      <View className="px-4 pt-4 gap-3">
        {mockNotifications.map((n, i) => <NotifCard key={n.id} notif={n} index={i} />)}
      </View>
    </ScrollView>
  );
}

export default function NotificationsScreen() {
  return <ScreenContainer className="p-0"><NotificationsContent /></ScreenContainer>;
}
