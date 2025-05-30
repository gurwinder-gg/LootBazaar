use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[account]
pub struct StakeInfo {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub duration: u64,
    pub claimed: bool,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(init, payer = user, space = 8 + 40)]
    pub stake_info: Account<'info, StakeInfo>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64, duration: u64) -> Result<()> {
    let clock = Clock::get()?;
    let stake_info = &mut ctx.accounts.stake_info;
    stake_info.owner = *ctx.accounts.user.key;
    stake_info.amount = amount;
    stake_info.start_time = clock.unix_timestamp;
    stake_info.duration = duration;
    stake_info.claimed = false;

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
    #[account(mut, has_one = owner)]
    pub stake_info: Account<'info, StakeInfo>,
    pub owner: Signer<'info>,
}

pub fn unstake_tokens(_ctx: Context<UnstakeTokens>) -> Result<()> {
    // Logic to be implemented for token return
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut, has_one = owner)]
    pub stake_info: Account<'info, StakeInfo>,
    pub owner: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let clock = Clock::get()?;
    let stake_info = &mut ctx.accounts.stake_info;

    if stake_info.claimed {
        return err!(ErrorCode::AlreadyClaimed);
    }

    let elapsed = clock.unix_timestamp - stake_info.start_time;
    if elapsed < stake_info.duration as i64 {
        return err!(ErrorCode::StakePeriodNotCompleted);
    }

    stake_info.claimed = true;
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Reward already claimed")]
    AlreadyClaimed,
    #[msg("Stake period not completed")]
    StakePeriodNotCompleted,
}
