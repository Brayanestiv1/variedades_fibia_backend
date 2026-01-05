import { Product } from "../types";

interface DbProduct {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  min_threshold: number;
  created_at: string;
  updated_at: string;
}

export function mapProductFromDb(dbProduct: DbProduct): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || "",
    category: dbProduct.category,
    quantity: dbProduct.quantity,
    minThreshold: dbProduct.min_threshold,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
  };
}

export function mapProductsFromDb(dbProducts: DbProduct[]): Product[] {
  return dbProducts.map(mapProductFromDb);
}

