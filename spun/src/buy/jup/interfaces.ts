export interface quoteBody {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippage?: number;
    platformFees: number;
}
export interface swapBody {
    quoteResponse: {
        inputMint: string;
        outputMint: string;
        amount: number;
        slippage: number;
        platformFees: number;
    };
    userPubkey: string;
    wrapAndUnwrapSol: boolean;
    feeAccount: string;
    wallet: {
        payer: {
            publicKey: string;
            secretKey: string;
        };
    };
}
