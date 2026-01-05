import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../database/db";
import { loginSchema } from "../utils/validation";

export async function login(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { username, password } = validatedData;

    // Find user
    const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
    const user = await stmt.get(username) as { id: string; username: string; password: string } | undefined;

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Credenciales inválidas",
      });
    }

    // Verify password
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Credenciales inválidas",
      });
    }

    // Generate JWT token
    const jwtSecret: string = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
    const expiresIn: string = process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      jwtSecret,
      { expiresIn } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return res.status(400).json({
        error: "Validation Error",
        message: "Los datos proporcionados no son válidos",
        details: error.message,
      });
    }
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error al procesar la solicitud",
    });
  }
}

