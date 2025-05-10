import { NextFunction, Request, Response } from "express";

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req.body;
    if (!user) {
        return res.status(401).json({
            status: false,
            message: "Unauthorized",
        });
    }
    if (user.role !== "admin") {
        return res.status(403).json({
            status: false,
            message: "Forbidden",
        });
    }
    next();
}