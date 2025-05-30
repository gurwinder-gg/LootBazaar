Sushi
A tRPC server designed to fetch coin prices, execute purchases, and facilitate coin swaps.
Fetching coin prices
https://station.jup.ag/docs/apis/price-api

100 tokens per call allowed Need to use an array, when the user scrolls it fetches new coins and adds them to the array #TODO

API usage - Jupiter exchange
Important: addresses and token tickers are case-sensitive.

Unit price of 1 SOL based on the buy amount of USDC
https://price.jup.ag/v6/price?ids=SOL

{
  "data": {
    "SOL": {
      "id": "So11111111111111111111111111111111111111112",
      "mintSymbol": "SOL",
      "vsToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "vsTokenSymbol": "USDC",
      "price": 30.389174403
    }
  },
  "timeTaken": 0.0003002400007972028
}
Unit price of 1 JUP based on the buy amount of Bonk (how much bonk do i need for jup)
vsToken https://price.jup.ag/v6/price?ids=JUP&vsToken=Bonk
{
    "data": {
        "JUP": {
            "id": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
            "mintSymbol": "JUP",
            "vsToken": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            "vsTokenSymbol": "Bonk",
            "price": 44580.353494
        }
    },
    "timeTaken": 0.0002948529999997618
}
Executing purchases
Alow users to swap coins from each other
Facilitating swaps
Simple solana to memecoin swap

Adding fees
