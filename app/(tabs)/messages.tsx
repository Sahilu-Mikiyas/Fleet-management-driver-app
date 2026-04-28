import React, { useState, useRef, useEffect } from "react";
import { ScrollView, Text, View, Pressable, TextInput, Alert, Animated, KeyboardAvoidingView, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

interface Message {
  id: string;
  sender: "driver" | "dispatcher";
  content: string;
  timestamp: string;
  type: "text" | "status_update" | "alert";
}

interface Conversation {
  id: string;
  dispatcherName: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1", dispatcherName: "Dispatch Center", avatar: "📡",
    lastMessage: "Your next assignment is ready", timestamp: "2 min ago", unread: 1,
    messages: [
      { id: "m1", sender: "dispatcher", content: "Good morning! How's your day going?", timestamp: "9:00 AM", type: "text" },
      { id: "m2", sender: "driver", content: "Morning! All good, ready for assignments.", timestamp: "9:05 AM", type: "text" },
      { id: "m3", sender: "dispatcher", content: "Your next assignment is ready. Check Orders.", timestamp: "9:15 AM", type: "status_update" },
    ],
  },
  {
    id: "c2", dispatcherName: "Fleet Support", avatar: "🛠️",
    lastMessage: "Please update your vehicle documents", timestamp: "1 hr ago", unread: 0,
    messages: [
      { id: "m4", sender: "dispatcher", content: "Please update your vehicle documents before your next trip.", timestamp: "8:00 AM", type: "alert" },
    ],
  },
];

const QUICK_MESSAGES = [
  "Running late — 10 minutes",
  "Vehicle breakdown — need assistance",
  "Arrived at pickup location",
  "Delivery complete — awaiting confirmation",
];

function ConversationView({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const colors = useColors();
  const [text, setText] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Sent", "Your message has been sent to dispatch.");
    setText("");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {/* Chat header */}
      <View className="bg-navy px-5 py-4 flex-row items-center gap-3">
        <Pressable onPress={onBack} className="mr-1">
          <Text className="text-white text-lg">←</Text>
        </Pressable>
        <View className="w-8 h-8 rounded-full bg-white/15 items-center justify-center">
          <Text className="text-base">{conv.avatar}</Text>
        </View>
        <Text className="text-white font-bold text-base flex-1">{conv.dispatcherName}</Text>
        <View className="w-2 h-2 rounded-full bg-success" />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-background"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {conv.messages.map((msg) => {
          const isDriver = msg.sender === "driver";
          const bubbleBg = isDriver
            ? "bg-primary"
            : msg.type === "alert"
            ? "bg-error/15 border border-error/25"
            : msg.type === "status_update"
            ? "bg-primary/10 border border-primary/20"
            : "bg-surface border border-border";
          const textColor = isDriver ? "text-white" : "text-foreground";
          return (
            <View key={msg.id} className={`flex-row ${isDriver ? "justify-end" : "justify-start"}`}>
              <View className={`max-w-[78%] px-4 py-2.5 rounded-2xl ${isDriver ? "rounded-br-md" : "rounded-bl-md"} ${bubbleBg}`}>
                <Text className={`text-sm leading-5 ${textColor}`}>{msg.content}</Text>
                <Text className={`text-[10px] mt-1 ${isDriver ? "text-white/60" : "text-muted"}`}>{msg.timestamp}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      <View className="bg-surface border-t border-border px-4 py-3 flex-row gap-2 items-end">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          placeholderTextColor={colors.muted}
          multiline
          style={{ color: colors.foreground }}
          className="flex-1 bg-background border border-border rounded-2xl px-4 py-2.5 text-sm max-h-24"
        />
        <Pressable
          onPress={send}
          disabled={!text.trim()}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }], opacity: text.trim() ? 1 : 0.4 }]}
        >
          <View className="bg-primary w-10 h-10 rounded-2xl items-center justify-center">
            <Text className="text-white text-base">↑</Text>
          </View>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export function MessagesContent() {
  const colors = useColors();
  const [selected, setSelected] = useState<string | null>(null);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 20 }).start();
  }, []);

  const conv = CONVERSATIONS.find(c => c.id === selected);
  if (conv) return <ConversationView conv={conv} onBack={() => setSelected(null)} />;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <Animated.View
        className="bg-navy px-6 pt-8 pb-6"
        style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }] }}
      >
        <Text className="text-white text-2xl font-bold">Messages</Text>
        <Text className="text-white/60 text-sm mt-1">Chat with dispatch</Text>
      </Animated.View>

      <View className="px-4 pt-4 gap-4">
        {/* Emergency button */}
        <Pressable
          onPress={() =>
            Alert.alert("Emergency Alert", "Send emergency alert to all dispatchers?", [
              { text: "Cancel", style: "cancel" },
              { text: "Send", style: "destructive", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); Alert.alert("Sent", "Emergency alert sent to all dispatchers."); } },
            ])
          }
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
        >
          <View className="bg-error/10 border-2 border-error/40 rounded-2xl py-4 flex-row items-center justify-center gap-2">
            <Text className="text-xl">🚨</Text>
            <Text className="text-error font-bold text-base">Emergency Alert</Text>
          </View>
        </Pressable>

        {/* Quick messages */}
        <View className="bg-surface rounded-2xl border border-border p-4">
          <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Quick Messages</Text>
          <View className="gap-2">
            {QUICK_MESSAGES.map((msg, i) => (
              <Pressable
                key={i}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert("Sent", `"${msg}" sent to dispatch.`); }}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
              >
                <View className="bg-background border border-border rounded-xl px-4 py-3 flex-row items-center justify-between">
                  <Text className="text-sm text-foreground flex-1">{msg}</Text>
                  <Text className="text-muted text-sm ml-2">↑</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Conversations */}
        <Text className="text-xs font-bold text-muted uppercase tracking-widest">Conversations</Text>
        {CONVERSATIONS.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => setSelected(c.id)}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <View className="bg-surface rounded-2xl border border-border p-4 flex-row items-center gap-3">
              <View className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
                <Text className="text-xl">{c.avatar}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-0.5">
                  <Text className="text-sm font-bold text-foreground">{c.dispatcherName}</Text>
                  <Text className="text-[10px] text-muted">{c.timestamp}</Text>
                </View>
                <Text className="text-xs text-muted" numberOfLines={1}>{c.lastMessage}</Text>
              </View>
              {c.unread > 0 && (
                <View className="bg-error rounded-full min-w-5 h-5 items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">{c.unread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

export default function MessagesScreen() {
  return <View style={{ flex: 1 }}><MessagesContent /></View>;
}
