import { IOrder } from "./order.interface";
import { OrderModel } from "./order.model";
import { ProductModel } from "../product/product.model";
import { UserModel } from "../User/user.model";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import nodemailer from "nodemailer";

const createOrderIntoDB = async (order: IOrder) => {
  const { userEmail, products } = order;


  // Check if user exists
  const userInDB = await UserModel.isUserExistsByEmail(userEmail);
  if (!userInDB) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }


let prescriptionRequiredFlag = false;


  // Validate each product in the order
  for (const item of products) {
    const productInDB = await ProductModel.findById(item.productId);
    if (!productInDB) {
      throw new AppError(httpStatus.NOT_FOUND, `Product with ID ${item.productId} not found`);
    }

    // Check if stock is sufficient
    if (productInDB.quantity < item.quantity) {
      throw new AppError(httpStatus.BAD_REQUEST, `Insufficient stock for product ${item.productId}`);
    }

    //update product stock
    const newQuantity = productInDB.quantity - item.quantity;
    const quantityUpdate = await ProductModel.findByIdAndUpdate(
            productInDB._id,
            { $set: {quantity:newQuantity} })
    if(!quantityUpdate){
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating product stock!")
    }

    // If any product requires prescription, set to false
    if (productInDB.prescriptionRequired) {
      prescriptionRequiredFlag = true;
    }
  }

  // 🔥 Set prescriptionRequired on the order based on products ordered
  if(prescriptionRequiredFlag){
    if(!order.prescriptionImageLink){
      throw new AppError(httpStatus.UNAUTHORIZED, "Prescription Required but not provided!")
    }
  }

  order.prescriptionRequired = prescriptionRequiredFlag;

  // Create the order
  return await OrderModel.create(order);
};


const getAllOrdersFromDB = async (query: Record<string, unknown>) => {
  try {
    const ordersQuery = new QueryBuilder(OrderModel.find(), query)
      .filter()
      .sort()
      .paginate()
      .fields();

    return await ordersQuery.modelQuery.populate("products.productId").exec();
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new AppError(httpStatus.BAD_REQUEST, "Failed to fetch orders");
  }
};

const getSingleOrderFromDB = async (orderId: string) => {
  return await OrderModel.findById(orderId).populate("products.productId");
};

const updateOrderInDB = async (orderId: string, updatedData: Partial<IOrder>) => {
  const existingOrder = await OrderModel.findById(orderId);
  if (!existingOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (updatedData.status) {
    // Configure Nodemailer transporter
    // CHANGE HERE: Replace 'gmail' with another service (e.g., 'sendgrid', 'mailgun') if needed
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // e.g., your_gmail@gmail.com
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: existingOrder.userEmail,
      subject: "FineMed Order Status Update",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h1 style="color: #0d9488;">Hello ${existingOrder.userName},</h1>
          <p>Your order status has been updated.</p>
          <p style="font-size: 16px; color: #555;">
            Order ID: ${existingOrder._id}<br />
            New Status: <strong>${updatedData.status}</strong>
          </p>
          <p style="font-size: 14px;">Thank you for shopping with us!</p>
          <p style="color: #0d9488;"><b>FineMed Team</b></p>
        </div>
      `,
    };

    // Send email 
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  // Handle product quantity updates
  if (updatedData.products) {
    for (const updatedItem of updatedData.products) {
      const existingItem = existingOrder.products.find(
        (item) => item.productId.toString() === updatedItem.productId.toString()
      );

      if (existingItem) {
        const product = await ProductModel.findById(existingItem.productId);
        if (!product) {
          throw new AppError(httpStatus.NOT_FOUND, "Associated product not found");
        }

        const quantityDiff = existingItem.quantity - updatedItem.quantity;
        const newQuantity = product.quantity + quantityDiff;

        if (newQuantity < 0) {
          throw new AppError(httpStatus.BAD_REQUEST, "Insufficient stock to update order");
        }
      }
    }
  }

  return await OrderModel.findByIdAndUpdate(orderId, updatedData, { new: true }).populate(
    "products.productId"
  );
};


// const updateOrderInDB = async (orderId: string, updatedData: Partial<IOrder>) => {
//   const existingOrder = await OrderModel.findById(orderId);
//   if (!existingOrder) {
//     throw new AppError(httpStatus.NOT_FOUND, "Order not found");
//   }

//   if(updatedData.status){
    
//     // send email to user about order status update 

//     const emailBody = `Hi ${existingOrder.userName}, Your Order status with Id ${existingOrder._id} is now ${updatedData.status}`

// // sent mail and show me where to change if needed

//   }


  

//   // Handle product quantity updates
//   if (updatedData.products) {
//     for (const updatedItem of updatedData.products) {
//       const existingItem = existingOrder.products.find(
//         (item) => item.productId.toString() === updatedItem.productId.toString()
//       );

//       if (existingItem) {
//         const product = await ProductModel.findById(existingItem.productId);
//         if (!product) {
//           throw new AppError(httpStatus.NOT_FOUND, "Associated product not found");
//         }

//         const quantityDiff = existingItem.quantity - updatedItem.quantity;
//         const newQuantity = product.quantity + quantityDiff;

//         if (newQuantity < 0) {
//           throw new AppError(httpStatus.BAD_REQUEST, "Insufficient stock to update order");
//         }
//       }
//     }
//   }

//   return await OrderModel.findByIdAndUpdate(orderId, updatedData, { new: true }).populate(
//     "products.productId"
//   );
// };

const deleteOrderFromDB = async (orderId: string) => {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }
  return await OrderModel.findByIdAndDelete(orderId);
};

const getOrdersByEmail = async (email: string) => {
  const orders = await OrderModel.find({ userEmail: email })
    .sort({ createdAt: -1 })
    .populate('products.productId'); // Assuming `products.productId` is the field referencing the Product model

  return orders;
};


const verifyPrescriptionService = async (orderId: string) => {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (!order.prescriptionRequired) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Prescription verification not required for this order"
    );
  }

  order.prescriptionVarified = true;
  await order.save();

  return order;
};


export const OrderServices = {
  createOrderIntoDB,
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  updateOrderInDB,
  deleteOrderFromDB,
  getOrdersByEmail,
  verifyPrescriptionService
};
