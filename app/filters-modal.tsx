import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useCargoFilters } from "@/lib/cargo-filters-context";

const VEHICLE_TYPES = ["Van", "Truck", "Motorcycle", "Car", "Trailer"];
const CARGO_TYPES = ["Fragile", "Perishable", "Hazardous", "Standard", "Electronics"];

export default function FiltersModalScreen() {
  const router = useRouter();
  const { filters, setFilters, resetFilters } = useCargoFilters();
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApplyFilters = () => {
    setFilters(localFilters);
    router.back();
  };

  const toggleVehicleType = (type: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter((t) => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  };

  const toggleCargoType = (type: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      cargoTypes: prev.cargoTypes.includes(type)
        ? prev.cargoTypes.filter((t) => t !== type)
        : [...prev.cargoTypes, type],
    }));
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 py-6 flex-row justify-between items-center">
          <Text className="text-white text-2xl font-bold">Filters</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text className="text-white text-2xl">✕</Text>
          </Pressable>
        </View>

        <View className="px-6 py-6 gap-6">
          {/* Weight Range */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Weight Range (kg)</Text>
            <View className="gap-3">
              <View>
                <Text className="text-sm text-muted mb-1">Min: {localFilters.minWeight} kg</Text>
                <TextInput
                  value={localFilters.minWeight.toString()}
                  onChangeText={(val) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minWeight: parseInt(val) || 0,
                    }))
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                />
              </View>
              <View>
                <Text className="text-sm text-muted mb-1">Max: {localFilters.maxWeight} kg</Text>
                <TextInput
                  value={localFilters.maxWeight.toString()}
                  onChangeText={(val) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxWeight: parseInt(val) || 5000,
                    }))
                  }
                  placeholder="5000"
                  keyboardType="numeric"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                />
              </View>
            </View>
          </View>

          {/* Compensation Range */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">Compensation Range ($)</Text>
            <View className="gap-3">
              <View>
                <Text className="text-sm text-muted mb-1">Min: ${localFilters.minCompensation}</Text>
                <TextInput
                  value={localFilters.minCompensation.toString()}
                  onChangeText={(val) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      minCompensation: parseInt(val) || 0,
                    }))
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                />
              </View>
              <View>
                <Text className="text-sm text-muted mb-1">Max: ${localFilters.maxCompensation}</Text>
                <TextInput
                  value={localFilters.maxCompensation.toString()}
                  onChangeText={(val) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      maxCompensation: parseInt(val) || 10000,
                    }))
                  }
                  placeholder="10000"
                  keyboardType="numeric"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                />
              </View>
            </View>
          </View>

          {/* Vehicle Types */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">Vehicle Types</Text>
            <View className="gap-2">
              {VEHICLE_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => toggleVehicleType(type)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={`flex-row items-center gap-3 p-3 rounded-lg border ${
                      localFilters.vehicleTypes.includes(type)
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    <Text className="text-lg">
                      {localFilters.vehicleTypes.includes(type) ? "✓" : "○"}
                    </Text>
                    <Text
                      className={`font-semibold ${
                        localFilters.vehicleTypes.includes(type) ? "text-white" : "text-foreground"
                      }`}
                    >
                      {type}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Cargo Types */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">Cargo Types</Text>
            <View className="gap-2">
              {CARGO_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => toggleCargoType(type)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={`flex-row items-center gap-3 p-3 rounded-lg border ${
                      localFilters.cargoTypes.includes(type)
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                  >
                    <Text className="text-lg">
                      {localFilters.cargoTypes.includes(type) ? "✓" : "○"}
                    </Text>
                    <Text
                      className={`font-semibold ${
                        localFilters.cargoTypes.includes(type) ? "text-white" : "text-foreground"
                      }`}
                    >
                      {type}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 pb-6">
            <Pressable
              onPress={handleApplyFilters}
              style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View className="bg-primary rounded-lg py-4 items-center">
                <Text className="text-white font-bold text-lg">Apply Filters</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                resetFilters();
                setLocalFilters(
                  {
                    minWeight: 0,
                    maxWeight: 5000,
                    minCompensation: 0,
                    maxCompensation: 10000,
                    vehicleTypes: [],
                    cargoTypes: [],
                  }
                );
              }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View className="border border-primary rounded-lg py-4 items-center">
                <Text className="text-primary font-bold text-lg">Clear All Filters</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
