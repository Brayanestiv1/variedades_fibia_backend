export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  minThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryExit {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  createdAt: string;
}

export type ProductCategory = "Perfumes" | "Cremas" | "Maquillajes" | "Otros";

export const VALID_CATEGORIES: ProductCategory[] = [
  "Perfumes",
  "Cremas",
  "Maquillajes",
  "Otros",
];

