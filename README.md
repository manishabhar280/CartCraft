# CartCraft

## Full-Stack E-Commerce Web Application

CartCraft is a full-stack e-commerce application for browsing products, managing a cart and wishlist, applying coupons, placing orders, and tracking order status. It includes JWT-protected customer workflows and an admin area for managing products, orders, users, and dashboard metrics.

## Key Features

- User registration and login
- JWT authentication
- Product browsing and product details
- Product search and category filtering
- Price, stock, and sorting filters
- Cart management with quantity updates
- Wishlist management
- Coupon and discount validation
- Checkout and order creation
- Order history and order details
- Order status tracking
- Admin dashboard and sales metrics
- Admin product management
- Admin order management and status updates
- Admin user management
- Responsive customer and admin UI
- Product reviews and ratings

## Customer Features

Customers can create an account, sign in, browse the catalog, search and filter products, view product details, manage a wishlist, add products to a cart, apply valid coupons, and place orders. Customers can review order history, inspect order details, follow order status, and submit reviews for eligible purchases.

## Admin Features

Administrators have access to a protected admin area with:

- Dashboard statistics for users, products, orders, revenue, and order statuses
- Product creation, editing, and deletion
- Order list management and order status updates
- User list management
- Protected admin-only routes using the `ADMIN` role

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT and bcrypt |
| API style | REST API |
| HTTP client | Axios |

## Project Structure

```text
CartCraft/
├── Backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── prisma.config.ts
├── Frontend/
│   ├── public/assets/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- A PostgreSQL database and a user with permission to run migrations

## Installation and Setup

1. Clone the repository and open the project directory.

2. Install backend dependencies:

   ```bash
   cd Backend
   npm install
   ```

3. Install frontend dependencies:

   ```bash
   cd ../Frontend
   npm install
   ```

4. Configure the backend environment using the placeholder template:

   ```bash
   cd ../Backend
   copy .env.example .env
   ```

   On macOS or Linux, use `cp .env.example .env` instead.

5. Configure the frontend environment if the API is not running at the default local URL:

   ```bash
   cd ../Frontend
   copy .env.example .env
   ```

   On macOS or Linux, use `cp .env.example .env` instead.

6. Replace only the placeholder values in the local `.env` files. Never commit these files.

## Environment Variables

### Backend

Configure `Backend/.env` with local values. The committed example contains placeholders only:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/cartcraft?schema=public
JWT_SECRET=replace-with-a-long-random-secret
```

- `PORT`: Backend HTTP port.
- `FRONTEND_URL`: Primary frontend origin used by CORS.
- `DATABASE_URL`: PostgreSQL connection string consumed by Prisma.
- `JWT_SECRET`: Long, private signing secret for JWTs.

### Frontend

`Frontend/.env.example` contains:

```env
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is optional because the frontend client defaults to `http://localhost:5000`.

## Prisma and Database Setup

From `Backend/`:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
```

For a local development database where migrations should be created interactively, use Prisma's development workflow instead of resetting the database. Do not use `prisma migrate reset` when preserving existing data matters.

To load the repository's sample catalog and coupon data:

```bash
npm run prisma:seed
```

The Prisma schema defines users, roles, products, reviews, carts, cart items, orders, order items, and coupons.

## How to Run

### Backend

From `Backend/`:

```bash
npm run dev
```

The API listens on `http://localhost:5000` by default. For a production-style start, use `npm start`.

### Frontend

From `Frontend/`:

```bash
npm run dev
```

Vite serves the frontend on its configured local development port, normally `http://localhost:5173`. The backend also allows the alternate local frontend origin `http://localhost:5174`.

To create a production bundle:

```bash
npm run build
```

## API Overview

The backend exposes these REST API groups:

- `/api/health`: Service health check.
- `/api/auth`: Customer registration and login.
- `/api/products`: Public product listing and product details, plus protected review operations and admin product operations.
- `/api/cart`: Authenticated cart retrieval, item creation, quantity updates, and item removal.
- `/api/coupons`: Authenticated coupon validation.
- `/api/orders`: Authenticated order creation, customer order history, and customer order details.
- `/api/admin`: Admin-only dashboard data, order management, product management, and user management.

Authenticated requests use a Bearer JWT in the `Authorization` header.

## Security

- JWT authentication protects customer-specific resources.
- Admin routes require both authentication and the `ADMIN` role.
- Passwords are hashed with bcrypt and are not returned in API responses.
- Secrets and database credentials are loaded from environment variables.
- `.env` files, dependencies, and frontend build output are excluded from Git commits.
- CORS is restricted to the configured frontend URL and the supported local development origins.
- Server-side validation is used for product, cart, coupon, and order inputs.

## Screenshots

Screenshots can be added here as the project evolves:

- `docs/screenshots/home.png`
- `docs/screenshots/products.png`
- `docs/screenshots/product-details.png`
- `docs/screenshots/cart.png`
- `docs/screenshots/orders.png`
- `docs/screenshots/admin-dashboard.png`

## Future Improvements

- Add automated backend and frontend test coverage.
- Add image upload and hosted media storage for admin products.
- Add pagination for larger product, order, and user datasets.
- Add transactional email notifications for registration and order updates.
- Add production deployment documentation and CI checks.

## Author

**Manisha Bhardwaj**  
B.Tech CSE Student
