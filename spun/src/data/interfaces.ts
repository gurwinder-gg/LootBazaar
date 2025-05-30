/*
* @file data/interfaces.ts
* @description Interfaces for the data module
*/
export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
  }
  
export interface PairInfo {
    baseToken: TokenInfo;
    quoteToken: TokenInfo;
    priceUsd: string;
    priceNative: string;
    volume: {
      h24: number;
      h6: number;
      h1: number;
    };
    priceChange: {
      h1: number;
      h6: number;
      h24: number;
    };
    liquidity: {
      usd: number;
      quote: number;
      base: number;
    };
    info: {
      imageUrl: string;
      websites: { label: string; url: string }[];
      socials: { type: string; url: string }[];
    };
  }

export interface ApiResponse {
    pairs: PairInfo[];
}

export interface PairInfoQuery {
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  priceUsd: string;
  priceNative: string;
  priceChange: {
    h1: number;
  };
  info: {
    imageUrl: string;
  };
}
export interface ApiResponseQuery {
  pairs: PairInfoQuery[];
}
export interface BasicInfo {
    baseAddress: string;
    priceUsd: string;
    priceNative: string;
    imageUrl: string;
    priceChange: number;
}
  
export interface DetailedInfo {
    baseAddress: string;
    priceUsd: string;
    priceNative: string;
    imageUrl: string;
    volH24: number;
    volH6: number;
    volH1: number;
    priceChangeh1: number;
    priceChangeh6: number;
    priceChangeh24: number;
    liquidityUsd: number;
    liquidityQuote: number;
    liquidityBase: number;
    website?: string;
    twitter?: string;
    telegram?: string;
}

export interface ProcessedData {
    basicInfo: BasicInfo[];
    detailedInfo: DetailedInfo[];
  }

export interface ProcessedDataQuery {
    detailedInfo: DetailedInfo[];
  }
