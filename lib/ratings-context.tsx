import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Rating {
  id: string;
  tripId: string;
  shipper: string;
  rating: number; // 1-5
  feedback: string;
  date: string;
  cargoType: string;
}

interface RatingsContextType {
  ratings: Rating[];
  addRating: (rating: Rating) => Promise<void>;
  getRatings: () => Promise<void>;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
}

const RatingsContext = createContext<RatingsContextType | undefined>(undefined);

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    getRatings();
  }, []);

  const getRatings = async () => {
    try {
      const stored = await AsyncStorage.getItem("driver_ratings");
      if (stored) {
        setRatings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load ratings:", error);
    }
  };

  const addRating = async (rating: Rating) => {
    try {
      const updated = [...ratings, rating];
      setRatings(updated);
      await AsyncStorage.setItem("driver_ratings", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save rating:", error);
    }
  };

  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

  const ratingDistribution: Record<number, number> = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratings.forEach((r) => {
    ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
  });

  return (
    <RatingsContext.Provider
      value={{
        ratings,
        addRating,
        getRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
        ratingDistribution,
      }}
    >
      {children}
    </RatingsContext.Provider>
  );
}

export function useRatings() {
  const context = useContext(RatingsContext);
  if (!context) {
    throw new Error("useRatings must be used within RatingsProvider");
  }
  return context;
}
