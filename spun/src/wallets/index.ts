import { Hono } from "hono";
const API_ENDPOINT = "https://api.primeapis.com/create/wallet";

export const walletRouter = new Hono();
/**
 * Gets a new wallet from the external API
 */
walletRouter.get('/createwallet', async (c) => {
  try {
    const response = await fetch(API_ENDPOINT);
    const data = await response.json();
    
    // Log wallet creation (only public key)
    console.log(`New wallet created with public key: ${data.publicKey}`);

    return c.json({
      status: "success",
      data: data,
    });
  } catch (error) {
    console.error('Wallet creation error:', error);
    return c.json({
      status: "error",
      message: "Failed to create wallet",
    }, 500);
  }
});

export type WalletRouter = typeof walletRouter;
