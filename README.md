# Wallet Service API 💳

## Overview
This project is a robust and secure Wallet Service API built with **TypeScript**, **NestJS**, and **Prisma ORM**. It provides core functionalities for user authentication via Google OAuth, secure wallet management, API key generation, and seamless integration with the Paystack payment gateway for deposits.

## Features
*   ✨ **Google OAuth Authentication**: Secure user registration and login using Google.
*   🔐 **JWT-based Authorization**: Protects API endpoints with JSON Web Tokens.
*   🔑 **API Key Management**: Create and manage API keys with granular permissions and expiration for programmatic access.
*   💰 **Wallet Operations**:
    *   **Deposits**: Initiate and process wallet top-ups via Paystack.
    *   **Transfers**: Securely send funds between user wallets with atomic transactions.
    *   **Balance Inquiry**: Retrieve current wallet balance.
    *   **Transaction History**: View detailed transaction records.
*   🔄 **Optimistic Concurrency Control**: Wallet balance updates are designed with concurrency in mind using atomic operations.
*   🔗 **Prisma ORM**: Type-safe database interactions with PostgreSQL.
*   🌐 **Paystack Integration**: Handles payment gateway interactions for deposits and webhook processing.
*   🛡️ **Global Exception Handling**: Centralized error management for consistent API responses.
*   🚀 **Performance**: Built on Node.js and NestJS for scalable and efficient operations.

## Getting Started
Follow these steps to set up and run the Wallet Service API locally.

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Oluwatise-Ajayi/WalletService.git
    cd WalletService
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Set up Environment Variables**:
    Create a `.env` file in the root directory by copying the `.env.example` file:
    ```bash
    cp .env.example .env
    ```
    Populate the `.env` file with the required variables as described in the `Environment Variables` section.

4.  **Run Database Migrations**:
    Ensure your PostgreSQL database is running and accessible via the `DATABASE_URL`. Then apply Prisma migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
    This will create the necessary tables in your database.

5.  **Start the Application**:
    To run in development mode with hot-reloading:
    ```bash
    npm run start:dev
    ```
    To start the application in production mode:
    ```bash
    npm run start:prod
    ```

### Environment Variables
All required environment variables must be defined in your `.env` file.

*   `DATABASE_URL`: Connection string for your PostgreSQL database.
    *   Example: `postgresql://postgres:password@localhost:5432/wallet_db`
*   `JWT_SECRET`: A strong secret key used for signing and verifying JWTs.
    *   Example: `super-secret-jwt-key-replace-with-something-complex`
*   `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
    *   Example: `your-google-client-id.apps.googleusercontent.com`
*   `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.
    *   Example: `your-google-client-secret-xxxx`
*   `PAYSTACK_SECRET_KEY`: Your Paystack secret key (e.g., `sk_test_...`).
    *   Example: `sk_test_xxxx`
*   `PAYSTACK_PUBLIC_KEY`: Your Paystack public key (e.g., `pk_test_...`).
    *   Example: `pk_test_xxxx`
*   `WEBHOOK_SECRET`: A secret key for validating incoming webhooks (e.g., from Paystack).
    *   Example: `secret-for-webhook-validation`
*   `PORT`: The port number on which the API server will listen.
    *   Example: `3000`

## API Documentation

### Base URL
All API requests should be prefixed with the base URL:
`http://localhost:3000` (or the port configured in your `.env`)

### Endpoints

#### GET /auth/google
Initiates the Google OAuth authentication flow. Redirects to Google's authentication page.

**Request**:
N/A (Browser redirect)

**Response**:
N/A (Browser redirect to Google for authentication)

**Errors**:
- 500 Internal Server Error: Configuration issues with Google OAuth.

#### GET /auth/google/callback
Handles the callback from Google after successful authentication. Trades Google's authorization code for user details and generates a JWT.

**Request**:
N/A (Callback from Google)

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clsj01w4y0000w25n69f2csq2",
    "email": "john.doe@example.com",
    "googleId": "100000000000000000000",
    "firstName": "John",
    "lastName": "Doe",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "createdAt": "2024-07-30T10:00:00.000Z",
    "updatedAt": "2024-07-30T10:00:00.000Z"
  }
}
```

**Errors**:
- 401 Unauthorized: Google authentication failed.
- 500 Internal Server Error: Database or service error during user creation/login.

#### POST /keys/create
**Authentication**: JWT Required
Creates a new API key for the authenticated user. Maximum 5 active keys per user.

**Request**:
```json
{
  "name": "My First API Key",
  "permissions": ["wallet:read", "wallet:write", "keys:read"],
  "expiry": "1M"
}
```
*   `name` (string, required): A descriptive name for the API key.
*   `permissions` (string[], required): A list of permissions for the API key (e.g., `["wallet:read", "wallet:write"]`).
*   `expiry` (string, required): The duration until the key expires. Supports 'H' (hours), 'D' (days), 'M' (months), 'Y' (years).
    *   Examples: `"12H"`, `"30D"`, `"6M"`, `"1Y"`.

**Response**:
```json
{
  "data": {
    "api_key": "sk_live_generatedhexstring",
    "expires_at": "2024-08-30T10:00:00.000Z"
  },
  "statusCode": 201,
  "message": "Success"
}
```
*   `api_key`: The newly generated secret API key. **This key is only shown once.**
*   `expires_at`: Timestamp when the API key will expire.

**Errors**:
- 400 Bad Request: Invalid duration format for `expiry`, maximum 5 active keys reached, or invalid duration unit.
- 401 Unauthorized: Invalid or missing JWT.

#### POST /keys/rollover
**Authentication**: JWT Required
Creates a new API key to replace an expired one. The old key must be genuinely expired or revoked.

**Request**:
```json
{
  "expired_key_id": "clsj01w4y0000w25n69f2csq2",
  "expiry": "1Y"
}
```
*   `expired_key_id` (string, required): The ID of the API key to be rolled over.
*   `expiry` (string, required): The duration until the new key expires. Supports 'H' (hours), 'D' (days), 'M' (months), 'Y' (years).

**Response**:
```json
{
  "data": {
    "api_key": "sk_live_newgeneratedhexstring",
    "expires_at": "2025-07-30T10:00:00.000Z"
  },
  "statusCode": 201,
  "message": "Success"
}
```
*   `api_key`: The newly generated secret API key.
*   `expires_at`: Timestamp when the new API key will expire.

**Errors**:
- 400 Bad Request: Key is still active, invalid duration format for `expiry`, or invalid duration unit.
- 401 Unauthorized: Invalid or missing JWT.
- 404 Not Found: `expired_key_id` does not exist or does not belong to the user.

#### POST /wallet/deposit
**Authentication**: JWT Required
Initiates a deposit process into the authenticated user's wallet via Paystack. Returns Paystack's initialization data.

**Request**:
```json
{
  "amount": 5000.00
}
```
*   `amount` (number, required): The amount to deposit (in major currency units, e.g., NGN).

**Response**:
```json
{
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "xyz123",
    "reference": "your-paystack-reference",
    "status": "success",
    "message": "Authorization URL created"
  },
  "statusCode": 201,
  "message": "Success"
}
```
*   Contains Paystack-specific fields required to complete the payment on the client side.

**Errors**:
- 400 Bad Request: Amount must be positive.
- 401 Unauthorized: Invalid or missing JWT.
- 404 Not Found: Wallet not found for the user.
- 500 Internal Server Error: Issues communicating with Paystack or creating pending transaction.

#### POST /wallet/paystack/webhook
Receives and processes webhook notifications from Paystack to confirm deposit success.

**Headers**:
*   `x-paystack-signature` (string, required): Signature provided by Paystack for webhook authenticity verification.

**Request**:
```json
{
  "event": "charge.success",
  "data": {
    "reference": "your-paystack-reference",
    "status": "success",
    "amount": 500000,
    "currency": "NGN",
    "customer": { "email": "john.doe@example.com" },
    "metadata": { "walletId": "clsj01w4y0000w25n69f2csq2", "type": "DEPOSIT" },
    "paid_at": "2024-07-30T10:05:00.000Z",
    "...": "..."
  }
}
```
*   `payload` (object, required): The full JSON payload sent by Paystack.

**Response**:
`200 OK` (Empty body typically, or a simple acknowledgment message for Paystack).

**Errors**:
- 400 Bad Request: Missing `x-paystack-signature` header or invalid signature.
- 500 Internal Server Error: Error processing the webhook, e.g., database transaction failure.

#### POST /wallet/transfer
**Authentication**: JWT Required
Transfers a specified amount from the authenticated user's wallet to another user's wallet.

**Request**:
```json
{
  "wallet_number": "recipient-wallet-uuid",
  "amount": 1000.00
}
```
*   `wallet_number` (string, required): The unique ID of the recipient's wallet.
*   `amount` (number, required): The amount to transfer.

**Response**:
```json
{
  "data": {
    "status": "success"
  },
  "statusCode": 201,
  "message": "Success"
}
```

**Errors**:
- 400 Bad Request: Amount must be positive, insufficient balance in sender's wallet.
- 401 Unauthorized: Invalid or missing JWT.
- 404 Not Found: Sender wallet not found or recipient wallet not found.
- 500 Internal Server Error: Database transaction failure.

#### GET /wallet/balance
**Authentication**: JWT Required
Retrieves the current balance of the authenticated user's wallet.

**Request**:
N/A

**Response**:
```json
{
  "data": {
    "id": "clsj01w4y0000w25n69f2csq2",
    "userId": "clsgk3w5x0001w24d9e2t5b1u",
    "balance": "10000.50",
    "currency": "NGN",
    "version": 0,
    "createdAt": "2024-07-30T09:30:00.000Z",
    "updatedAt": "2024-07-30T10:15:00.000Z"
  },
  "statusCode": 200,
  "message": "Success"
}
```

**Errors**:
- 401 Unauthorized: Invalid or missing JWT.
- 404 Not Found: Wallet not found for the user.

#### GET /wallet/transactions
**Authentication**: JWT Required
Retrieves a list of the latest transactions for the authenticated user's wallet.

**Request**:
N/A

**Response**:
```json
{
  "data": [
    {
      "id": "clt2v5x9f0000y5a4b7c8d9e0",
      "walletId": "clsj01w4y0000w25n69f2csq2",
      "amount": "5000.00",
      "type": "DEPOSIT",
      "status": "SUCCESS",
      "reference": "paystack_ref_xyz",
      "metadata": {},
      "description": null,
      "createdAt": "2024-07-30T10:05:00.000Z",
      "updatedAt": "2024-07-30T10:05:00.000Z"
    },
    {
      "id": "clt2v5x9f0001y5a4b7c8d9e1",
      "walletId": "clsj01w4y0000w25n69f2csq2",
      "amount": "1000.00",
      "type": "TRANSFER_OUT",
      "status": "SUCCESS",
      "reference": "TRF-uuid-abc",
      "metadata": null,
      "description": "Transfer to recipient-wallet-uuid",
      "createdAt": "2024-07-30T10:10:00.000Z",
      "updatedAt": "2024-07-30T10:10:00.000Z"
    }
  ],
  "statusCode": 200,
  "message": "Success"
}
```
*   Defaults to returning the 20 most recent transactions.

**Errors**:
- 401 Unauthorized: Invalid or missing JWT.
- 404 Not Found: Wallet not found for the user.

## Technologies Used

| Technology    | Description                                                                                             |
| :------------ | :------------------------------------------------------------------------------------------------------ |
| **NestJS**    | A progressive Node.js framework for building efficient, reliable, and scalable server-side applications. |
| **TypeScript**| A typed superset of JavaScript that compiles to plain JavaScript.                                       |
| **Prisma**    | A next-generation ORM that makes database access easy with an intuitive data model.                     |
| **PostgreSQL**| A powerful, open-source object-relational database system.                                             |
| **Passport.js** | Flexible authentication middleware for Node.js (used for JWT and Google OAuth).                         |
| **Paystack API**| A leading payment gateway for online transactions.                                                      |
| **Joi**       | A powerful schema description language and data validator for JavaScript.                               |
| **Axios**     | A promise-based HTTP client for the browser and Node.js.                                               |
| **RxJS**      | A library for reactive programming using Observables, to make asynchronous tasks easier.                 |

## Contributing
We welcome contributions to enhance this project! To contribute, please follow these steps:

1.  🌿 **Fork the Repository**: Start by forking the `WalletService` repository to your GitHub account.
2.  🌳 **Create a New Branch**: Create a dedicated branch for your feature or bug fix.
    ```bash
    git checkout -b feature/your-feature-name
    ```
    or
    ```bash
    git checkout -b bugfix/issue-description
    ```
3.  ✏️ **Make Your Changes**: Implement your features or fixes, ensuring they adhere to the project's coding standards.
4.  🧪 **Write Tests**: Add or update tests to cover your changes and ensure functionality.
5.  ✅ **Ensure Linting and Formatting**: Run `npm run lint` and `npm run format` to ensure your code matches the project's style.
6.  🚀 **Commit Your Changes**: Write clear and concise commit messages.
    ```bash
    git commit -m "feat: Add new feature"
    ```
7.  ⬆️ **Push to Your Fork**: Push your branch to your forked repository.
    ```bash
    git push origin feature/your-feature-name
    ```
8.  🤝 **Open a Pull Request**: Submit a pull request to the `main` branch of the original repository. Provide a detailed description of your changes.

## Author Info
**[Your Name]**
*   [LinkedIn](https://linkedin.com/in/your_username)
*   [Twitter](https://twitter.com/your_username)
*   [Portfolio/Website](https://yourwebsite.com)

---
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Paystack](https://img.shields.io/badge/Paystack-198754?style=flat-square&logo=paystack&logoColor=white)](https://paystack.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)