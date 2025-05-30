use anchor_lang::prelude::*;

pub mod token_launch;
pub mod tiered_pricing;
pub mod staking;
pub mod nft_rewards;
pub mod utils;

use token_launch::*;
use tiered_pricing::*;
use staking::*;
use nft_rewards::*;

// Replace this with your real program ID
declare_id!("YourProgramIDHere1111111111111111111111111111");

#[program]
pub mod lootbazaar {
    use super::*;

    pub fn initialize_token(ctx: Context<InitializeToken>, name: String, symbol: String, decimals: u8) -> Result<()> {
        token_launch::initialize_token(ctx, name, symbol, decimals)
    }

    pub fn mint_to_user(ctx: Context<MintToUser>, amount: u64) -> Result<()> {
        token_launch::mint_to_user(ctx, amount)
    }

    pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64, duration: u64) -> Result<()> {
        staking::stake_tokens(ctx, amount, duration)
    }

    pub fn unstake_tokens(ctx: Context<UnstakeTokens>) -> Result<()> {
        staking::unstake_tokens(ctx)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        staking::claim_rewards(ctx)
    }

    pub fn mint_reward_nft(ctx: Context<MintRewardNFT>, reward_type: u8) -> Result<()> {
        nft_rewards::mint_reward_nft(ctx, reward_type)
    }
}
