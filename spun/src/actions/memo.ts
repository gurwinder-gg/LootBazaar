/**
 * @file memo/index.ts
 * @description This file defines the main router for the application to handle memo actions
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js';
import { prepareTransaction } from './utils';
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  MEMO_PROGRAM_ID,
} from '@solana/actions';
import { MEMO_DESTINATION_WALLET } from './constants';

const paramsSchema = z.object({
  memo: z.string().optional(),
});

const bodySchema = z.object({
  account: z.string(),
});
/**
 * @description Handles memo actions including fetching memo info and processing memo transactions
 * @returns Hono router for memo actions
 * @example http://<worker>/api/actions/memo
 * @example http://<worker>/api/actions/memo/Hello%20world!
 */
export const memoRouter = new Hono()
  .get('/info', async (c) => {
    try {
      const { icon, title, description } = getMemoInfo();
      const memoParameterName = 'memo';
      const response: ActionGetResponse = {
        type: 'action',
        icon,
        label: 'Send a Memo',
        title,
        description,
        links: {
          actions: [
            {
              href: `/api/memo/{${memoParameterName}}`,
              label: 'Send a message',
              parameters: [
                {
                  name: memoParameterName,
                  label: 'Enter a custom message',
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
  .get('/:memo', zValidator('param', paramsSchema), async (c) => {
    try {
      const { memo } = c.req.param();
      const { icon, title, description } = getMemoInfo();
      const response: ActionGetResponse = {
        type: 'action',
        icon,
        label: `Message: ${memo}`,
        title,
        description,
      };
      return c.json(response);
    } catch (error) {
      console.error('Error in GET /:memo:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  })
  .post('/:memo', zValidator('param', paramsSchema), zValidator('json', bodySchema), async (c) => {
    try {
      const { memo } = c.req.param();
      const { account } = await c.req.json<ActionPostRequest>();

      const transaction = await prepareMemoTransaction(
        new PublicKey(account),
        new PublicKey(MEMO_DESTINATION_WALLET),
        memo || 'Hello world!',
      );

      const response: ActionPostResponse = {
        transaction: Buffer.from(transaction.serialize()).toString('base64'),
        message: `Sent a message to Cheedar: ${memo}`,
      };
      return c.json(response);
    } catch (error) {
      console.error('Error in POST /:memo:', error);
      return c.json({ error: 'Failed to process memo' }, 500);
    }
  });

/**
 * Retrieves memo information including icon, title, and description
 * @returns Object containing memo information
 */
function getMemoInfo(): Pick<ActionGetResponse, 'icon' | 'title' | 'description'> {
  return {
    icon: 'https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/',
    title: 'Send a Memo',
    description: 'Send a memo to Cheddar to say hello!',
  };
}

/**
 * Prepares a memo transaction
 * @param sender The public key of the sender
 * @param recipient The public key of the recipient
 * @param memoData The memo message to be sent
 * @returns A VersionedTransaction object
 * @throws Error if transaction preparation fails
 */
async function prepareMemoTransaction(
  sender: PublicKey,
  recipient: PublicKey,
  memoData: string,
): Promise<VersionedTransaction> {
  try {
    const payer = new PublicKey(sender);
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports: 1,
      }),
      new TransactionInstruction({
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from(memoData, 'utf8'),
        keys: [],
      }),
    ];
    return prepareTransaction(instructions, payer);
  } catch (error) {
    console.error('Error preparing memo transaction:', error);
    throw new Error('Failed to prepare memo transaction');
  }
}

export type MemoRouter = typeof memoRouter;
