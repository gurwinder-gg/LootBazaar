import {
    Connection,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
  } from '@solana/web3.js';

  const connection = new Connection('https://api.devnet.solana.com');
  
  export async function prepareTransaction(
    instructions: TransactionInstruction[],
    payer: PublicKey
  ) {
    const blockhash = await connection
      .getLatestBlockhash({ commitment: 'max' })
      .then((res: any) => res.blockhash);
    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
  }
