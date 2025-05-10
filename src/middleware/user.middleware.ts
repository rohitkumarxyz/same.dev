import { NextFunction, Request, Response } from "express";

export const userMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { user } = req.body;
  if (!user) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized",
    });
  }
  if (user.role !== "user") {
    return res.status(403).json({
      status: false,
      message: "Forbidden",
    });
  }
  next();
}