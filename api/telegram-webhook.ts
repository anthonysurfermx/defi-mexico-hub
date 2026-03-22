// ============================================================
// POST /api/telegram-webhook — Telegram Bot Webhook
// Handles: bot added to group, messages, commands
// When bot is added to a group:
//   1. Creates telegram_groups record
//   2. Sends DM to admin with activation link
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 10 };

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8605994324:AAH5aAvaVxPYrmGM_yjPJQL0nmlY5yd1qM8';
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BASE_URL = 'https://defimexico.org';

async function sendTelegramMessage(chatId: number, text: string, parseMode = 'HTML') {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const update = req.body;
  if (!update) return res.status(200).json({ ok: true });

  const supabase = SB_SERVICE_KEY ? createClient(SB_URL, SB_SERVICE_KEY) : null;

  try {
    // Handle: Bot added to a group
    if (update.my_chat_member) {
      const chat = update.my_chat_member.chat;
      const from = update.my_chat_member.from;
      const newStatus = update.my_chat_member.new_chat_member?.status;

      if (chat.type === 'group' || chat.type === 'supergroup') {
        if (newStatus === 'member' || newStatus === 'administrator') {
          // Bot was added to a group
          const groupId = chat.id;
          const groupName = chat.title || 'Unknown Group';
          const groupUsername = chat.username || null;
          const addedByUserId = from.id;
          const addedByUsername = from.username || from.first_name || 'Unknown';

          // Save to Supabase
          if (supabase) {
            await supabase.from('telegram_groups').upsert({
              telegram_group_id: groupId,
              telegram_group_name: groupName,
              telegram_group_username: groupUsername,
              added_by_telegram_user_id: addedByUserId,
              added_by_telegram_username: addedByUsername,
              bot_status: 'pending_payment',
            }, { onConflict: 'telegram_group_id' });
          }

          const activationUrl = `${BASE_URL}/agentic-world/bobby/telegram?activate=${groupId}`;

          // Try DM to admin (may fail if they haven't /start the bot)
          try {
            await sendTelegramMessage(addedByUserId,
              `🎯 <b>Bobby Agent Trader</b>\n\n` +
              `You added me to <b>${groupName}</b>.\n\n` +
              `To activate, complete the x402 payment:\n\n` +
              `👉 <a href="${activationUrl}">Activate Bobby for ${groupName}</a>\n\n` +
              `Cost: <b>0.01 USDT</b> on X Layer\nAccess: <b>30 days</b>`
            );
          } catch { /* DM failed — user hasn't started bot yet */ }

          // Always send activation link in the group too
          await sendTelegramMessage(groupId,
            `🎯 <b>Bobby Agent Trader</b> has joined!\n\n` +
            `⏳ Activation pending.\n\n` +
            `To activate multi-agent trading intelligence:\n` +
            `👉 <a href="${activationUrl}">Activate Bobby — 0.01 USDT on X Layer</a>\n\n` +
            `Once activated:\n` +
            `• Multi-agent market debates (Alpha/Red/CIO)\n` +
            `• Real-time trading signals with voice notes\n` +
            `• On-chain verified via x402 protocol\n\n` +
            `<i>Powered by OKX X Layer · x402 Payment Protocol</i>`
          );
        }

        if (newStatus === 'left' || newStatus === 'kicked') {
          // Bot was removed from group
          if (supabase) {
            await supabase.from('telegram_groups')
              .update({ bot_status: 'removed' })
              .eq('telegram_group_id', chat.id);
          }
        }
      }
    }

    // Handle: Regular messages in groups (only respond if group is active)
    if (update.message && (update.message.chat.type === 'group' || update.message.chat.type === 'supergroup')) {
      const groupId = update.message.chat.id;
      const text = update.message.text || '';

      // Check if group is active
      if (supabase) {
        const { data: group } = await supabase
          .from('telegram_groups')
          .select('bot_status')
          .eq('telegram_group_id', groupId)
          .single();

        if (!group || group.bot_status !== 'active') {
          // Group not activated — only respond to /start or /activate
          if (text.startsWith('/start') || text.startsWith('/activate')) {
            await sendTelegramMessage(groupId,
              `⏳ Bobby is not yet activated in this group.\n\n` +
              `The admin needs to complete the x402 payment to activate.\n` +
              `👉 ${BASE_URL}/agentic-world/bobby/telegram?activate=${groupId}`
            );
          }
          return res.status(200).json({ ok: true });
        }
      }

      // Group is active — handle commands
      if (text.startsWith('/analyze') || text.startsWith('/bobby')) {
        const query = text.replace(/^\/(analyze|bobby)\s*/i, '').trim() || 'the market';
        await sendTelegramMessage(groupId,
          `🎯 <b>Bobby Agent Trader</b>\n\n` +
          `Analyzing: <b>${query}</b>\n\n` +
          `Three agents are debating...\n` +
          `🟢 Alpha Hunter scanning opportunities\n` +
          `🔴 Red Team checking risks\n` +
          `🟡 CIO synthesizing verdict\n\n` +
          `<i>Full analysis available at ${BASE_URL}/agentic-world/bobby</i>`
        );
      }

      if (text.startsWith('/status')) {
        await sendTelegramMessage(groupId,
          `🎯 <b>Bobby Agent Trader — Status</b>\n\n` +
          `✅ Bot: ACTIVE\n` +
          `🔗 Network: X Layer (196)\n` +
          `💳 Payment: x402 Protocol\n` +
          `🤖 Agents: Alpha Hunter · Red Team · CIO\n\n` +
          `Commands:\n` +
          `<code>/analyze BTC</code> — Market analysis\n` +
          `<code>/status</code> — Bot status\n` +
          `<code>/help</code> — All commands`
        );
      }
    }

    // Handle: DM messages
    if (update.message && update.message.chat.type === 'private') {
      const chatId = update.message.chat.id;
      const text = update.message.text || '';

      if (text.startsWith('/start')) {
        await sendTelegramMessage(chatId,
          `🎯 <b>Bobby Agent Trader</b>\n\n` +
          `I'm an autonomous AI trading intelligence powered by 3 agents:\n\n` +
          `🟢 <b>Alpha Hunter</b> — finds opportunities\n` +
          `🔴 <b>Red Team</b> — challenges every thesis\n` +
          `🟡 <b>CIO</b> — makes the final decision\n\n` +
          `<b>Add me to your Telegram group</b> to get multi-agent market analysis.\n\n` +
          `👉 <a href="${BASE_URL}/agentic-world/bobby/telegram">Learn more</a>\n\n` +
          `<i>Built on OKX X Layer · x402 Payment Protocol</i>`
        );
      }
    }
  } catch (err) {
    console.error('[telegram-webhook] Error:', err);
  }

  return res.status(200).json({ ok: true });
}
