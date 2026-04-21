import { Assignment, Vehicle, Manifest, DriverNotes } from "./supabase";

export const mockVehicles: Vehicle[] = [
  {
    id: "v1",
    license_plate: "ABC-1234",
    model: "Mercedes Sprinter",
    capacity: 12,
    company_id: "comp1",
    created_at: new Date().toISOString(),
  },
  {
    id: "v2",
    license_plate: "XYZ-5678",
    model: "Ford Transit",
    capacity: 8,
    company_id: "comp1",
    created_at: new Date().toISOString(),
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: "a1",
    driver_id: "driver1",
    route_id: "r1",
    route_name: "Downtown Route A",
    vehicle_id: "v1",
    status: "assigned",
    scheduled_departure: new Date(Date.now() + 3600000).toISOString(),
    scheduled_arrival: new Date(Date.now() + 7200000).toISOString(),
    passenger_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a2",
    driver_id: "driver1",
    route_id: "r2",
    route_name: "Airport Express",
    vehicle_id: "v1",
    status: "assigned",
    scheduled_departure: new Date(Date.now() + 10800000).toISOString(),
    scheduled_arrival: new Date(Date.now() + 14400000).toISOString(),
    passenger_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "a3",
    driver_id: "driver1",
    route_id: "r3",
    route_name: "Evening Shuttle",
    vehicle_id: "v1",
    status: "en_route",
    scheduled_departure: new Date(Date.now() - 1800000).toISOString(),
    scheduled_arrival: new Date(Date.now() + 1800000).toISOString(),
    passenger_count: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockManifests: Manifest[] = [
  {
    id: "m1",
    assignment_id: "a1",
    passenger_name: "John Smith",
    reserved_seat: "1A",
    created_at: new Date().toISOString(),
  },
  {
    id: "m2",
    assignment_id: "a1",
    passenger_name: "Jane Doe",
    reserved_seat: "1B",
    created_at: new Date().toISOString(),
  },
  {
    id: "m3",
    assignment_id: "a1",
    passenger_name: "Robert Johnson",
    reserved_seat: "2A",
    created_at: new Date().toISOString(),
  },
];

export const mockDriverNotes = {
  a1: {
    id: "dn1",
    assignment_id: "a1",
    notes: "Route A - Standard pickup and dropoff",
    special_instructions: "Please arrive 10 minutes early for passenger check-in.",
    created_at: new Date().toISOString(),
  },
  a2: {
    id: "dn2",
    assignment_id: "a2",
    notes: "Airport Express - Time-sensitive route",
    special_instructions: "Ensure all passengers have luggage. Confirm flight times at pickup.",
    created_at: new Date().toISOString(),
  },
  a3: {
    id: "dn3",
    assignment_id: "a3",
    notes: "Evening Shuttle - Regular route",
    special_instructions: "Standard evening service. No special requirements.",
    created_at: new Date().toISOString(),
  },
};

export function getAssignmentStatus(status: string): { label: string; color: string } {
  switch (status) {
    case "assigned":
      return { label: "Assigned", color: "#0a7ea4" };
    case "en_route":
      return { label: "En Route", color: "#F59E0B" };
    case "completed":
      return { label: "Completed", color: "#22C55E" };
    case "cancelled":
      return { label: "Cancelled", color: "#EF4444" };
    default:
      return { label: "Unknown", color: "#687076" };
  }
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
