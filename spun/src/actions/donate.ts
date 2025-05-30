/**
 * @file donate/index.ts
 * @description This file defines the main router for the application to handle donation actions
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
} from '@solana/web3.js';
import { prepareTransaction } from './utils';
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from '@solana/actions';
import { DONATION_DESTINATION_WALLET, DEFAULT_DONATION_AMOUNT_SOL, DONATION_AMOUNT_SOL_OPTIONS } from './constants';

const paramsSchema = z.object({
  amount: z.string().optional(),
});

const bodySchema = z.object({
    account: z.string(),
});

/**
 * Retrieves donation information including icon, title, and description
 * @returns Object containing donation information
 */
function getDonateInfo(): Pick<ActionGetResponse, 'icon' | 'title' | 'description'> {
  return {
    icon: 'https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/',
    title: 'Donate to Cheddar',
    description: 'Support our app by donating SOL to help us cover server costs and keep the app running!',
  };
}

/**
 * Prepares a donation transaction
 * @param sender The public key of the sender
 * @param recipient The public key of the recipient
 * @param lamports The amount of lamports to transfer
 * @returns A VersionedTransaction object
 * @throws Error if transaction preparation fails
 */
async function prepareDonateTransaction(
  sender: PublicKey,
  recipient: PublicKey,
  lamports: number,
): Promise<VersionedTransaction> {
  try {
    const payer = new PublicKey(sender);
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: new PublicKey(recipient),
        lamports: lamports,
      }),
    ];
    return prepareTransaction(instructions, payer);
  } catch (error) {
    console.error('Error preparing donation transaction:', error);
    throw new Error('Failed to prepare donation transaction');
  }
}

export type DonateRouter = typeof donateRouter;
/**
 * @description Handles donation actions including fetching donation info and processing donations
 * @returns Hono router for donation actions
 * @example http://<worker>/api/actions/donate
 * @example http://<worker>/api/actions/donate/5
 */
export const donateRouter = new Hono()
  .get('/info', async (c) => {
    try {
      const { icon, title, description } = getDonateInfo();
      const amountParameterName = 'amount';
      const response: ActionGetResponse = {
        type: 'action',
        icon,
        label: `${DEFAULT_DONATION_AMOUNT_SOL} SOL`,
        title,
        description,
        links: {
          actions: [
            ...DONATION_AMOUNT_SOL_OPTIONS.map((amount) => ({
              label: `${amount} SOL`,
              href: `/api/donate/${amount}`,
            })),
            {
              href: `/api/donate/{${amountParameterName}}`,
              label: 'Donate',
              parameters: [
                {
                  name: amountParameterName,
                  label: 'Enter a custom SOL amount',
                },
              ],
            },
          ],
        },
      };
      return c.json(response);
    } catch (error) {
      console.error('Error in GET /info:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  })

  .get('/:amount', zValidator('param', paramsSchema), async (c) => {
    try {
      const { amount } = c.req.param();
      const { icon, title, description } = getDonateInfo();
      const response: ActionGetResponse = {
        type: 'action',
        icon,
        label: `${amount} SOL`,
        title,
        description,
      };
      return c.json(response);
    } catch (error) {
      console.error('Error in GET /:amount:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  })
  .post('/:amount', zValidator('param', paramsSchema), zValidator('json', bodySchema), async (c) => {
    try {
      const { amount } = c.req.param();
      const { account } = await c.req.json<ActionPostRequest>();

      const parsedAmount = parseFloat(amount || DEFAULT_DONATION_AMOUNT_SOL.toString());
      const transaction = await prepareDonateTransaction(
        new PublicKey(account),
        new PublicKey(DONATION_DESTINATION_WALLET),
        parsedAmount * LAMPORTS_PER_SOL,
      );
      const response: ActionPostResponse = {
        transaction: Buffer.from(transaction.serialize()).toString('base64'),
      };
      return c.json(response);
    } catch (error) {
      console.error('Error in POST /:amount:', error);
      return c.json({ error: 'Failed to process donation' }, 500);
    }
  });
