import React, { createContext, useContext, useState } from "react";

export interface CargoFilters {
  minWeight: number;
  maxWeight: number;
  minCompensation: number;
  maxCompensation: number;
  vehicleTypes: string[];
  cargoTypes: string[];
}

interface CargoFiltersContextType {
  filters: CargoFilters;
  setFilters: (filters: CargoFilters) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: CargoFilters = {
  minWeight: 0,
  maxWeight: 5000,
  minCompensation: 0,
  maxCompensation: 10000,
  vehicleTypes: [],
  cargoTypes: [],
};

const CargoFiltersContext = createContext<CargoFiltersContextType | undefined>(undefined);

export function CargoFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<CargoFilters>(defaultFilters);

  const hasActiveFilters =
    filters.minWeight > 0 ||
    filters.maxWeight < 5000 ||
    filters.minCompensation > 0 ||
    filters.maxCompensation < 10000 ||
    filters.vehicleTypes.length > 0 ||
    filters.cargoTypes.length > 0;

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <CargoFiltersContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </CargoFiltersContext.Provider>
  );
}

export function useCargoFilters() {
  const context = useContext(CargoFiltersContext);
  if (!context) {
    throw new Error("useCargoFilters must be used within CargoFiltersProvider");
  }
  return context;
}
