import { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../database/db";
import { AuthRequest } from "../middleware/auth";
import { exitSchema } from "../utils/validation";
import { Product } from "../types";
import { mapProductFromDb } from "../utils/dbMapper";

export async function registerExit(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const validatedData = exitSchema.parse({
      ...req.body,
      productId: id,
    });

    // Get product and verify it belongs to user
    const selectStmt = db.prepare("SELECT * FROM products WHERE id = ? AND user_id = ?");
    const dbProduct = await selectStmt.get(id, userId) as any;

    if (!dbProduct) {
      return res.status(404).json({
        error: "Not Found",
        message: "Producto no encontrado",
      });
    }

    const product = mapProductFromDb(dbProduct);

    // Validate quantity
    if (validatedData.quantity > product.quantity) {
      return res.status(400).json({
        error: "Bad Request",
        message: "La cantidad a descontar es mayor que el stock disponible",
      });
    }

    if (validatedData.quantity <= 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "La cantidad debe ser mayor a 0",
      });
    }

    // Calculate new quantity
    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity - validatedData.quantity;
    const isLowStock = newQuantity <= product.minThreshold;

    // Update product quantity
    const now = new Date().toISOString();
    const updateStmt = db.prepare(
      "UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?"
    );
    await updateStmt.run(newQuantity, now, id);

    // Record inventory exit for audit
    const exitId = uuidv4();
    const insertStmt = db.prepare(
      `INSERT INTO inventory_exits (id, product_id, user_id, quantity, previous_quantity, new_quantity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    await insertStmt.run(
      exitId,
      id,
      userId,
      validatedData.quantity,
      previousQuantity,
      newQuantity,
      now
    );

    // Get updated product
    const selectUpdatedStmt = db.prepare("SELECT * FROM products WHERE id = ?");
    const updatedDbProduct = await selectUpdatedStmt.get(id) as any;
    const updatedProduct = mapProductFromDb(updatedDbProduct);

    res.json({
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        quantity: updatedProduct.quantity,
        minThreshold: updatedProduct.minThreshold,
      },
      exitQuantity: validatedData.quantity,
      newQuantity,
      isLowStock,
      timestamp: now,
    });
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
    console.error("Error registering exit:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error al registrar la salida",
    });
  }
}

