import { storage } from "./storage";
import type { InsertProperty } from "@shared/schema";

// Sample property data for demonstration
const sampleProperties: InsertProperty[] = [
  {
    title: "Luxury 3BHK Apartment in Koramangala",
    description: "Modern 3-bedroom apartment with premium amenities, balcony with garden view, and covered parking.",
    action: "buy",
    category: "residential",
    type: "flat",
    location: "Koramangala",
    city: "Bangalore",
    state: "Karnataka",
    price: "9500000",
    area: "1450",
    bedrooms: 3,
    bathrooms: 2,
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Power Backup", "Lift"],
    images: [],
    contactPhone: "+91-9876543210",
    contactEmail: "sales@koramangala.properties",
    embedding: null,
    isActive: true
  },
  {
    title: "2BHK Flat for Rent in Indiranagar",
    description: "Well-furnished 2-bedroom flat in prime location with easy access to metro and shopping centers.",
    action: "rent",
    category: "residential", 
    type: "flat",
    location: "Indiranagar",
    city: "Bangalore",
    state: "Karnataka",
    price: "35000",
    area: "1200",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Furnished", "AC", "Parking", "Internet Ready"],
    images: [],
    contactPhone: "+91-9876543211",
    contactEmail: "rent@indiranagar.homes",
    embedding: null,
    isActive: true
  },
  {
    title: "4BHK Independent Villa in Whitefield",
    description: "Spacious villa with garden, separate servant quarters, and modern fittings throughout.",
    action: "buy",
    category: "residential",
    type: "villa", 
    location: "Whitefield",
    city: "Bangalore",
    state: "Karnataka",
    price: "18500000",
    area: "3200",
    bedrooms: 4,
    bathrooms: 4,
    amenities: ["Garden", "Servant Quarter", "Car Garage", "Solar Panels", "Bore Well"],
    images: [],
    contactPhone: "+91-9876543212",
    contactEmail: "villas@whitefield.properties",
    embedding: null,
    isActive: true
  },
  {
    title: "1BHK Studio Apartment in Electronic City",
    description: "Compact studio apartment perfect for young professionals, fully furnished with modern amenities.",
    action: "rent",
    category: "residential",
    type: "flat",
    location: "Electronic City",
    city: "Bangalore", 
    state: "Karnataka",
    price: "18000",
    area: "650",
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["Fully Furnished", "Wi-Fi", "AC", "Refrigerator", "Washing Machine"],
    images: [],
    contactPhone: "+91-9876543213",
    contactEmail: "studio@electroniccity.rentals",
    embedding: null,
    isActive: true
  },
  {
    title: "Commercial Office Space in MG Road",
    description: "Prime commercial space suitable for IT companies, with 24/7 access and modern infrastructure.",
    action: "rent",
    category: "commercial",
    type: "house",
    location: "MG Road",
    city: "Bangalore",
    state: "Karnataka", 
    price: "250000",
    area: "5000",
    bedrooms: null,
    bathrooms: 8,
    amenities: ["24/7 Security", "Power Backup", "High Speed Internet", "Conference Rooms", "Parking"],
    images: [],
    contactPhone: "+91-9876543214",
    contactEmail: "commercial@mgroad.offices",
    embedding: null,
    isActive: true
  },
  {
    title: "Residential Plot in Sarjapur Road",
    description: "DTCP approved plot in upcoming residential area with good connectivity and infrastructure.",
    action: "buy",
    category: "residential",
    type: "plot",
    location: "Sarjapur Road",
    city: "Bangalore",
    state: "Karnataka",
    price: "4500000",
    area: "2400",
    bedrooms: null,
    bathrooms: null,
    amenities: ["DTCP Approved", "Clear Title", "Corner Plot", "Road Facing"],
    images: [],
    contactPhone: "+91-9876543215", 
    contactEmail: "plots@sarjapur.lands",
    embedding: null,
    isActive: true
  },
  {
    title: "3BHK Penthouse in HSR Layout",
    description: "Luxury penthouse with terrace garden, premium fittings, and panoramic city views.",
    action: "buy",
    category: "residential",
    type: "flat",
    location: "HSR Layout",
    city: "Bangalore",
    state: "Karnataka",
    price: "15000000",
    area: "2100",
    bedrooms: 3,
    bathrooms: 3,
    amenities: ["Terrace Garden", "Premium Fittings", "Modular Kitchen", "Home Theater", "Jacuzzi"],
    images: [],
    contactPhone: "+91-9876543216",
    contactEmail: "penthouse@hsrlayout.luxury",
    embedding: null,
    isActive: true
  },
  {
    title: "2BHK Apartment for Rent in Marathahalli",
    description: "Semi-furnished apartment near tech parks with easy access to Outer Ring Road.",
    action: "rent",
    category: "residential",
    type: "flat",
    location: "Marathahalli",
    city: "Bangalore",
    state: "Karnataka", 
    price: "28000",
    area: "1100",
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["Semi Furnished", "Near Tech Parks", "Bus Stop Nearby", "Grocery Stores"],
    images: [],
    contactPhone: "+91-9876543217",
    contactEmail: "rentals@marathahalli.homes",
    embedding: null,
    isActive: true
  }
];

export async function seedDatabase() {
  try {
    console.log("🌱 Seeding database with sample properties...");
    
    // Check if properties already exist
    const existingProperties = await storage.getProperties();
    if (existingProperties.length > 0) {
      console.log("✅ Database already has properties, skipping seed.");
      return;
    }
    
    // Create sample properties
    for (const propertyData of sampleProperties) {
      await storage.createProperty(propertyData);
    }
    
    console.log(`✅ Successfully seeded ${sampleProperties.length} properties`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}