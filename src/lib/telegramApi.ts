import { Signal, SignalDirection, SignalQuality } from '@/types';
import { PAIR_CONFIG } from './constants';
import { formatPrice } from './utils';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  signal: Signal,
): Promise<boolean> {
  const text = buildMessage(signal);
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Telegram API error:', res.status, err);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Telegram send failed:', e);
    return false;
  }
}

function buildMessage(signal: Signal): string {
  const config = PAIR_CONFIG[signal.pair];
  const dirEmoji = signal.direction === SignalDirection.Buy ? '🟢' : '🔴';
  const dirText = signal.direction === SignalDirection.Buy ? 'BUY' : 'SELL';
  const qualityLabel = getQualityLabel(signal.quality);
  const passedCount = signal.conditions.filter((c) => c.passed).length;

  const lines: string[] = [
    `${dirEmoji} <b>${config.displayName} — ${dirText}</b> (${qualityLabel})`,
    '',
    `💰 Giá: $${formatPrice(signal.price)}`,
    `📊 ${passedCount}/5 điều kiện | ADX: ${signal.adx.toFixed(1)}`,
    '',
  ];

  for (const c of signal.conditions) {
    lines.push(`${c.passed ? '✅' : '❌'} ${c.name}: ${c.detail}`);
  }

  lines.push('');
  lines.push(`📐 MTF: 1H ${signal.mtf1H ? '✓' : '✗'} | 4H ${signal.mtf4H ? '✓' : '✗'}`);

  if (signal.stopLoss != null && signal.takeProfit != null) {
    lines.push(`🛑 SL: $${formatPrice(signal.stopLoss)} | 🎯 TP: $${formatPrice(signal.takeProfit)}`);
  }

  const time = new Date(signal.timestamp).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  lines.push(`⏰ ${time}`);

  return lines.join('\n');
}

function getQualityLabel(quality: SignalQuality): string {
  switch (quality) {
    case SignalQuality.Beautiful: return 'ĐẸP';
    case SignalQuality.Strong: return 'Mạnh';
    case SignalQuality.Normal: return 'Thường';
    case SignalQuality.None: return 'Chờ';
  }
}
