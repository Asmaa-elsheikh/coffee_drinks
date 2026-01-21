import { z } from "zod";
import { insertUserSchema, insertDrinkSchema, insertOrderSchema, users, drinks, orders, type User, type InsertUser, type Order, type InsertOrder } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  drinks: {
    list: {
      method: "GET" as const,
      path: "/api/drinks",
      responses: {
        200: z.array(z.custom<typeof drinks.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/drinks",
      input: insertDrinkSchema,
      responses: {
        201: z.custom<typeof drinks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/drinks/:id",
      input: insertDrinkSchema.partial(),
      responses: {
        200: z.custom<typeof drinks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/drinks/:id",
      responses: {
        204: z.void(),
      },
    },
  },
  orders: {
    list: {
      method: "GET" as const,
      path: "/api/orders",
      input: z.object({
        status: z.string().optional(),
        userId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect & { drink: typeof drinks.$inferSelect, user: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/orders",
      input: insertOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: "PATCH" as const,
      path: "/api/orders/:id/status",
      input: z.object({
        status: z.enum(["pending", "accepted", "in_preparation", "ready", "completed", "rejected"]),
        rejectionReason: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  analytics: {
    stats: {
      method: "GET" as const,
      path: "/api/analytics/stats",
      responses: {
        200: z.object({
          totalOrders: z.number(),
          popularDrinks: z.array(z.object({ name: z.string(), count: z.number() })),
          ordersByStatus: z.record(z.number()),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
