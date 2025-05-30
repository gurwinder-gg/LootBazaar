/**
 * @file dynamicTransfer/index.ts
 * @description Defines a dynamic router for handling various types of money transfers
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js';
import { prepareTransaction } from './utils';
import {
  ActionGetResponse,
  ActionPostResponse,
  MEMO_PROGRAM_ID,
} from '@solana/actions';

import { DEFAULT_DESTINATION_WALLET } from './constants';

const transferParamsSchema = z.object({
  custom: z.string(),
  amount: z.string().optional(),
});

// Define a custom request type that includes metadata
interface CustomActionPostRequest {
  account: string;
  recipient?: string;
  metadata?: Record<string, unknown>;
}

const transferBodySchema = z.object({
  account: z.string(),
  recipient: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

async function prepareDynamicTransferTransaction(
  sender: PublicKey,
  recipient: PublicKey,
  lamports: number,
  memo?: string,
): Promise<VersionedTransaction> {
  try {
    const payer = new PublicKey(sender);
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: recipient,
        lamports: lamports,
      }),
    ];

    if (memo) {
      instructions.push(
        new TransactionInstruction({
          programId: new PublicKey(MEMO_PROGRAM_ID),
          data: Buffer.from(memo, 'utf8'),
          keys: [],
        })
      );
    }

    return prepareTransaction(instructions, payer);
  } catch (error) {
    console.error('Error preparing dynamic transfer transaction:', error);
    throw new Error('Failed to prepare dynamic transfer transaction');
  }
}

export const dynamicTransferRouter = new Hono()

/**
 * Retrieves transfer information including icon, title, and description
 * @returns Object containing transfer information
 * @example http://<worker>/api/actions/dynamicTransfer/custom/info
 * @example http://<worker>/api/actions/dynamic/custom/amount
 */
  .get('/:custom/info', zValidator('param', transferParamsSchema), async (c) => {
    try {
      const { custom } = c.req.param();
      const response: ActionGetResponse = {
        type: 'action',
        icon: 'https://example.com/default-icon.png', // Replace with your default icon
        label: `${custom} Transfer`,
        title: `${custom} Transfer`,
        description: `Perform a ${custom} transfer`,
        links: {
          actions: [
            {
              href: `/api/dynamicTransfer/${custom}/{amount}`,
              label: `${custom} Transfer`,
              parameters: [
                {
                  name: 'amount',
                  label: 'Enter SOL amount',
                },
              ],
            },
          ],
        },
      };
      return c.json(response);
    } catch (error) {
      console.error('Error in GET /:custom/info:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  })

/**
 * Handles transfer actions including fetching transfer information and processing transfers
 * @returns Object containing transfer information
 */
  .get('/:custom/:amount', zValidator('param', transferParamsSchema), async (c) => {
    try {
      const { custom, amount } = c.req.param();
      const response: ActionGetResponse = {
        type: 'action',
        icon: 'https://example.com/default-icon.png', // Replace with your default icon
        label: `${custom} Transfer: ${amount} SOL`,
        title: `${custom} Transfer`,
        description: `Perform a ${custom} transfer of ${amount} SOL`,
      };
      return c.json(response);
    } catch (error) {
      console.error('Error in GET /:custom/:amount:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  })

  .post('/:custom/:amount', zValidator('param', transferParamsSchema), zValidator('json', transferBodySchema), async (c) => {
    try {
      const { custom, amount } = c.req.param();
      const { account, recipient, metadata } = await c.req.json<CustomActionPostRequest>();

      const parsedAmount = parseFloat(amount || '0');
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return c.json({ error: 'Invalid amount' }, 400);
      }

      const destinationWallet = recipient || DEFAULT_DESTINATION_WALLET;
      const memo = metadata?.memo as string | undefined;

      const transaction = await prepareDynamicTransferTransaction(
        new PublicKey(account),
        new PublicKey(destinationWallet),
        parsedAmount * LAMPORTS_PER_SOL,
        memo
      );

      const response: ActionPostResponse = {
        transaction: Buffer.from(transaction.serialize()).toString('base64'),
        message: `${custom} transfer of ${parsedAmount} SOL processed successfully`,
      };

      // Add additional metadata to the response
      if (metadata) {
        Object.assign(response, { metadata });
      }

      return c.json(response);
    } catch (error) {
      console.error('Error in POST /:custom/:amount:', error);
      return c.json({ error: 'Failed to process transfer' }, 500);
    }
  });

export type DynamicTransferRouter = typeof dynamicTransferRouter;
