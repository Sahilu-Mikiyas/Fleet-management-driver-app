import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Fleet Driver App Tables
export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  licenseNumber: varchar("licenseNumber", { length: 50 }),
  companyId: varchar("companyId", { length: 100 }),
  isApproved: int("isApproved").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: varchar("id", { length: 100 }).primaryKey(),
  licensePlate: varchar("licensePlate", { length: 50 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  capacity: int("capacity").notNull(),
  companyId: varchar("companyId", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const assignments = mysqlTable("assignments", {
  id: varchar("id", { length: 100 }).primaryKey(),
  driverId: varchar("driverId", { length: 100 }).notNull(),
  routeId: varchar("routeId", { length: 100 }).notNull(),
  routeName: varchar("routeName", { length: 255 }).notNull(),
  vehicleId: varchar("vehicleId", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["assigned", "en_route", "completed", "cancelled"]).default("assigned").notNull(),
  scheduledDeparture: timestamp("scheduledDeparture"),
  scheduledArrival: timestamp("scheduledArrival"),
  passengerCount: int("passengerCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const manifests = mysqlTable("manifests", {
  id: varchar("id", { length: 100 }).primaryKey(),
  assignmentId: varchar("assignmentId", { length: 100 }).notNull(),
  passengerName: varchar("passengerName", { length: 255 }).notNull(),
  reservedSeat: varchar("reservedSeat", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const driverNotes = mysqlTable("driverNotes", {
  id: varchar("id", { length: 100 }).primaryKey(),
  assignmentId: varchar("assignmentId", { length: 100 }).notNull(),
  notes: text("notes"),
  specialInstructions: text("specialInstructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 100 }).primaryKey(),
  driverId: varchar("driverId", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: mysqlEnum("type", ["assignment", "approval", "alert", "message"]).default("message").notNull(),
  isRead: int("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Manifest = typeof manifests.$inferSelect;
export type DriverNote = typeof driverNotes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
