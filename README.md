# PumpFun Telegram Bot

A powerful Telegram bot for automated trading on PumpFun platform with Solana tokens. This bot implements advanced trading strategies for meme tokens within the Solana SPL ecosystem.

## Features

- **Account Management**: Generate and manage Solana wallets for each user
- **Automated Trading**: Run buy/sell loops for specified PumpFun coins
- **Token Information**: Get detailed information about PumpFun tokens
- **Account Management**: Close token accounts and withdraw funds
- **Customizable Trading**: Configure trade amounts and intervals
- **MEV Protection**: Transaction optimization to avoid sandwich attacks
- **Slippage Control**: Configurable slippage parameters for better execution

## Technical Overview

This bot operates on the Solana blockchain, interacting with:

- **SPL Token Program**: For token transfers and account management
- **Jupiter Aggregator**: For optimal swap routing (via internal SDK)
- **Solana RPC Nodes**: For transaction broadcasting and confirmation
- **PumpFun API**: For token metadata and market information
- **Associated Token Account (ATA)**: For token account management

### Architecture

The bot follows a modular architecture:

- **Core Module**: Main bot logic and command handling
- **Wallet Module**: Secure wallet generation and management
- **Trading Module**: Transaction creation and execution
- **Conversation Module**: Interactive user flows
- **API Integration**: PumpFun and other service integrations

## Trading Strategies

The bot implements several trading strategies:

### 1. Rapid Liquidity Capture (Default)

A high-frequency trading approach that:
- Executes rapid buy/sell cycles to capture small price movements
- Maintains minimal token holding time to reduce exposure
- Works best in volatile, high-volume markets

### 2. Token Sniping (via Parameters)

- Monitors for new token launches on PumpFun
- Executes trades with minimal delay once identified
- Configurable via the trading amount parameter

### 3. Risk Management

- Dynamic transaction sizing based on wallet balance
- Error threshold monitoring to pause trading after consecutive failures
- Transaction simulation before execution (when preflight is enabled)

## Requirements

- Node.js 16+ or Bun runtime
- Telegram Bot Token (from BotFather)
- Solana RPC endpoint (optional, uses default if not specified)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/adamsandler14/pumpfun-telegram-bot.git
cd pumpfun-tg-bot
```

2. Install dependencies:

```bash
bun install
# or
npm install
```

3. Create a `.env` file in the root directory with your bot token:

```
BOT_TOKEN=your_telegram_bot_token_here
SOLANA_RPC_URL=optional_custom_rpc_url
```

4. Create necessary directories:

```bash
mkdir -p var
```

## Running the Bot

```bash
bun run src/index.ts
```

## Bot Commands

- `/start` - Initialize the bot and get your wallet address
- `/setAmount 0.01` - Set the trading amount in SOL (default: 0.01)
- `/setSlippage 5` - Set slippage tolerance percentage (advanced)
- `/setInterval 3000` - Set trading interval in milliseconds (advanced)

## Keyboard Commands

- `🔫 Run Bot` - Start automated trading for the selected coin
- `🚫 Stop Bot` - Stop automated trading
- `🔥 Close account` - Sell all tokens of the current coin
- `💵 Withdraw All` - Withdraw all SOL to an external wallet

## How to Use

1. Start the bot with `/start` to get your deposit wallet address
2. Deposit SOL to the provided wallet address
3. Send a PumpFun coin link (e.g., https://pump.fun/yourtoken)
4. Optionally set your trading amount with `/setAmount 0.01`
5. Press `🔫 Run Bot` to start automated trading
6. Press `🚫 Stop Bot` to stop trading at any time

## Technical Implementation Details

### Transaction Flow

1. **Instruction Bundling**: Multiple operations are bundled into a single transaction
2. **Budget Pricing**: A budget computation is allocated for complex transactions
3. **Slippage Protection**: Parameters prevent execution at unfavorable prices
4. **Preflight Skipping**: Optimization to execute transactions faster in volatile markets

### Key Dependencies

- **@cryptoscan/solana-wallet-sdk**: For wallet operations and balance queries
- **@cryptoscan/swap-sdk**: For constructing swap transactions
- **@cryptoscan/transactions-sdk**: For transaction construction and submission
- **@grammyjs/conversations**: For interactive dialogues with users
- **@solana/web3.js**: Core interactions with Solana blockchain

## Security Notes

- The bot generates a unique wallet for each user
- Private keys are stored locally in the `var` directory
- Always use a dedicated wallet with limited funds for trading
- Transactions use minimal compute budget to reduce fees
- Error handling prevents excessive fund loss during failures

## Performance Considerations

- Bot executes trades approximately every 3 seconds by default
- Transaction confirmation targets "confirmed" commitment level
- Preflight checks are disabled for faster execution
- Consecutive errors trigger automatic trading suspension

## Development

This project was created using Bun, a fast all-in-one JavaScript runtime.

## Future Enhancements

- **Multi-token Management**: Trade multiple tokens simultaneously
- **Advanced Analytics**: Track performance and generate reports
- **Stop-Loss Implementation**: Automatic position closing at specified thresholds
- **WebSocket Integration**: Real-time price monitoring and trade execution
- **Cross-chain Support**: Expand to other EVM-compatible chains

## License

MIT
