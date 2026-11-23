CREATE TABLE `mensajes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`telefono` text NOT NULL,
	`correo` text NOT NULL,
	`servicio` text,
	`ubicacion` text NOT NULL,
	`mensaje` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `propiedades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`titulo` text NOT NULL,
	`precio` text NOT NULL,
	`ubicacion` text NOT NULL,
	`transaccion` text NOT NULL,
	`tipo` text NOT NULL,
	`imagen` text NOT NULL,
	`detalles` text,
	`contacto` text,
	`imagenes` text,
	`moneda` text DEFAULT 'MXN',
	`estado` text,
	`municipio` text,
	`habitaciones` integer,
	`banos` integer,
	`metros_construccion` integer,
	`metros_terreno` integer,
	`servicios` integer DEFAULT false,
	`tiene_garage` integer DEFAULT false,
	`tiene_patio` integer DEFAULT false,
	`estacionamiento` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
