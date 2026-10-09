# TechStore — Modern E-Commerce Web Application

A full-stack e-commerce web platform designed for developer gear and modern workspace hardware. Built with a Node.js/Express REST API, Microsoft SQL Server (MSSQL), and a clean, responsive vanilla JavaScript frontend architecture with JWT-based authentication.

---

## Key Features

- **Direct-Response Copy & Modern UI**: High-conversion landing page featuring problem/solution framing, interactive FAQ accordions, and social proof elements.
- **Dedicated Product Catalog**: Multi-category hardware filtering (All, Keyboards, Audio, Accessories) and real-time product search.
- **Product Details View**: Dynamic, detailed single-product view with pricing, description, and live inventory status.
- **Secure Authentication System**:
  - User registration and login using JWT (JSON Web Tokens) with password hashing.
  - Multi-day session persistence via browser local storage.
  - Automatic token expiration handling and route protection.
- **Purchase Protection**: Enforces authentication before checkout or adding items to the hardware bag.
- **Slide-Out Hardware Bag (Cart)**: Live subtotal calculation, quantity stepper, and local storage state persistence.
- **Deployment & Order History**: User profile dashboard tracking past purchases, order status, item breakdowns, and purchase dates directly from the database.

---

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+), FontAwesome Icons
- **Backend**: Node.js, Express.js
- **Database**: Microsoft SQL Server Express (mssql)
- **Authentication**: JSON Web Tokens (jsonwebtoken), bcryptjs
- **Environment Management**: dotenv, cors

---

## Project Structure

ecommerce-app/
├── public/
│   ├── index.html        # Clean HTML structure & views
│   ├── style.css         # Styling, variables & responsive rules
│   └── app.js            # Frontend logic, state & API calls
├── .env                  # Environment configuration & DB secrets
├── .gitignore            # Git exclusion rules
├── package.json          # Project dependencies & scripts
├── server.js             # Express REST API & SQL connection
└── README.md             # Project documentation

---

## Setup & Installation

### Prerequisites

- Node.js (v16.x or higher)
- Microsoft SQL Server Express with TCP/IP enabled on port 1433

### 1. Clone the Repository

git clone https://github.com/YOUR_USERNAME/CodeAlpha_EcommerceApp.git
cd CodeAlpha_EcommerceApp
npm install

### 2. Environment Configuration

Create a .env file in the root directory:

PORT=3000
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_NAME=EcommerceDB
DB_PORT=1433
JWT_SECRET=your_jwt_secret_key

### 3. Database Setup

Ensure your local MS SQL Server has the EcommerceDB database configured with the required schema (Users, Products, Orders, and OrderItems).

### 4. Run the Application

Start the Express development server:

node server.js

Wait until the console confirms the database connection, then open your browser at:
http://localhost:3000

---

## API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| GET | /api/products | Fetch all products | No |
| GET | /api/products/:id | Fetch product details by ID | No |
| POST | /api/register | Register a new user | No |
| POST | /api/login | Authenticate user and issue JWT | No |
| POST | /api/orders | Place a new checkout order | Yes (Bearer Token) |
| GET | /api/user/orders | Retrieve authenticated user's order history | Yes (Bearer Token) |

---

## License

This project was developed for the CodeAlpha Web Development Internship.