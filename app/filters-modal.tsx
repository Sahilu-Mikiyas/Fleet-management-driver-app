import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useCargoFilters } from "@/lib/cargo-filters-context";
import { useColors } from "@/hooks/use-colors";

const VEHICLE_TYPES = ["Van", "Truck", "Motorcycle", "Car", "Trailer"];
const CARGO_TYPES = ["Fragile", "Perishable", "Hazardous", "Standard", "Electronics"];

export default function FiltersModalScreen() {
  const router = useRouter();
  const colors = useColors();
  const { filters, setFilters, resetFilters } = useCargoFilters();
  const [local, setLocal] = useState(filters);

  const toggleVehicle = (t: string) =>
    setLocal(p => ({ ...p, vehicleTypes: p.vehicleTypes.includes(t) ? p.vehicleTypes.filter(x => x !== t) : [...p.vehicleTypes, t] }));

  const toggleCargo = (t: string) =>
    setLocal(p => ({ ...p, cargoTypes: p.cargoTypes.includes(t) ? p.cargoTypes.filter(x => x !== t) : [...p.cargoTypes, t] }));

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Navy header */}
        <View className="bg-navy px-6 py-6 flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">Filters</Text>
            <Text className="text-white/60 text-sm mt-0.5">Refine your load search</Text>
          </View>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
            <View className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <Text className="text-white font-bold">✕</Text>
            </View>
          </Pressable>
        </View>

        <View className="px-4 pt-5 gap-4">
          {/* Weight Range */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Weight Range (kg)</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1.5">Min</Text>
                <TextInput
                  value={local.minWeight.toString()}
                  onChangeText={v => setLocal(p => ({ ...p, minWeight: parseInt(v) || 0 }))}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                  style={{ color: colors.foreground }}
                  className="bg-background border border-border rounded-xl px-3 py-3 text-sm"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1.5">Max</Text>
                <TextInput
                  value={local.maxWeight.toString()}
                  onChangeText={v => setLocal(p => ({ ...p, maxWeight: parseInt(v) || 5000 }))}
                  placeholder="5000"
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                  style={{ color: colors.foreground }}
                  className="bg-background border border-border rounded-xl px-3 py-3 text-sm"
                />
              </View>
            </View>
          </View>

          {/* Compensation Range */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Compensation Range (ETB)</Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1.5">Min</Text>
                <TextInput
                  value={local.minCompensation.toString()}
                  onChangeText={v => setLocal(p => ({ ...p, minCompensation: parseInt(v) || 0 }))}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                  style={{ color: colors.foreground }}
                  className="bg-background border border-border rounded-xl px-3 py-3 text-sm"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted mb-1.5">Max</Text>
                <TextInput
                  value={local.maxCompensation.toString()}
                  onChangeText={v => setLocal(p => ({ ...p, maxCompensation: parseInt(v) || 10000 }))}
                  placeholder="10000"
                  keyboardType="numeric"
                  placeholderTextColor={colors.muted}
                  style={{ color: colors.foreground }}
                  className="bg-background border border-border rounded-xl px-3 py-3 text-sm"
                />
              </View>
            </View>
          </View>

          {/* Vehicle Types */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Vehicle Types</Text>
            <View className="gap-2">
              {VEHICLE_TYPES.map(t => (
                <Pressable key={t} onPress={() => toggleVehicle(t)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                  <View className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl border ${local.vehicleTypes.includes(t) ? "bg-primary border-primary" : "bg-background border-border"}`}>
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${local.vehicleTypes.includes(t) ? "border-white bg-white/20" : "border-border"}`}>
                      {local.vehicleTypes.includes(t) && <Text className="text-white text-[10px] font-bold">✓</Text>}
                    </View>
                    <Text className={`font-semibold text-sm ${local.vehicleTypes.includes(t) ? "text-white" : "text-foreground"}`}>{t}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Cargo Types */}
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <Text className="text-xs font-bold text-muted uppercase tracking-widest mb-3">Cargo Types</Text>
            <View className="gap-2">
              {CARGO_TYPES.map(t => (
                <Pressable key={t} onPress={() => toggleCargo(t)} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                  <View className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl border ${local.cargoTypes.includes(t) ? "bg-primary border-primary" : "bg-background border-border"}`}>
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${local.cargoTypes.includes(t) ? "border-white bg-white/20" : "border-border"}`}>
                      {local.cargoTypes.includes(t) && <Text className="text-white text-[10px] font-bold">✓</Text>}
                    </View>
                    <Text className={`font-semibold text-sm ${local.cargoTypes.includes(t) ? "text-white" : "text-foreground"}`}>{t}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3 mt-2">
            <Pressable onPress={() => { setFilters(local); router.back(); }} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
              <View className="bg-primary rounded-2xl py-4 items-center">
                <Text className="text-white font-bold text-base">Apply Filters</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => { resetFilters(); setLocal({ minWeight: 0, maxWeight: 5000, minCompensation: 0, maxCompensation: 10000, vehicleTypes: [], cargoTypes: [] }); }}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View className="border border-border rounded-2xl py-4 items-center">
                <Text className="text-foreground font-bold text-base">Clear All</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
