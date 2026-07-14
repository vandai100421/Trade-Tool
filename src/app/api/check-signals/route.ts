import { NextResponse } from 'next/server';
import { ALL_PAIRS, PAIR_CONFIG } from '@/lib/constants';
import { computeSignal } from '@/lib/signalEngine';
import { fetchCandlesForSignal } from '@/lib/serverCandleFetch';
import { isOnCooldownServer, setLastSignal } from '@/lib/serverStorage';
import { sendTelegramMessage } from '@/lib/telegramApi';
import { SignalDirection, SignalQuality } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

interface PairResult {
  pair: string;
  direction: string;
  quality: string;
  sent: boolean;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = request.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const twelveDataApiKey = process.env.TWELVE_DATA_API_KEY ?? '';
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !telegramChatId) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured' },
      { status: 500 },
    );
  }

  const results: PairResult[] = [];

  for (const pair of ALL_PAIRS) {
    try {
      const { c15m, c1H, c4H } = await fetchCandlesForSignal(pair, twelveDataApiKey);
      const signal = computeSignal(pair, c15m, c1H, c4H, []);

      const isActionable =
        signal.direction !== SignalDirection.Wait &&
        signal.quality !== SignalQuality.None;

      let sent = false;

      if (isActionable) {
        const onCooldown = await isOnCooldownServer(pair, signal.direction);
        if (!onCooldown) {
          sent = await sendTelegramMessage(telegramToken, telegramChatId, signal);
          if (sent) {
            await setLastSignal(pair, signal.direction);
          }
        }
      }

      results.push({
        pair: PAIR_CONFIG[pair].displayName,
        direction: signal.direction,
        quality: signal.quality,
        sent,
      });
    } catch (e) {
      results.push({
        pair: PAIR_CONFIG[pair].displayName,
        direction: 'wait',
        quality: 'none',
        sent: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
  });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/check-signals',
    method: 'POST',
    header: 'x-cron-secret',
    schedule: 'every 15 minutes via GitHub Actions',
  });
}
