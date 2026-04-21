CREATE TABLE `assignments` (
	`id` varchar(100) NOT NULL,
	`driverId` varchar(100) NOT NULL,
	`routeId` varchar(100) NOT NULL,
	`routeName` varchar(255) NOT NULL,
	`vehicleId` varchar(100) NOT NULL,
	`status` enum('assigned','en_route','completed','cancelled') NOT NULL DEFAULT 'assigned',
	`scheduledDeparture` timestamp,
	`scheduledArrival` timestamp,
	`passengerCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driverNotes` (
	`id` varchar(100) NOT NULL,
	`assignmentId` varchar(100) NOT NULL,
	`notes` text,
	`specialInstructions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driverNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`name` varchar(255) NOT NULL,
	`licenseNumber` varchar(50),
	`companyId` varchar(100),
	`isApproved` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`),
	CONSTRAINT `drivers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `manifests` (
	`id` varchar(100) NOT NULL,
	`assignmentId` varchar(100) NOT NULL,
	`passengerName` varchar(255) NOT NULL,
	`reservedSeat` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `manifests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(100) NOT NULL,
	`driverId` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`type` enum('assignment','approval','alert','message') NOT NULL DEFAULT 'message',
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` varchar(100) NOT NULL,
	`licensePlate` varchar(50) NOT NULL,
	`model` varchar(255) NOT NULL,
	`capacity` int NOT NULL,
	`companyId` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
