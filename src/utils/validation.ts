import { z } from "zod";
import { VALID_CATEGORIES } from "../types";

export const productSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres"),
  description: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional()
    .default(""),
  category: z.enum(
    ["Perfumes", "Cremas", "Maquillajes", "Otros"] as const,
    {
      errorMap: () => ({
        message: `La categoría debe ser una de: ${VALID_CATEGORIES.join(", ")}`,
      }),
    }
  ),
  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .min(0, "La cantidad debe ser mayor o igual a 0"),
  minThreshold: z
    .number()
    .int("El umbral mínimo debe ser un número entero")
    .min(0, "El umbral mínimo debe ser mayor o igual a 0"),
});

export const exitSchema = z.object({
  productId: z.string().min(1, "El ID del producto es requerido"),
  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad debe ser mayor a 0"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

