# Mono Prove POC

A TypeScript Express API for integrating with Mono's Prove service for identity verification.

## Setup

1. Clone the repository
2. Install dependencies:

```bash
bun install
```

3. Create a `.env` file with the following variables:

```env
MONO_PROVE_PROD_SEC_KEY=your_production_key
MONO_PROVE_TEST_SEC_KEY=your_test_key
MONO_PROVE_DEV_WEBHOOK_SECRET=your_dev_webhook_secret
MONO_PROVE_PROD_WEBHOOK_SECRET=your_prod_webhook_secret
```

| Remember to add a webhook URL to your Mono account for the development (ngrok or similar) and production environment.

4. Start the server:

```bash
bun run dev  # For development with watch mode
bun start    # For production
```

## API Endpoints

### Verify Customer

-   **POST** `/v1/verify`
-   Initiates a verification process for a customer
-   **Request Body:**

```json
{
  "kyc_level": "tier_1" | "tier_2" | "tier_3",
  "bank_accounts": boolean,
  "customer": {
    "name": string,
    "email": string,
    "address": string,
    "identity": {
      "type": "nin" | "bvn",
      "number": string (11 digits)
    }
  },
  "loan_amount": number (min 1000),
  "monthly_income": number,
  "redirect_url": string
}
```

-   **Response:**

```json
{
  "success": true,
  "message": "Verification initiated successfully",
  "data": {
    "reference": string,
    "mono_url": string
  }
}
```

### Check Verification Status

-   **GET** `/v1/status/:reference`
-   Retrieves the status of a verification process
-   **Response:**

```json
{
  "success": true,
  "message": "Loan status fetched successfully",
  "data": {
    "loanDecision": string
  }
}
```

### Get Customer Details

-   **GET** `/v1/customers/:reference`
-   Retrieves detailed information about a customer
-   **Response:** Customer details including personal information and verification status

### Revoke Customer Access

-   **DELETE** `/v1/customers/:reference`
-   Revokes data access for a customer
-   **Response:** Success/failure status with timestamp

### Update Customer Profile

-   **PATCH** `/v1/customers/:reference`
-   Updates customer profile (whitelist/blacklist)
-   **Request Body:**

```json
{
  "action": boolean, // true is to blacklist, false is to whitelist
  "reason": string, // only needed if action is true
  "code": string // only needed if action is true
}
```

-   **Response:** Success/failure status with timestamp

### Webhook Endpoint

-   **POST** `/v1/webhooks/mono`
-   Receives verification status updates from Mono
-   Handles the following events:
    -   `mono.prove.data_verification_initiated`
    -   `mono.prove.data_verification_successful`
    -   `mono.prove.data_verification_cancelled`
    -   `mono.prove.data_verification_expired`

## Technologies

-   Bun.js
-   Express
-   TypeScript
-   SQLite
-   Zod (for validation)
-   Mono API

## Development

The project uses Bun as the runtime and package manager. The database schema is automatically created on first run. Development mode includes file watching for automatic restarts.

## Environment

-   Development: Uses test keys and development webhook secrets
-   Production: Uses production keys and webhook secrets
