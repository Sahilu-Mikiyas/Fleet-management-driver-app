import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (cargoId: string) => Promise<void>;
  removeFavorite: (cargoId: string) => Promise<void>;
  isFavorite: (cargoId: string) => boolean;
  clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem("cargo_favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites: string[]) => {
    try {
      await AsyncStorage.setItem("cargo_favorites", JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const addFavorite = async (cargoId: string) => {
    if (!favorites.includes(cargoId)) {
      await saveFavorites([...favorites, cargoId]);
    }
  };

  const removeFavorite = async (cargoId: string) => {
    await saveFavorites(favorites.filter((id) => id !== cargoId));
  };

  const isFavorite = (cargoId: string) => favorites.includes(cargoId);

  const clearFavorites = async () => {
    await saveFavorites([]);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
