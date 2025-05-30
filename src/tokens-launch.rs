use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, InitializeMint};

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(init, payer = authority, mint::decimals = decimals, mint::authority = authority)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_token(
    ctx: Context<InitializeToken>,
    _name: String,
    _symbol: String,
    _decimals: u8,
) -> Result<()> {
    // Token already initialized by macro attributes
    Ok(())
}

#[derive(Accounts)]
pub struct MintToUser<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn mint_to_user(ctx: Context<MintToUser>, amount: u64) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::mint_to(cpi_ctx, amount)?;
    Ok(())
}
