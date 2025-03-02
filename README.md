# PumpFun Telegram Bot

A powerful Telegram bot for automated trading on PumpFun platform with Solana tokens.

## Features

- **Account Management**: Generate and manage Solana wallets for each user
- **Automated Trading**: Run buy/sell loops for specified PumpFun coins
- **Token Information**: Get detailed information about PumpFun tokens
- **Account Management**: Close token accounts and withdraw funds
- **Customizable Trading**: Configure trade amounts and intervals

## Requirements

- Node.js 16+ or Bun runtime
- Telegram Bot Token (from BotFather)
- Solana RPC endpoint (optional, uses default if not specified)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pumpfun-tg-bot.git
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

## License

MIT

## Bot Commands

- `/start` - Initialize the bot and get your wallet address
- `/setAmount 0.01` - Set the trading amount in SOL (default: 0.01)

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

## Security Notes

- The bot generates a unique wallet for each user
- Private keys are stored locally in the `var` directory
- Always use a dedicated wallet with limited funds for trading

## Development

This project was created using Bun, a fast all-in-one JavaScript runtime.
