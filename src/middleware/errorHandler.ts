import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);
  console.error("Stack:", err.stack);
  console.error("Request:", req.method, req.path);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Los datos proporcionados no son válidos",
      details: err.message,
    });
  }

  // Handle Zod errors
  if ((err as any).issues) {
    return res.status(400).json({
      error: "Validation Error",
      message: "Los datos proporcionados no son válidos",
      details: (err as any).issues,
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: "Ocurrió un error en el servidor",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
}

