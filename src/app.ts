
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ProductRoutes } from "./app/modules/product/product.route";
import { OrderRoutes } from "./app/modules/order/order.route";
import { RootRoute } from "./app/modules/root.route";
import { UserRoutes } from "./app/modules/User/user.route";
import globalErrorHandler from "./app/middlewares/globalErrorhandler";
import { AuthRoutes } from "./app/modules/Auth/auth.route";
import { ReviewRoutes } from "./app/modules/reviews/review.route";

const app: Application = express();

// Parser
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://fine-med-client.vercel.app","http://localhost:3000","http://localhost:3001","https://finemed.sajibofficial.me"],
    credentials: true,
  })
);
app.use(cookieParser());

// Rate limiter for /send-mail
const mailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests, please try again later." },
});

// Validate environment variables
const requiredEnvVars = ["EMAIL_USER", "EMAIL_PASS"];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Error: Environment variable ${varName} is not set.`);
    process.exit(1);
  }
});

// Application routes
app.use("/api/products", ProductRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/reviews", ReviewRoutes);
app.use("/", RootRoute);

// Send mail route
app.post(
  "/send-mail",
  mailLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email } = req.body;

      // Input validation
      if (!name || !name.trim()) {
        res.status(400).json({ error: "Name is required" });
        return;
      }
      if (!email || !email.trim()) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // Sanitize inputs
      const sanitizedName = name.trim();
      const sanitizedEmail = email.trim();

      // Create transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Email options
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: sanitizedEmail,
        subject: "Newsletter Subscription",
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h1 style="color: #0d9488;">Hello ${sanitizedName},</h1>
            <p>Thank you for subscribing to our FineMed newsletter!</p>
            <p style="font-size: 16px; color: #555;">
              We're excited to have you on board. Stay tuned for the latest health tips, promotions, and updates.
            </p>
            <p style="font-size: 14px;">Best Regards,</p>
            <p style="color: #0d9488;"><b>FineMed Team</b></p>
          </div>
        `,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      next(error);
    }
  }
);

// Global error handler
app.use(globalErrorHandler);

export default app;
