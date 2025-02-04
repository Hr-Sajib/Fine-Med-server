import { Request, Response } from "express";
import { OrderServices } from "./order.service";

// Define Mongoose validation error type
type ValidationError = {
    name: string;
    errors: Record<string, { message: string; name: string; properties: unknown }>;
};

const createOrder = async (req: Request, res: Response) => {
    try {
        const order = req.body.order;

        // Call service function to send this data
        const result = await OrderServices.createOrderIntoDB(order);

        // Send response correctly
        return res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            data: result,
        });

    } catch (err: unknown) {
        // Handle Mongoose validation errors
        if ((err as ValidationError).name === "ValidationError") {
            const errors: Record<string, { message: string; name: string; properties: unknown }> = {};

            Object.keys((err as ValidationError).errors).forEach((key) => {
                errors[key] = {
                    message: (err as ValidationError).errors[key].message,
                    name: (err as ValidationError).errors[key].name,
                    properties: (err as ValidationError).errors[key].properties,
                };
            });

            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: {
                    name: "ValidationError",
                    errors,
                },
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: (err as Error).message || "Something went wrong",
        });
    }
};

const getRevenue = async (req: Request, res: Response) => {
    try {
        // Call service function to calculate total revenue
        const totalRevenue = await OrderServices.calculateRevenue();

        return res.status(200).json({
            success: true,
            message: "Revenue calculated successfully",
            data: {
                totalRevenue,
            },
        });

    } catch (err: unknown) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: (err as Error).message || "Something went wrong",
        });
    }
};

export const OrderController = { createOrder, getRevenue };
