import { Request, Response } from "express";
import mongoose from "mongoose";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { OrderServices } from "./order.service";
import SSLCommerzPayment from "sslcommerz-lts";
import AppError from "../../errors/AppError";
import config from "../../../config";

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const order = req.body;

  // console.log("order-ctrl: ", order)

  // payment
  const store_id = config.ssl_store_id as string;
  const store_passwd = config.ssl_store_passwd as string;
  const is_live = false;

// Generate dynamic transaction ID
const transactionId = `TRANS_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

const data = {
    total_amount: order.totalPrice,
    currency: 'BDT',
    tran_id: transactionId,
    success_url: `https://fine-med-server.vercel.app/api/orders/payment-success/${transactionId}`,
    fail_url: `https://fine-med-server.vercel.app/api/orders/payment-failed/${transactionId}`,
    cancel_url: `https://fine-med-server.vercel.app/api/orders/payment-cancel/orders/${transactionId}`,
    ipn_url: 'https://fine-med-server.vercel.app/api/orders/ipn',
    shipping_method: 'Courier',
    product_name: "baler product",
    product_category: 'Electronic',
    product_profile: 'general',
    cus_name: order.userName,
    cus_email: order.userEmail,
    cus_add1: 'Dhaka',
    cus_add2: 'Dhaka',
    cus_city: 'Dhaka',
    cus_state: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: order.contactNumber,
    cus_fax: '01711111111',
    ship_name: 'Customer Name',
    ship_add1: 'Dhaka',
    ship_add2: 'Dhaka',
    ship_city: 'Dhaka',
    ship_state: 'Dhaka',
    ship_postcode: 1000,
    ship_country: 'Bangladesh',
  };

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

  const apiResponse = await sslcz.init(data); // 🔥 Await here
  // console.log("📦 Full SSLCommerz API GatewayPageURL:", apiResponse.GatewayPageURL);

  const GatewayPageURL = apiResponse?.GatewayPageURL;

  console.log("orderdata: ",order);
  console.log("apiResponse: ",apiResponse);

  // console.log()

  if (!GatewayPageURL) {
    console.log("❌ No GatewayPageURL returned");
    throw new Error("Failed to generate payment URL");
  }


  
  // console.log("controller level order: ",order)
  let result;
  if(order.paymentMethod == "sslcommerz"){
    result = await OrderServices.createOrderIntoDB({...order,transactionId});
  }
  else{
    result = await OrderServices.createOrderIntoDB(order);

  }


  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Order placed successfully.",
    data: result,
  },
  GatewayPageURL
  );
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await OrderServices.getAllOrdersFromDB(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders retrieved successfully.",
    data: result,
  });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID format");
  }

  const result = await OrderServices.getSingleOrderFromDB(orderId);
  if (!result) {
    throw new Error(`No order found with ID: ${orderId}`);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order retrieved successfully.",
    data: result,
  });
});

const updateOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const updatedData = req.body;


  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID format");
  }

  const result = await OrderServices.updateOrderInDB(orderId, updatedData);
  if (!result) {
    throw new Error("Order not found");
  }


//   app.post('/send-mail', (req, res) => {
//     const { name, email } = req.body;

//     const transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: process.env.EMAIL_USER,  
//             pass: process.env.EMAIL_PASS,  
//         },
//     });

//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Newsletter Subscription',
//         html: `
//         <div style="font-family: Arial, sans-serif; color: #333;">
//             <h1 style="color: #c2410c;">Hello ${name},</h1>
//             <p>Thank you for subscribing to our newsletter!</p>
//             <p style="font-size: 16px; color: #555;">We're excited to have you on board. Stay tuned for the latest updates.</p>
//             <p style="font-size: 14px;">Best Regards</p>
//             <p style="color: #c2410c;"><b>EventHub Team</b></p>
//         </div>
//     `,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error('Error sending email:', error);
//             return res.status(500).send({ error: 'Error sending email' });
//         }
//         console.log('Email sent:', info.response);
//         res.status(200).send({ message: 'Email sent successfully' });
//     });
// });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order updated successfully.",
    data: result,
  });
});

const deleteOrder = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID format");
  }

  const result = await OrderServices.deleteOrderFromDB(orderId);
  if (!result) {
    throw new Error("Order not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order deleted successfully.",
    data: null,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const user = req.user; 
  if (!user || !user.userEmail) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized access");
  }

  const orders = await OrderServices.getOrdersByEmail(user.userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your orders retrieved successfully",
    data: orders,
  });
});

export const verifyPrescription = catchAsync(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const result = await OrderServices.verifyPrescriptionService(orderId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Prescription verified successfully",
      data: result,
    });
  }
);

export const OrderController = {
  createOrder,
  getAllOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
  getMyOrders,
  verifyPrescription
};
