import React from "react";
import { View, Text, Pressable } from "react-native";
import { Assignment } from "@/lib/supabase";
import { getAssignmentStatus, formatTime } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface AssignmentCardProps {
  assignment: Assignment;
  onPress: () => void;
  onStartTrip: () => void;
  onViewMap: () => void;
  onCompleteTrip: () => void;
}

export function AssignmentCard({
  assignment,
  onPress,
  onStartTrip,
  onViewMap,
  onCompleteTrip,
}: AssignmentCardProps) {
  const status = getAssignmentStatus(assignment.status);
  const departureTime = formatTime(assignment.scheduled_departure);
  const arrivalTime = formatTime(assignment.scheduled_arrival);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View className="bg-surface border border-border rounded-lg p-4 mb-3">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">{assignment.route_name}</Text>
            <Text className="text-sm text-muted mt-1">Route ID: {assignment.route_id}</Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: status.color + "20" }}
          >
            <Text className="text-xs font-semibold" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Time and Passenger Info */}
        <View className="flex-row justify-between mb-4 pb-4 border-b border-border">
          <View>
            <Text className="text-xs text-muted mb-1">Departure</Text>
            <Text className="text-sm font-semibold text-foreground">{departureTime}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted mb-1">Arrival</Text>
            <Text className="text-sm font-semibold text-foreground">{arrivalTime}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted mb-1">Passengers</Text>
            <Text className="text-sm font-semibold text-foreground">{assignment.passenger_count}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          {assignment.status === "assigned" && (
            <>
              <Pressable
                onPress={onStartTrip}
                style={({ pressed }) => [
                  { flex: 1 },
                  {
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View className="bg-primary rounded-lg py-2 items-center">
                  <Text className="text-sm font-semibold text-white">Start Trip</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={onViewMap}
                style={({ pressed }) => [
                  { flex: 1 },
                  {
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View className="border border-primary rounded-lg py-2 items-center">
                  <Text className="text-sm font-semibold text-primary">Map</Text>
                </View>
              </Pressable>
            </>
          )}

          {assignment.status === "en_route" && (
            <>
              <Pressable
                onPress={onViewMap}
                style={({ pressed }) => [
                  { flex: 1 },
                  {
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View className="bg-primary rounded-lg py-2 items-center">
                  <Text className="text-sm font-semibold text-white">View Map</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={onCompleteTrip}
                style={({ pressed }) => [
                  { flex: 1 },
                  {
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View className="border border-success rounded-lg py-2 items-center">
                  <Text className="text-sm font-semibold text-success">Complete</Text>
                </View>
              </Pressable>
            </>
          )}

          {assignment.status === "completed" && (
            <View className="flex-1 bg-success/10 rounded-lg py-2 items-center">
              <Text className="text-sm font-semibold text-success">✓ Completed</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
