export interface CargoListing {
  id: string;
  title: string;
  description: string;
  weight: number; // in kg
  dimensions: string; // e.g., "100x50x50 cm"
  cargoType: "fragile" | "perishable" | "hazardous" | "standard";
  pickupLocation: string;
  pickupAddress: string;
  deliveryLocation: string;
  deliveryAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  compensation: number; // in USD
  distance: number; // in km
  estimatedTime: string; // e.g., "2 hours"
  shipperName: string;
  shipperRating: number; // 1-5
  shipperReviews: number;
  image: string; // emoji or icon
  imageUrl: string; // URL to cargo image
  status: "available" | "accepted" | "completed";
  createdAt: string;
  expiresAt: string;
  specialInstructions?: string;
}

export const mockCargoListings: CargoListing[] = [
  {
    id: "cargo_1",
    title: "Electronics Package",
    description: "Fragile electronics shipment - handles with care",
    weight: 15,
    dimensions: "60x40x30 cm",
    cargoType: "fragile",
    pickupLocation: "Tech Hub Downtown",
    pickupAddress: "123 Tech Street, Downtown",
    deliveryLocation: "Warehouse District",
    deliveryAddress: "456 Industrial Ave, Warehouse",
    pickupLat: 40.7128,
    pickupLng: -74.006,
    deliveryLat: 40.7489,
    deliveryLng: -73.968,
    compensation: 85.0,
    distance: 12.5,
    estimatedTime: "1.5 hours",
    shipperName: "TechCorp Solutions",
    shipperRating: 4.8,
    shipperReviews: 342,
    image: "📦",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T08:00:00Z",
    expiresAt: "2026-03-28T14:00:00Z",
    specialInstructions: "Keep upright, avoid moisture",
  },
  {
    id: "cargo_2",
    title: "Fresh Produce Delivery",
    description: "Organic vegetables and fruits - temperature controlled",
    weight: 45,
    dimensions: "80x60x50 cm",
    cargoType: "perishable",
    pickupLocation: "Central Market",
    pickupAddress: "789 Market Street, Downtown",
    deliveryLocation: "Restaurant District",
    deliveryAddress: "321 Dining Lane, Uptown",
    pickupLat: 40.7505,
    pickupLng: -73.9972,
    deliveryLat: 40.7614,
    deliveryLng: -73.9776,
    compensation: 120.0,
    distance: 8.3,
    estimatedTime: "1 hour",
    shipperName: "Fresh Farms Co.",
    shipperRating: 4.9,
    shipperReviews: 521,
    image: "🥬",
    imageUrl: "https://images.unsplash.com/photo-1488459716781-6a3ee276b330?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T07:30:00Z",
    expiresAt: "2026-03-28T12:00:00Z",
    specialInstructions: "Deliver before 2 PM, keep cool",
  },
  {
    id: "cargo_3",
    title: "Office Furniture",
    description: "Desk, chairs, and filing cabinets for office setup",
    weight: 120,
    dimensions: "200x150x100 cm",
    cargoType: "standard",
    pickupLocation: "Furniture Store",
    pickupAddress: "555 Furniture Blvd, Suburb",
    deliveryLocation: "Business Park",
    deliveryAddress: "777 Corporate Drive, Business Park",
    pickupLat: 40.6892,
    pickupLng: -74.0445,
    deliveryLat: 40.7282,
    deliveryLng: -74.0076,
    compensation: 150.0,
    distance: 15.8,
    estimatedTime: "2 hours",
    shipperName: "Office Depot Plus",
    shipperRating: 4.6,
    shipperReviews: 289,
    image: "🪑",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T08:15:00Z",
    expiresAt: "2026-03-28T16:00:00Z",
    specialInstructions: "Careful with glass surfaces",
  },
  {
    id: "cargo_4",
    title: "Medical Supplies",
    description: "Pharmaceutical supplies - temperature sensitive",
    weight: 8,
    dimensions: "40x30x25 cm",
    cargoType: "hazardous",
    pickupLocation: "Medical Warehouse",
    pickupAddress: "999 Health Ave, Medical District",
    deliveryLocation: "Hospital Complex",
    deliveryAddress: "111 Hospital Road, Medical Center",
    pickupLat: 40.7549,
    pickupLng: -73.9840,
    deliveryLat: 40.7614,
    deliveryLng: -73.9776,
    compensation: 95.0,
    distance: 5.2,
    estimatedTime: "45 minutes",
    shipperName: "HealthCare Logistics",
    shipperRating: 5.0,
    shipperReviews: 156,
    image: "💊",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde0e?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T08:45:00Z",
    expiresAt: "2026-03-28T13:00:00Z",
    specialInstructions: "Maintain 2-8°C temperature, urgent delivery",
  },
  {
    id: "cargo_5",
    title: "Books & Magazines",
    description: "Educational materials shipment",
    weight: 35,
    dimensions: "70x50x40 cm",
    cargoType: "standard",
    pickupLocation: "Publishing House",
    pickupAddress: "222 Print Street, Downtown",
    deliveryLocation: "Library System",
    deliveryAddress: "333 Knowledge Way, Uptown",
    pickupLat: 40.7128,
    pickupLng: -74.006,
    deliveryLat: 40.7580,
    deliveryLng: -73.9855,
    compensation: 65.0,
    distance: 9.1,
    estimatedTime: "1.5 hours",
    shipperName: "Educational Press Inc.",
    shipperRating: 4.7,
    shipperReviews: 198,
    image: "📚",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583f20270319?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T09:00:00Z",
    expiresAt: "2026-03-28T17:00:00Z",
  },
  {
    id: "cargo_6",
    title: "Clothing & Textiles",
    description: "Fashion items for retail distribution",
    weight: 50,
    dimensions: "100x80x60 cm",
    cargoType: "standard",
    pickupLocation: "Fashion Warehouse",
    pickupAddress: "444 Style Avenue, Suburb",
    deliveryLocation: "Shopping Mall",
    deliveryAddress: "555 Mall Road, Downtown",
    pickupLat: 40.6892,
    pickupLng: -74.0445,
    deliveryLat: 40.7128,
    deliveryLng: -74.006,
    compensation: 75.0,
    distance: 11.2,
    estimatedTime: "1.5 hours",
    shipperName: "Fashion Forward Ltd.",
    shipperRating: 4.5,
    shipperReviews: 267,
    image: "👕",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T09:15:00Z",
    expiresAt: "2026-03-28T15:00:00Z",
  },
  {
    id: "cargo_7",
    title: "Restaurant Equipment",
    description: "Kitchen equipment and appliances",
    weight: 200,
    dimensions: "150x120x100 cm",
    cargoType: "standard",
    pickupLocation: "Equipment Supplier",
    pickupAddress: "666 Industrial Park, Suburb",
    deliveryLocation: "Restaurant",
    deliveryAddress: "777 Dining Street, Downtown",
    pickupLat: 40.6892,
    pickupLng: -74.0445,
    deliveryLat: 40.7128,
    deliveryLng: -74.006,
    compensation: 200.0,
    distance: 18.5,
    estimatedTime: "2.5 hours",
    shipperName: "RestaurantPro Supplies",
    shipperRating: 4.8,
    shipperReviews: 412,
    image: "🍳",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T09:30:00Z",
    expiresAt: "2026-03-28T18:00:00Z",
    specialInstructions: "Requires 2 people for unloading",
  },
  {
    id: "cargo_8",
    title: "Construction Materials",
    description: "Building supplies and materials",
    weight: 300,
    dimensions: "200x200x150 cm",
    cargoType: "standard",
    pickupLocation: "Building Supply Store",
    pickupAddress: "888 Construction Blvd, Industrial",
    deliveryLocation: "Construction Site",
    deliveryAddress: "999 Build Street, Suburb",
    pickupLat: 40.6892,
    pickupLng: -74.0445,
    deliveryLat: 40.7282,
    deliveryLng: -74.0076,
    compensation: 250.0,
    distance: 22.3,
    estimatedTime: "3 hours",
    shipperName: "BuildRight Materials",
    shipperRating: 4.4,
    shipperReviews: 334,
    image: "🏗️",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695c952952?w=400&h=300&fit=crop",
    status: "available",
    createdAt: "2026-03-28T08:00:00Z",
    expiresAt: "2026-03-28T20:00:00Z",
    specialInstructions: "Heavy load, ensure vehicle capacity",
  },
];

export const getCargoByType = (type: string) => {
  return mockCargoListings.filter((cargo) => cargo.cargoType === type);
};

export const getCargoByDistance = (maxDistance: number) => {
  return mockCargoListings.filter((cargo) => cargo.distance <= maxDistance);
};

export const getCargoByCompensation = (minCompensation: number) => {
  return mockCargoListings.filter((cargo) => cargo.compensation >= minCompensation);
};

export const sortCargoBy = (
  cargo: CargoListing[],
  sortBy: "price" | "distance" | "weight" | "rating"
) => {
  const sorted = [...cargo];
  switch (sortBy) {
    case "price":
      return sorted.sort((a, b) => b.compensation - a.compensation);
    case "distance":
      return sorted.sort((a, b) => a.distance - b.distance);
    case "weight":
      return sorted.sort((a, b) => a.weight - b.weight);
    case "rating":
      return sorted.sort((a, b) => b.shipperRating - a.shipperRating);
    default:
      return sorted;
  }
};
