import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db";
import { AuthRequest } from "../middleware/auth";
import { productSchema } from "../utils/validation";
import { Product } from "../types";
import { mapProductsFromDb, mapProductFromDb } from "../utils/dbMapper";

export async function getAllProducts(req: AuthRequest, res: Response) {
  try {
    if (!req || !req.query) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid request object",
      });
    }
    
    const { search } = req.query;
    const userId = req.userId!;
    
    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User ID not found in request",
      });
    }

    let query = "SELECT * FROM products WHERE user_id = ?";
    const params: any[] = [userId];

    if (search && typeof search === "string") {
      query += " AND name LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY name ASC";

    const stmt = db.prepare(query);
    const dbProducts = await stmt.all(...params) as any[];
    const products = mapProductsFromDb(dbProducts);

    // Calculate low stock count
    const lowStockCount = products.filter(
      (p) => p.quantity <= p.minThreshold
    ).length;

    res.json({
      products,
      total: products.length,
      lowStockCount,
    });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error al obtener los productos",
    });
  }
}

export async function getProductById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const stmt = db.prepare("SELECT * FROM products WHERE id = ? AND user_id = ?");
    const dbProduct = await stmt.get(id, userId) as any;

    if (!dbProduct) {
      return res.status(404).json({
        error: "Not Found",
        message: "Producto no encontrado",
      });
    }

    const product = mapProductFromDb(dbProduct);
    res.json(product);
  } catch (error) {
    console.error("Error getting product:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error al obtener el producto",
    });
  }
}

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const validatedData = productSchema.parse(req.body);
    const userId = req.userId!;

    const productId = uuidv4();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(
      `INSERT INTO products (id, user_id, name, description, category, quantity, min_threshold, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    await insertStmt.run(
      productId,
      userId,
      validatedData.name,
      validatedData.description || "",
      validatedData.category,
      validatedData.quantity,
      validatedData.minThreshold,
      now,
      now
    );

    const selectStmt = db.prepare("SELECT * FROM products WHERE id = ?");
    const dbProduct = await selectStmt.get(productId) as any;

    const product = mapProductFromDb(dbProduct);
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const details: Record<string, string> = {};
      zodError.errors?.forEach((err: any) => {
        details[err.path[0]] = err.message;
      });
      return res.status(400).json({
        error: "Validation Error",
        message: "Los datos proporcionados no son válidos",
        details,
      });
    }
    console.error("Error creating product:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error al crear el producto",
    });
  }
}

export async function updateProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const validatedData = productSchema.parse(req.body);

    // Check if product exists and belongs to user
    const checkStmt = db.prepare("SELECT * FROM products WHERE id = ? AND user_id = ?");
    const existingDbProduct = await checkStmt.get(id, userId) as any;

    if (!existingDbProduct) {
      return res.status(404).json({
        error: "Not Found",
        message: "Producto no encontrado",
      });
    }

    const now = new Date().toISOString();

    const updateStmt = db.prepare(
      `UPDATE products 
       SET name = ?, description = ?, category = ?, quantity = ?, min_threshold = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`
    );
    await updateStmt.run(
      validatedData.name,
      validatedData.description || "",
      validatedData.category,
      validatedData.quantity,
      validatedData.minThreshold,
      now,
      id,
      userId
    );

    const selectStmt = db.prepare("SELECT * FROM products WHERE id = ?");
    const dbProduct = await selectStmt.get(id) as any;

    const updatedProduct = mapProductFromDb(dbProduct);
    res.json(updatedProduct);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const details: Record<string, string> = {};
      zodError.errors?.forEach((err: any) => {
        details[err.path[0]] = err.message;
      });
      return res.status(400).json({
        error: "Validation Error",
        message: "Los datos proporcionados no son válidos",
        details,
      });
    }
    console.error("Error updating product:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error al actualizar el producto",
    });
  }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if product exists and belongs to user
    const checkStmt = db.prepare("SELECT * FROM products WHERE id = ? AND user_id = ?");
    const dbProduct = await checkStmt.get(id, userId) as any;

    if (!dbProduct) {
      return res.status(404).json({
        error: "Not Found",
        message: "Producto no encontrado",
      });
    }

    const deleteStmt = db.prepare("DELETE FROM products WHERE id = ? AND user_id = ?");
    await deleteStmt.run(id, userId);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error al eliminar el producto",
    });
  }
}

