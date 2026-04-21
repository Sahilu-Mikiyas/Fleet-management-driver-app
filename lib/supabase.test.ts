import { describe, it, expect, vi } from "vitest";

describe("Supabase Client Configuration", () => {
  it("should have Supabase URL environment variable set", () => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(supabaseUrl).toBeDefined();
    expect(supabaseUrl).toMatch(/^https:\/\//);
  });

  it("should have Supabase Anon Key environment variable set", () => {
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(supabaseAnonKey).toBeDefined();
    expect(supabaseAnonKey?.length).toBeGreaterThan(0);
  });

  it("should be able to import Supabase client", async () => {
    // Mock AsyncStorage to avoid issues in test environment
    vi.mock("@react-native-async-storage/async-storage", () => ({
      default: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    }));

    const { supabase } = await import("./supabase");
    expect(supabase).toBeDefined();
  });
});
