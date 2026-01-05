import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Token de autenticación requerido",
    });
  }

  const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; username: string };
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Token inválido o expirado",
    });
  }
}

