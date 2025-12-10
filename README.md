# Robust Wallet Service API 💰

## Overview
This project is a high-performance, secure digital wallet service built with **NestJS** and **TypeScript**, leveraging **Prisma ORM** for efficient data management with **PostgreSQL**. It offers core wallet functionalities, comprehensive API key management, and integration with external payment gateways.

## Features
- **Authentication**: Supports secure user authentication via Google OAuth and JWT tokens.
- **API Key Management**: Enables users to generate, manage, and revoke API keys with granular permissions and expiration policies.
- **Wallet Operations**: Provides core functionalities for managing user wallets, including deposits, transfers, balance inquiries, and transaction history.
- **Payment Gateway Integration**: Seamlessly integrates with Paystack for handling deposits and processing webhooks to update transaction statuses.
- **Transactional Integrity**: Ensures atomicity and data consistency for critical operations like transfers using database transactions.
- **Optimistic Locking**: Utilizes versioning for wallet balances to prevent race conditions during concurrent updates.
- **Health Monitoring**: Includes a dedicated endpoint for checking the application's operational status.
- **Comprehensive Logging**: Implements structured logging for better debugging and operational insights.

## Getting Started

### Installation
To get this project up and running on your local machine, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Oluwatise-Ajayi/WalletService.git
    cd WalletService
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Prepare Database**:
    Make sure you have a PostgreSQL database running and accessible. Update the `DATABASE_URL` in your `.env` file.
    Then, apply database migrations and seed initial data:
    ```bash
    npx prisma migrate dev --name init # Or npx prisma migrate deploy in production
    npx prisma db seed
    ```
    _Note: The seed script creates a test user (`test_user@example.com`) and an initial API key (`sk_live_test_key_12345`)._

### Environment Variables
Create a `.env` file in the root directory of the project and populate it with the following variables. Refer to `.env.example` for reference.

```ini
DATABASE_URL="postgresql://user:password@localhost:5432/wallet_db"
JWT_SECRET="your-super-secret-jwt-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback" # Update if deployed
PAYSTACK_SECRET_KEY="sk_test_xxxx" # Your Paystack secret key
PAYSTACK_PUBLIC_KEY="pk_test_xxxx" # Your Paystack public key
WEBHOOK_SECRET="secret" # Secret for validating webhooks (if different from Paystack secret)
PORT=3000 # Port for the API to listen on
```

## Usage

### Running the Application
To start the application in development mode:

```bash
npm run start:dev
```
The API will be available at `http://localhost:3000` (or your specified `PORT`).

### Accessing API Documentation (Swagger)
Once the application is running, you can access the interactive API documentation (Swagger UI) at:
`http://localhost:3000/docs`

This interface allows you to explore all available endpoints, understand request/response schemas, and even test them directly.

### Testing with `verify-api.js`
A simple verification script `verify-api.js` is provided to demonstrate basic API functionality, especially with API keys. Ensure the API is running and the seeded API key `sk_live_test_key_12345` is active for the test user (`test_user@example.com`).

1.  **Open `verify-api.js`**: Review the API key and base URL.
2.  **Run the script**:
    ```bash
    node verify-api.js
    ```
    This script will attempt to:
    - Get wallet balance for the test user.
    - Initiate a deposit.
    - Check the status of the initiated deposit.

### Authentication Methods
This API supports two primary authentication methods:

1.  **JWT Bearer Token**: Used for standard user sessions, obtained after Google OAuth login. Pass in the `Authorization` header as `Bearer <token>`.
2.  **API Key**: Used for programmatic access, generated through the `/keys/create` endpoint. Pass in the `x-api-key` header.

Certain endpoints require specific permissions which are checked via the `PermissionsGuard`.

## API Documentation

### Base URL
`http://localhost:3000/api/v1` (The actual base path is usually derived from the controller path, e.g., `/auth`, `/wallet`. The Vercel rewrite `/(.*)` to `/api/index` suggests `/api` is the root on deployment, but locally it defaults to direct controller routes.) For local development, assume direct controller paths like `/auth` or `/wallet`. For deployed versions, it might be `/api/auth` or `/api/wallet`.

### Endpoints

#### GET /
**Overview**: Provides a simple welcome message to verify API availability.
**Request**: None
**Response**:
```json
{
  "data": "Hello World!",
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `500 Internal Server Error`: An unexpected server error occurred.

#### GET /auth/google
**Overview**: Initiates the Google OAuth login flow. Users will be redirected to Google for authentication.
**Request**: None
**Response**: Redirects to Google authentication page.
**Errors**:
- `500 Internal Server Error`: Google OAuth misconfiguration or connection issues.

#### GET /auth/google/callback
**Overview**: Callback URL for Google OAuth. After successful Google authentication, Google redirects back to this endpoint. It validates the user, creates an account and wallet if new, then generates a JWT token.
**Request**: None (handled by Google OAuth redirect)
**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-of-user",
    "email": "user@example.com",
    "googleId": "google-id",
    "firstName": "John",
    "lastName": "Doe",
    "picture": "https://lh3.googleusercontent.com/a/...",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  }
}
```
**Errors**:
- `401 Unauthorized`: Google authentication failed or user validation issue.
- `500 Internal Server Error`: Database error or JWT generation failure.

#### GET /health
**Overview**: Checks the health and operational status of the application.
**Request**: None
**Response**:
```json
{
  "data": {
    "status": "ok",
    "timestamp": "2023-10-27T10:00:00.000Z"
  },
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `500 Internal Server Error`: Application is unhealthy or crashed.

#### GET /keys
**Overview**: Retrieves a list of all API keys associated with the authenticated user.
**Authentication**: JWT or API Key (with `read` permission).
**Request**: None
**Response**:
```json
{
  "data": [
    {
      "id": "uuid-of-key-1",
      "name": "My Prod Key",
      "prefix": "sk_live_abcd",
      "maskedKey": "sk_live_abcd...efgh",
      "permissions": ["deposit", "read"],
      "isRevoked": false,
      "expiresAt": "2024-10-27T10:00:00.000Z",
      "createdAt": "2023-10-27T10:00:00.000Z"
    },
    {
      "id": "uuid-of-key-2",
      "name": "Dev Key",
      "prefix": "sk_live_1234",
      "maskedKey": "sk_live_1234...5678",
      "permissions": ["*"],
      "isRevoked": true,
      "expiresAt": "2023-09-01T10:00:00.000Z",
      "createdAt": "2023-08-01T10:00:00.000Z"
    }
  ],
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks `read` permission.
- `500 Internal Server Error`: Database query failed.

#### GET /keys/:id
**Overview**: Retrieves details for a specific API key by its ID.
**Authentication**: JWT or API Key (with `read` permission).
**Request**:
- `id`: (Path Parameter) The UUID of the API key to retrieve.
**Response**:
```json
{
  "data": {
    "id": "uuid-of-key",
    "name": "My Prod Key",
    "prefix": "sk_live_abcd",
    "maskedKey": "sk_live_abcd...efgh",
    "permissions": ["deposit", "read"],
    "isRevoked": false,
    "expiresAt": "2024-10-27T10:00:00.000Z",
    "createdAt": "2023-10-27T10:00:00.000Z"
  },
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks `read` permission.
- `404 Not Found`: API Key with the given ID was not found for the user.
- `500 Internal Server Error`: Database query failed.

#### POST /keys/create
**Overview**: Creates a new API key with specified name, permissions, and expiry.
**Authentication**: JWT or API Key (with `read` or `*` permission for self-management).
**Request**:
```json
{
  "name": "My Checkout Service Key",
  "permissions": ["deposit", "read"],
  "expiry": "3M"
}
```
**Response**:
```json
{
  "data": {
    "api_key": "sk_live_32characterhexstring",
    "expires_at": "2024-01-27T10:00:00.000Z",
    "permissions": ["deposit", "read"]
  },
  "statusCode": 201,
  "message": "Success"
}
```
**Errors**:
- `400 Bad Request`: Invalid `name`, `permissions`, or `expiry` format. (e.g., `expiry` not in `1H, 1D, 1M, 1Y` format).
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: User already has 5 active API keys (limit reached).
- `500 Internal Server Error`: Database or cryptographic key generation error.

#### POST /keys/rollover
**Overview**: Rolls over an expired or compromised API key, creating a new one with the same permissions and a new expiry, while revoking the old key.
**Authentication**: JWT or API Key (with `read` or `*` permission).
**Request**:
```json
{
  "expired_key_id": "uuid-of-the-key-to-rollover",
  "expiry": "6M"
}
```
**Response**:
```json
{
  "data": {
    "api_key": "sk_live_newlygeneratedkey",
    "expires_at": "2024-04-27T10:00:00.000Z",
    "permissions": ["deposit", "read"]
  },
  "statusCode": 201,
  "message": "Success"
}
```
**Errors**:
- `400 Bad Request`: Invalid `expiry` format.
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: User already has 5 active API keys (limit reached).
- `404 Not Found`: The `expired_key_id` does not exist or does not belong to the user.
- `500 Internal Server Error`: Database or key generation error.

#### POST /keys/revoke/:id
**Overview**: Revokes an active API key, making it unusable.
**Authentication**: JWT or API Key (with `read` or `*` permission).
**Request**:
- `id`: (Path Parameter) The UUID of the API key to revoke.
**Response**:
```json
{
  "data": {
    "id": "uuid-of-revoked-key",
    "name": "My Checkout Service Key",
    "prefix": "sk_live_abcd",
    "maskedKey": "sk_live_abcd...efgh",
    "permissions": ["deposit", "read"],
    "isRevoked": true,
    "expiresAt": "2024-01-27T10:00:00.000Z",
    "createdAt": "2023-10-27T10:00:00.000Z"
  },
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks required permission for revocation.
- `404 Not Found`: API Key with the given ID was not found for the user.
- `500 Internal Server Error`: Database update failed.

#### POST /wallet/deposit
**Overview**: Initiates a deposit into the user's wallet via Paystack. Returns details for completing the payment.
**Authentication**: JWT or API Key (with `deposit` permission).
**Request**:
```json
{
  "amount": 1000
}
```
**Response**:
```json
{
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "your_paystack_transaction_reference"
  },
  "statusCode": 201,
  "message": "Success"
}
```
**Errors**:
- `400 Bad Request`: Invalid `amount` (must be positive), or Paystack initialization failed.
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks `deposit` permission.
- `404 Not Found`: User's wallet or user not found.
- `500 Internal Server Error`: Internal Paystack configuration error.

#### POST /wallet/paystack/webhook
**Overview**: Endpoint for Paystack to send webhook notifications regarding transaction status updates. This endpoint is used internally by Paystack.
**Authentication**: Paystack `x-paystack-signature` header validation.
**Request**: Paystack webhook payload (example `charge.success` event)
```json
{
  "event": "charge.success",
  "data": {
    "id": 123456,
    "domain": "test",
    "status": "success",
    "reference": "your_paystack_transaction_reference",
    "amount": 100000,
    "currency": "NGN",
    "metadata": {
      "walletId": "uuid-of-wallet",
      "type": "DEPOSIT"
    },
    "...": "..."
  }
}
```
**Response**:
- `200 OK`: Webhook processed successfully.
**Errors**:
- `400 Bad Request`: Missing or invalid `x-paystack-signature` header.
- `500 Internal Server Error`: Transaction update or wallet balance increment failed.

#### GET /wallet/deposit/:reference/status
**Overview**: Retrieves the current status of a deposit transaction using its Paystack reference.
**Authentication**: None (can be made public for easy status checks post-payment).
**Request**:
- `reference`: (Path Parameter) The Paystack reference of the deposit transaction.
**Response**:
```json
{
  "data": {
    "reference": "your_paystack_transaction_reference",
    "status": "PENDING"
  },
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `404 Not Found`: Transaction with the given reference not found.
- `500 Internal Server Error`: Database query failed.

#### GET /wallet/recipient
**Overview**: Looks up a recipient's wallet information by email for transfer purposes.
**Authentication**: JWT or API Key (with `read` or `transfer` permission).
**Request**:
- `email`: (Query Parameter) The email of the recipient user.
**Response**:
```json
{
  "data": {
    "valid": true,
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "walletId": "uuid-of-recipient-wallet"
  },
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks `read` or `transfer` permission.
- `404 Not Found`: Recipient not found or has no associated wallet.
- `500 Internal Server Error`: Database query failed.

#### POST /wallet/transfer
**Overview**: Transfers funds from the authenticated user's wallet to another user's wallet. The recipient can be identified by their wallet ID or email.
**Authentication**: JWT or API Key (with `transfer` permission).
**Request**:
```json
{
  "email": "recipient@example.com",
  "amount": 500
}
```
OR
```json
{
  "wallet_number": "uuid-of-recipient-wallet",
  "amount": 500
}
```
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
- `400 Bad Request`: Invalid `amount` (must be positive), insufficient balance, or recipient identification missing. Cannot transfer to yourself.
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks `transfer` permission.
- `404 Not Found`: Sender or recipient wallet not found.
- `500 Internal Server Error`: Database transaction failed.

#### GET /wallet/balance
**Overview**: Retrieves the current balance of the authenticated user's wallet.
**Authentication**: JWT or API Key (with `read` permission).
**Request**: None
**Response**:
```json
{
  "data": {
    "id": "uuid-of-wallet",
    "userId": "uuid-of-user",
    "balance": "1234.56",
    "currency": "NGN",
    "version": 5,
    "createdAt": "2023-10-27T09:00:00.000Z",
    "updatedAt": "2023-10-27T10:30:00.000Z"
  },
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks `read` permission.
- `404 Not Found`: Wallet not found for the user.
- `500 Internal Server Error`: Database query failed.

#### GET /wallet/transactions
**Overview**: Retrieves the transaction history for the authenticated user's wallet, showing the 20 most recent transactions.
**Authentication**: JWT or API Key (with `read` permission).
**Request**: None
**Response**:
```json
{
  "data": [
    {
      "id": "uuid-of-transaction-1",
      "walletId": "uuid-of-wallet",
      "amount": "500.00",
      "type": "TRANSFER_OUT",
      "status": "SUCCESS",
      "reference": "TRF-uuid-...",
      "metadata": { /* ... */ },
      "description": "Transfer to uuid-of-recipient-wallet",
      "createdAt": "2023-10-27T10:30:00.000Z",
      "updatedAt": "2023-10-27T10:30:00.000Z",
      "relatedUser": {
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@example.com"
      }
    },
    {
      "id": "uuid-of-transaction-2",
      "walletId": "uuid-of-wallet",
      "amount": "1000.00",
      "type": "DEPOSIT",
      "status": "SUCCESS",
      "reference": "paystack_ref_...",
      "metadata": { /* ... */ },
      "description": null,
      "createdAt": "2023-10-27T10:15:00.000Z",
      "updatedAt": "2023-10-27T10:16:00.000Z",
      "relatedUser": null
    }
  ],
  "statusCode": 200,
  "message": "Success"
}
```
**Errors**:
- `401 Unauthorized`: Invalid or missing authentication token/API key.
- `403 Forbidden`: API Key lacks `read` permission.
- `404 Not Found`: Wallet not found for the user.
- `500 Internal Server Error`: Database query failed.

## Technologies Used

| Technology       | Description                                              | Link                                                                        |
| :--------------- | :------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **NestJS**       | A progressive Node.js framework for building efficient, reliable, and scalable server-side applications. | [https://nestjs.com/](https://nestjs.com/)                                  |
| **TypeScript**   | A strongly typed superset of JavaScript that compiles to plain JavaScript. | [https://www.typescriptlang.org/](https://www.typescriptlang.org/)          |
| **Prisma ORM**   | Next-generation ORM for Node.js and TypeScript, making database access easy and type-safe. | [https://www.prisma.io/](https://www.prisma.io/)                            |
| **PostgreSQL**   | A powerful, open-source object-relational database system. | [https://www.postgresql.org/](https://www.postgresql.org/)                  |
| **Passport.js**  | Simple, unobtrusive authentication for Node.js. Used here for JWT and Google OAuth. | [http://www.passportjs.org/](http://www.passportjs.org/)                    |
| **JWT**          | JSON Web Tokens for secure authentication and authorization. | [https://jwt.io/](https://jwt.io/)                                           |
| **Google OAuth20** | For user login and registration via Google accounts.     | [https://developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2) |
| **Paystack API** | Payment gateway integration for handling online payments. | [https://paystack.com/developers](https://paystack.com/developers)          |
| **Bcrypt**       | Library for hashing passwords and API keys securely.     | [https://www.npmjs.com/package/bcrypt](https://www.npmjs.com/package/bcrypt) |
| **Joi**          | Powerful schema description language and data validator. | [https://joi.dev/](https://joi.dev/)                                         |
| **Swagger**      | API documentation and visualization tool.                | [https://swagger.io/](https://swagger.io/)                                  |
| **Axios**        | Promise-based HTTP client for the browser and Node.js.   | [https://axios-http.com/](https://axios-http.com/)                          |

## Contributing
We welcome contributions to enhance this wallet service! To contribute:

-   ✨ **Fork the repository**.
-   🌿 **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name`.
-   🛠️ **Make your changes** and ensure they adhere to the project's coding standards.
-   🧪 **Write and run tests** to cover your changes.
-   💬 **Commit your changes** with clear and descriptive commit messages.
-   🚀 **Push your branch** to your forked repository.
-   📬 **Open a Pull Request** to the `main` branch of this repository, describing your changes and their benefits.

## License
This project is licensed under the MIT License - see the `LICENSE` file for details (if present).

## Author Info
- **Oluwatise Ajayi**
  - LinkedIn: [Your LinkedIn Profile](https://www.linkedin.com/in/yourusername/)
  - Twitter: [@yourtwitterhandle](https://twitter.com/yourtwitterhandle)

---

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Oluwatise-Ajayi/WalletService/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)