// TODO FUTURE ADDITIONS

/**
 * @file swap/index.ts
 * @description This file defines functions for creating swap transactions and getting token pairs
 */
// FOR FUTURE USE - NOT NEEDED NOW

import { PublicKey, Transaction } from '@solana/web3.js';
import { BN } from 'bn.js';
import { TokenInfo } from '@solana/spl-token-registry';
import AmmImpl from '@mercurial-finance/dynamic-amm-sdk';
import * as math from 'mathjs';

/**
 * @description Creates a swap transaction
 * @param userPublicKey The public key of the user
 * @param poolAddress The address of the pool
 * @param usdcAmount The amount of USDC to swap
 * @param token The token to swap to
 * @param referrer The referrer's public key (optional)
 * @returns A Promise that resolves to a Transaction
 */
export const createSwapTx = async (
  userPublicKey: PublicKey,
  poolAddress: string,
  usdcAmount: string,
  token: string,
  referrer: string | null,
): Promise<Transaction> => {
  const poolData = await fetch(
    `https://amm.meteora.ag/pools?address=${poolAddress}`
  ).then((res) => res.json());
  const poolDetails = poolData[0];
  const tokenList: TokenInfo[] = await fetch('https://token.jup.ag/all').then(
    (res) => res.json()
  );
  const tokenADetails = tokenList.find(
    (item) => item && item.address === poolDetails.pool_token_mints[0]
  )!;
  const tokenBDetails = tokenList.find(
    (item) => item && item.address === poolDetails.pool_token_mints[1]
  )!;
  const ammPool = await AmmImpl.create(
    connection,
    new PublicKey(poolAddress),
    tokenADetails,
    tokenBDetails
  );
  const inTokenDetails =
    tokenADetails.address === token ? tokenBDetails : tokenADetails;
  const { getTokenPricesInUsdc } = createJupiterApi();
  const inToken = new PublicKey(inTokenDetails.address);
  const prices = await getTokenPricesInUsdc([inToken.toString()]);
  const tokenPriceUsd = prices[inToken.toString()];
  const amount = parseFloat(usdcAmount) / tokenPriceUsd.price;
  const swapAmount = new BN(
    math
      .bignumber(amount)
      .mul(10 ** inTokenDetails.decimals)
      .floor()
      .toString()
  );
  const swapQuote = ammPool.getSwapQuote(inToken, swapAmount, 10);
  const referrerKey = referrer ? new PublicKey(referrer) : undefined;
  const swapTx = await ammPool.swap(
    userPublicKey,
    inToken,
    swapAmount,
    swapQuote.minSwapOutAmount,
    referrerKey
  );
  return swapTx;
};

/**
 * @description Gets the token pair for a given pool and token
 * @param poolAddress The address of the pool
 * @param token The token to get the pair for
 * @returns A Promise that resolves to a tuple of PublicKeys representing the token pair
 */
export const getTokenPair = async (
  poolAddress: string,
  token: string
): Promise<[PublicKey, PublicKey]> => {
  const poolData = await fetch(
    `https://amm.meteora.ag/pools?address=${poolAddress}`
  ).then((res) => res.json());
  const poolDetails = poolData[0];
  const tokenList: TokenInfo[] = await fetch('https://token.jup.ag/all').then(
    (res) => res.json()
  );
  const tokenA = tokenList.find(
    (token) => token && token.address === poolDetails.pool_token_mints[0]
  );
  const tokenB = tokenList.find(
    (token) => token && token.address === poolDetails.pool_token_mints[1]
  );
  const inToken = tokenA!.address === token ? tokenB : tokenA;
  const outToken = tokenA!.address === token ? tokenA : tokenB;
  return [new PublicKey(inToken!.address), new PublicKey(outToken!.address)];
};
