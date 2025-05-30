use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token, MintTo};
use mpl_token_metadata::state::{Creator, DataV2};
use mpl_token_metadata::instruction::{create_metadata_accounts_v3};
use solana_program::{program::invoke_signed, system_instruction};
use std::str::FromStr;

declare_id!("YourProgramIDHere1111111111111111111111111111");

#[derive(Accounts)]
pub struct MintRewardNFT<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: Metaplex program
    pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn mint_reward_nft(ctx: Context<MintRewardNFT>, reward_type: u8) -> Result<()> {
    let metadata_title = match reward_type {
        1 => "LootBazaar Staker Badge",
        2 => "LootBazaar VIP",
        _ => "LootBazaar Reward NFT",
    };

    let metadata_symbol = "LOOT";
    let metadata_uri = "https://arweave.net/your-metadata-json-url"; // Replace with your real metadata URI

    // Create Metadata accounts instruction
    let creators = vec![
        Creator {
            address: *ctx.accounts.payer.to_account_info().key,
            verified: false,
            share: 100,
        },
    ];

    let data = DataV2 {
        name: metadata_title.to_string(),
        symbol: metadata_symbol.to_string(),
        uri: metadata_uri.to_string(),
        seller_fee_basis_points: 500, // 5% royalty
        creators: Some(creators),
        collection: None,
        uses: None,
    };

    let ix = create_metadata_accounts_v3(
        *ctx.accounts.token_metadata_program.key,
        *ctx.accounts.metadata_account.key,
        *ctx.accounts.mint.key,
        *ctx.accounts.mint_authority.key,
        *ctx.accounts.payer.key,
        *ctx.accounts.payer.key,
        data.name,
        data.symbol,
        data.uri,
        Some(vec![Creator {
            address: *ctx.accounts.payer.key,
            verified: true,
            share: 100,
        }]),
        data.seller_fee_basis_points,
        true,
        false,
        None,
        None,
        None,
    );

    invoke_signed(
        &ix,
        &[
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.mint_authority.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
        &[],
    )?;

    Ok(())
}
