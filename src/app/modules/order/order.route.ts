import express from "express";
import { OrderController } from "./order.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { OrderValidation } from "./order.validation";
import { OrderModel } from "./order.model";

const router = express.Router();


router.post(
  "/",
  validateRequest(OrderValidation.createOrderValidationSchema),
  auth("admin", "customer"),
  OrderController.createOrder
);

// Get all orders (admin only)
router.get(
  "/",
  auth("admin"),
  OrderController.getAllOrders
);

router.patch(
  "/verify-prescription/:orderId",
  auth("admin"),
  OrderController.verifyPrescription
);

router.get(
  "/myOrders",
  auth("customer","admin"),
  OrderController.getMyOrders
);

// Get a single order by ID (admin only)
router.get(
  "/:orderId",
  auth("admin"),
  OrderController.getSingleOrder
);

// Update an order by ID (admin only)
router.patch(
  "/:orderId",
  validateRequest(OrderValidation.updateOrderValidationSchema),
  auth("admin"),
  OrderController.updateOrder
);

// Delete an order by ID (admin only)
router.delete(
  "/:orderId",
  auth("admin"),
  OrderController.deleteOrder
);




/**
 * SSLCommerz Payment Routes
 */



// IPN (Instant Payment Notification) from SSLCommerz
router.post("/ipn", (req, res) => {
  console.log("🔔 IPN Received:", req.body);
  // TODO: Validate val_id with SSLCommerz, then update order status
  res.status(200).send("IPN Received");
});

// Payment success redirect
router.post("/payment-success/:transID", async (req, res) => {
  const transID = req.params.transID;

  const order = await OrderModel.findOneAndUpdate(
    { transactionId: transID },
    { $set: { status: "processing" } },
    { new: true }
  );

  res.redirect(
    `https://finemed.sajibofficial.me/payment-success/${order?.transactionId}`
  );
});

// Payment failure redirect
router.post("/payment-failed/:transID", async (req, res) => {
  const transID = req.params.transID;
  res.redirect(
    `https://finemed.sajibofficial.me/payment-fail/${transID}`
  );
});

// Payment cancel redirect
router.post("/payment-cancel/:transID", async (req, res) => {
  const transID = req.params.transID;
  res.redirect(
    `https://finemed.sajibofficial.me/payment-fail/${transID}`
  );
  res.status(200).send("Payment cancelled");
});

export const OrderRoutes = router;
