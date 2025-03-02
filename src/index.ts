import { Bot, session } from "grammy";
import { getBotAccount, getHasAccount } from "./utils/getBotAccount";
import { getBalance, getPublicKey } from "@cryptoscan/solana-wallet-sdk";
import { conversations, createConversation } from "@grammyjs/conversations";
import { hydrate } from "@grammyjs/hydrate";
import { BotContext } from "./types/BotContext";
import { createTransaction } from "@cryptoscan/swap-sdk";
import sendTransaction from '@cryptoscan/solana-send-transaction';
import { keyboard } from "./keyboard";
import { createCustomConnection, getPumpFunCoin } from "@cryptoscan/transactions-sdk";
import { BotConversation } from "./types/BotConversation";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize bot with token from environment variables
const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

// Configure middleware
bot.use(session());
bot.use(hydrate());
bot.use(conversations());

// Initialize session for new users
bot.use(async (ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  await next();
});

// Helper functions
const formatBalance = (balance: number): string => {
  return balance.toFixed(6);
};

const sendWalletInfo = async (ctx: BotContext, userId: string) => {
  try {
    const wallet = await getBotAccount(userId);
    const balance = !getHasAccount(userId) ? 0 : await getBalance(getPublicKey(wallet));
    
    let text = 'Deposit SOL to the bot wallet and lets start.\n';
    text += 'After that, you should send the pumpfun link of coin.\n\n';
    text += `Address: \`${wallet.publicKey.toString()}\`\n`;
    text += `Balance: ${formatBalance(balance)} SOL`;
    
    await ctx.reply(text, {
      disable_web_page_preview: true,
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: keyboard,
      }
    });
    
    return { wallet, balance };
  } catch (error) {
    console.error('Error sending wallet info:', error);
    await ctx.reply('Error retrieving wallet information. Please try again later.');
    return null;
  }
};

// Start command handler
bot.command('start', async (ctx) => {
  const user = ctx.from;
  if (!user) return;
  
  await sendWalletInfo(ctx, String(user.id));
});

// Command to set trading amount
bot.command('setAmount', (ctx) => {
  try {
    const amount = Number(ctx.msg.text.split(' ')[1]);
    
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply('Please provide a valid positive number.');
    }
    
    ctx.session.amount = amount;
    ctx.reply(`Amount set to ${amount} SOL`);
  } catch (error) {
    ctx.reply('Error setting amount. Please use format: /setAmount 0.01');
  }
});

// Run bot handler
bot.hears('🔫 Run Bot', async (ctx) => {
  // Check if coin address is set
  if (!ctx.session.coinAddress) {
    return ctx.reply('You need to send a PumpFun link first before launching the bot');
  }

  const user = ctx.from;
  if (!user) return;

  const userId = String(user.id);
  
  try {
    const wallet = await getBotAccount(userId);
    const balance = await getBalance(getPublicKey(wallet));

    // Check if balance is sufficient
    if (balance <= 0.001) {
      return sendWalletInfo(ctx, userId);
    }

    // Start the bot
    ctx.reply('Bot started! I will now execute trades automatically. Use "🚫 Stop Bot" to stop.', {
      disable_web_page_preview: true,
      parse_mode: 'Markdown'
    });

    ctx.session.started = 1;

    // Trading logic in separate async function
    (async () => {
      const walletAddress = wallet.publicKey.toString();
      const coinAddress = ctx.session.coinAddress as string;
      let lastError = '';
      let errorCount = 0;

      const interval = setInterval(async () => {
        // Check if bot is still running
        if (!ctx.session.started) {
          clearInterval(interval);
          return;
        }

        try {
          const sol = ctx.session.amount || 0.01;
          
          // Create transaction with buy and sell instructions
          const transaction = await createTransaction({
            payerAddress: walletAddress,
            instructions: [
              {
                type: 'budgetPrice',
                sol: 0.0001,
              },
              {
                type: 'buy',
                service: 'pumpfun',
                coinAddress,
                walletAddress: walletAddress,
                sol,
                slippage: 5,
              },
              {
                type: 'sell',
                service: 'pumpfun',
                coinAddress,
                walletAddress: walletAddress,
                sol,
                slippage: 5,
              }
            ]
          });

          if (transaction instanceof Error) {
            throw transaction;
          }

          transaction.sign([wallet]);

          console.log('Sending transaction...');
          const tx = await sendTransaction(transaction, {
            connection: createCustomConnection(),
            commitment: 'confirmed',
            sendOptions: {
              skipPreflight: true
            }
          });
          
          if (tx instanceof Error) {
            throw tx;
          }
          
          console.log('Transaction successful:', tx);
          
          // Reset error count on success
          errorCount = 0;
          
        } catch (error: any) {
          errorCount++;
          const errorMessage = error.message || 'Unknown error';
          
          // Avoid spamming with the same error message repeatedly
          if (errorMessage !== lastError) {
            ctx.reply(`Warning: ${errorMessage}`);
            lastError = errorMessage;
          }
          
          // Stop bot if too many consecutive errors
          if (errorCount > 5) {
            ctx.session.started = 0;
            ctx.reply('Bot stopped due to multiple consecutive errors.');
            clearInterval(interval);
          }
          
          console.error('Trading error:', error);
        }
      }, 3000);
    })();
  } catch (error) {
    console.error('Error starting bot:', error);
    ctx.reply('Failed to start the bot. Please try again later.');
  }
});

// Stop bot handler
bot.hears('🚫 Stop Bot', (ctx) => {
  ctx.session.started = 0;
  ctx.reply('Bot stopped successfully.');
});

// Handle PumpFun links
bot.hears(/(pump\.fun)/g, async (ctx) => {
  const url = ctx.message?.text;

  if (!url) {
    return ctx.reply('No URL detected. Please send a valid pump.fun link.');
  }

  try {
    const baseUrl = 'https://pump.fun/';
    const address = url.replace(baseUrl, '');
    ctx.session.coinAddress = address;
    
    // Get coin information
    const coin = await getPumpFunCoin(address).catch((e) => {
      throw new Error(`Failed to get coin information: ${e.message}`);
    });

    if (!coin) {
      return ctx.reply('Could not retrieve coin information.');
    }

    let msg = 'Coin successfully saved! ✅\n\n';
    msg += `Name: ${coin.name} (<a href="https://pump.fun/${coin.mint}">$${coin.symbol}</a>)\n`;
    msg += `Dev: <a href="https://solscan.io/account/${coin.creator}">${coin.creator.slice(0, 5)}...${coin.creator.slice(-5)}</a>\n`;
    msg += `Market cap: $${coin.usd_market_cap.toFixed()}\n\n`;
    msg += `Description: ${coin.description || 'No description'}\n`;
    msg += `Website: ${coin.website || 'None'}\n`;
    msg += `Telegram: ${coin.telegram || 'None'}\n`;
    msg += `Twitter: ${coin.twitter || 'None'}\n\n`;
    msg += 'You can now start trading with the "🔫 Run Bot" button.';

    await ctx.reply(msg, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    
  } catch (error: any) {
    console.error('Error processing coin link:', error);
    ctx.reply(`Error: ${error.message || 'Failed to process the coin link'}`);
  }
});

// Close account handler
bot.hears('🔥 Close account', async (ctx) => {
  if (!ctx.session.coinAddress) {
    return ctx.reply('You need to send a PumpFun link first.');
  }

  const user = ctx.from;
  if (!user) return;

  try {
    const userId = String(user.id);
    const coinAddress = ctx.session.coinAddress as string;
    const wallet = await getBotAccount(userId);
    const walletAddress = getPublicKey(wallet);
    
    // Show current token balance
    const tokenBalance = await getBalance(walletAddress, coinAddress);
    await ctx.reply(`Current token balance: ${tokenBalance}`);

    if (tokenBalance <= 0) {
      return ctx.reply('No tokens to sell.');
    }

    // Create close account transaction
    const transaction = await createTransaction({
      payerAddress: walletAddress,
      instructions: [
        {
          type: 'budgetPrice',
          sol: 0.0001,
        },
        {
          type: 'closeAccount',
          coinAddress,
          walletAddress: walletAddress,
        }
      ]
    });

    if (transaction instanceof Error) {
      throw transaction;
    }

    transaction.sign([wallet]);

    // Send transaction
    const tx = await sendTransaction(transaction, {
      connection: createCustomConnection(),
      commitment: 'confirmed',
      sendOptions: {
        skipPreflight: true
      }
    });

    if (tx instanceof Error) {
      throw tx;
    }

    ctx.reply('Sold all tokens successfully! ✅');
    
  } catch (error: any) {
    console.error('Error closing account:', error);
    ctx.reply(`Error: ${error.message || 'Failed to close account'}`);
  }
});

// Withdraw conversation
async function withdraw(conversation: BotConversation, ctx: BotContext) {
  try {
    await ctx.reply('Enter your wallet address to withdraw all funds:');
    
    const user = ctx.from;
    if (!user) return;

    // Wait for user to provide destination address
    const response = await conversation.waitFor(":text");
    const destAddress = response.msg.text;
    
    // Basic validation of address format
    if (!destAddress || destAddress.length < 30) {
      return await ctx.reply('Invalid wallet address. Please try again with a valid Solana address.');
    }

    const userId = String(user.id);
    const wallet = await getBotAccount(userId);
    const walletAddress = getPublicKey(wallet);
    const balance = await getBalance(walletAddress);

    if (balance <= 0.001) {
      return await ctx.reply('Insufficient balance to withdraw.');
    }

    await ctx.reply(`Withdrawing ${formatBalance(balance * 0.995 - 0.001)} SOL to ${destAddress}...`);

    // Create transfer transaction
    const transaction = await createTransaction({
      payerAddress: walletAddress,
      instructions: [
        {
          type: 'budgetPrice',
          sol: 0.0001,
        },
        {
          type: 'transfer',
          fromAddress: walletAddress,
          toAddress: destAddress,
          sol: (balance * 0.995) - 0.001
        }
      ]
    });

    if (transaction instanceof Error) {
      throw transaction;
    }

    transaction.sign([wallet]);

    // Send transaction
    const tx = await sendTransaction(transaction, {
      connection: createCustomConnection(),
      commitment: 'confirmed',
      sendOptions: {
        skipPreflight: true
      }
    });

    if (tx instanceof Error) {
      throw tx;
    }

    await ctx.reply('Funds transferred successfully! ✅');
    
  } catch (error: any) {
    console.error('Error in withdraw process:', error);
    await ctx.reply(`Withdrawal failed: ${error.message || 'Unknown error'}`);
  }
}

// Register withdraw conversation
bot.use(createConversation(withdraw));

// Withdraw command
bot.hears('💵 Withdraw All', (ctx) => {
  ctx.conversation.enter('withdraw');
});

// Start the bot
console.log('Starting PumpFun Telegram Bot...');
bot.start();
