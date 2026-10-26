This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Transaction Error Catalog (`src/lib/transactionErrors.ts`)

Soroban simulation, signing, submission, confirmation, and IPFS pinning errors are mapped to plain-language catalog entries in `src/lib/transactionErrors.ts` (`code -> { code, category, title, message, cta, retryable }`).

To add a new error catalog mapping:

1. Add the new identifier to `TRANSACTION_ERROR_CODES` in `src/lib/transactionErrors.ts`.
2. Add the corresponding entry in `TRANSACTION_ERROR_CATALOG` with `code`, `category` (one of `TRANSACTION_ERROR_CATEGORIES`), `title`, plain-language `message`, `cta`, and `retryable`.
3. Add detection rules in `classifyCode(error)` (keeping IPFS/pin configuration errors distinct from `wallet_rejected`).
4. Add unit test coverage in `src/lib/transactionErrors.test.ts` verifying the mapped `code`, `category`, `title`, `message`, `cta`, `retryable`, and `diagnostic` fields.

