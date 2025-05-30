/**
 * @file jup.ts
 * @description This file defines Solana actions for Jupiter Swap functionality
 */

// TODO refactor and fix major issues (just a placeholder for now)
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import axios from 'axios';
import {
  ActionError,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from '@solana/actions';

const JUPITER_LOGO = 'https://jupiter.wiki/_next/static/media/jupiter-logo.809c72a8.svg';

const tokenPairSchema = z.object({
  tokenPair: z.string(),
});

const tokenPairAmountSchema = z.object({
  tokenPair: z.string(),
  amount: z.string().optional(),
});

const postBodySchema = z.object({
  account: z.string(),
});

const API_BASE_URL = 'https://<worker>/api';

export const jupiterSwapRouter = new Hono()

  /**
   * @description Fetches quote for a specific swap
   * @input tokenPair: the pair of tokens for the swap
   * @input priority: the priority level for the swap
   * @returns ActionGetResponse with swap quote
   * @example http://<worker>/api/jupiter-swap/USDC-SOL/quote?priority=high
   */
  .get("/:tokenPair/quote", zValidator("param", tokenPairSchema), async (c) => {
    const { tokenPair } = c.req.param();
    const priority = c.req.query('priority');
    const [inputToken, outputToken] = tokenPair.split('-');

    try {
      // Fetch quote from your existing API
      const quoteResponse = await axios.get(`${API_BASE_URL}/buy/quote`, {
        params: {
          inputMint: inputToken,
          outputMint: outputToken,
          amount: '1000000', // You might want to make this dynamic
          slippage: '50',
          platformFees: '0'
        }
      });

      const quoteData = quoteResponse.data;

      const response: ActionGetResponse = {
        type: 'action',
        icon: JUPITER_LOGO,
        label: `Swap ${quoteData.inputAmount} ${inputToken} for ${quoteData.outputAmount} ${outputToken}`,
        title: `Jupiter Swap Quote`,
        description: `Swap ${quoteData.inputAmount} ${inputToken} for approximately ${quoteData.outputAmount} ${outputToken}. Priority: ${priority}`,
        data: quoteData,
        links: {
          actions: [
            {
              label: "Confirm Swap",
              href: `/api/jupiter-swap/${tokenPair}/swap`,
            },
          ],
        },
      };

      return c.json(response);
    } catch (error) {
      return c.json({
        type: 'action',
        icon: JUPITER_LOGO,
        label: 'Quote Error',
        title: 'Failed to fetch quote',
        description: 'An error occurred while fetching the swap quote.',
        error: { message: 'Failed to fetch quote' }
      } satisfies ActionGetResponse, 500);
    }
  })

  /**
   * @description Executes the swap
   * @input tokenPair: the pair of tokens for the swap
   * @input body: contains the account information and quote response
   * @returns ActionPostResponse with transaction details
   * @example POST http://<worker>/api/jupiter-swap/USDC-SOL/swap
   */
  .post("/:tokenPair/swap", zValidator("param", tokenPairSchema), zValidator("json", postBodySchema), async (c) => {
    const { tokenPair } = c.req.param();
    const { account, quoteResponse } = await c.req.json<ActionPostRequest>();

    try {
      // Call your existing swap API
      const swapResponse = await axios.post(`${API_BASE_URL}/buy/swap`, {
        quoteResponse,
        userPubkey: account,
        wrapAndUnwrapSol: true,
        feeAccount: 'your_fee_account_here',
      });

      const response: ActionPostResponse = {
        transaction: swapResponse.data.swapTransaction,
      };

      return c.json(response);
    } catch (error) {
      return c.json({
        error: { message: 'Failed to perform swap' }
      } satisfies ActionError, 500);
    }
  });

export type JupiterSwapRouter = typeof jupiterSwapRouter;
