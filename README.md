🚀 FineMed Server
=================

The **FineMed Server** powers the **FineMed-Client** telemedicine and e-commerce platform. Built using **Node.js**, **Express**, and **TypeScript**, it offers **type-safe**, **scalable**, and **secure APIs** for managing medicines, users, orders, and reviews.

* * * * *
LIVE Frontend:  https://finemed.sajibofficial.me

LIVE Backend(THIS):  https://finemedapi.sajibofficial.me

🧱 Tech Stack
-------------

⚙️ **Node.js & Express** --- API framework\
🔐 **TypeScript** --- Type-safe development\
🗄️ **MongoDB + Mongoose** --- NoSQL database & ORM\
🔑 **JWT & bcrypt** --- Authentication & password encryption\
📧 **Nodemailer** --- Email notifications\
💳 **SSLCommerz** --- Secure payment gateway\
🛡️ **Zod** --- Input validation\
🧹 **ESLint & Prettier** --- Code quality & formatting

* * * * *

🔐 Authentication & User Roles
------------------------------

All routes are protected using **JWT Authentication** (`Authorization: Bearer <token>`)

### 👤 Roles

🛡️ **Admin** --- Full control over platform (users, medicines, orders, reviews)\
🛒 **Customer** --- Can browse, order medicines, and submit reviews

* * * * *

🧾 API Overview
---------------

### 📝 User Registration & Login

➕ `POST /auth/register` --- Register a new user\
→ Fields: `name`, `email`, `password`, `phone`, `address`

🔑 `POST /auth/login` --- Login and receive JWT tokens\
🔁 `POST /auth/refresh-token` --- Refresh access token

🔒 Passwords encrypted via **bcrypt**\
🔐 Session managed using **JWT**

* * * * *

### 👥 User Management

📋 `GET /users` --- Admin fetches all users\
✏️ **CRUD (Admin Only)** --- Update/delete user data (assumed backend support)

💡 *Use Case*: Monitor user base, track orders, and manage user access.

* * * * *

### 💊 Medicine Management

📦 `GET /medicines` --- Get list of medicines\
➕ `POST /medicines` --- Add new medicine (**Admin**)\
🔄 `PATCH /medicines/:id` --- Update medicine details (**Admin**)\
❌ `DELETE /medicines/:id` --- Remove medicine (**Admin**)

💡 *Use Case*: Inventory management for e-commerce.

* * * * *

### 📦 Order Management

📋 `GET /orders` --- Admin gets all orders\
🔄 `PATCH /orders/:id` --- Update order status (`pending`, `processing`, `shipped`, `delivered`)

➡️ Fields: `userEmail`, `contactNumber`, `products`, `prescriptionImageLink`, `status`

💡 *Use Case*: Fulfill orders and verify prescription uploads.

* * * * *

### 🌟 Review Management

📋 `GET /reviews` --- Admin fetches all reviews\
❌ `DELETE /reviews/:id` --- Remove specific review

➡️ Fields: `userEmail`, `userName`, `reviewText`, `starCount`, `orderCount`

💡 *Use Case*: Maintain platform trust by moderating reviews.

* * * * *

🌟 Special Features
-------------------

🔐 **Role-Based Operations** --- Separate flows for admin and customers\
✉️ **Email Notifications** --- Order updates via Nodemailer\
🔒 **Password Encryption** --- Secured with bcrypt\
🧾 **Prescription Verification** --- Admins review uploaded prescriptions\
💳 **Payment Gateway** --- Integrated with SSLCommerz\
🧪 **Input Validation** --- Robust checks using Zod

* * * * *

🛠️ Setup & Running the Server
------------------------------

### ✅ Prerequisites

Make sure you have these installed:

-   **Node.js** (v18 or higher)

-   **MongoDB** (local or MongoDB Atlas)

-   **npm** or **yarn**

* * * * *

### 📦 Installation Steps

#### 1️⃣ Clone the Repository

bash

CopyEdit

`git clone https://github.com/your-username/finemed-server.git
cd finemed-server`

#### 2️⃣ Install Dependencies

bash

CopyEdit

`npm install
# or
yarn install`

#### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory and add the following:

ini

CopyEdit

`PORT=5000
DATABASE_URL=your_mongodb_uri
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_token_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
SSL_STORE_ID=your_sslcommerz_store_id
SSL_STORE_PASSWORD=your_sslcommerz_store_password`

* * * * *

### 🚧 Run the Server

#### 🧪 Development Mode

npm run start:dev
# or

#### 🚀 Production Build


`npm run build
npm start`

* * * * *

✅ The server will be available at: `http://localhost:5000` (or the port specified in your `.env`)