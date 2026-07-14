import { Signal, SignalDirection, SignalQuality } from '@/types';
import { PAIR_CONFIG } from './constants';

let permissionRequested = false;

export async function initNotifications(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default' && !permissionRequested) {
    permissionRequested = true;
    await Notification.requestPermission();
  }
}

export async function showSignalNotification(signal: Signal): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = buildTitle(signal);
  const body = buildBody(signal);
  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: signal.pair,
  };

  const swReg = await getServiceWorkerRegistration();
  if (swReg) {
    await swReg.showNotification(title, options);
  } else {
    try {
      new Notification(title, options);
    } catch {
      // Trên mobile (iOS) constructor throw TypeError khi không có service worker
      // → câm lặng, SW sẽ được đăng ký lại sau
    }
  }
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) return reg;
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}

function buildTitle(signal: Signal): string {
  const dir = signal.direction === SignalDirection.Buy ? 'BUY' : 'SELL';
  const emoji = signal.direction === SignalDirection.Buy ? '🟢' : '🔴';
  const pairName = PAIR_CONFIG[signal.pair].displayName;
  const qualityLabel = getQualityLabel(signal.quality);
  return `${emoji} ${pairName} ${dir} — ${qualityLabel}`;
}

function buildBody(signal: Signal): string {
  const parts: string[] = [
    `${signal.conditions.filter((c) => c.passed).length}/5 dieu kien`,
    `ADX: ${signal.adx.toFixed(1)}`,
    `MTF: 1H ${signal.mtf1H ? '✓' : '✗'} | 4H ${signal.mtf4H ? '✓' : '✗'}`,
  ];
  if (signal.stopLoss != null) {
    parts.push(`SL: ${signal.stopLoss.toFixed(2)}`);
  }
  if (signal.takeProfit != null) {
    parts.push(`TP: ${signal.takeProfit.toFixed(2)}`);
  }
  return parts.join(' | ');
}

function getQualityLabel(quality: SignalQuality): string {
  switch (quality) {
    case SignalQuality.Beautiful: return 'ĐẸP';
    case SignalQuality.Strong: return 'Mạnh';
    case SignalQuality.Normal: return 'Thường';
    case SignalQuality.None: return 'Chờ';
  }
}

export async function sendSignalEmail(signal: Signal, emailTo: string): Promise<boolean> {
  try {
    const subject = `🔔 Tín hiệu ĐẸP — ${PAIR_CONFIG[signal.pair].displayName} ${signal.direction === SignalDirection.Buy ? 'BUY' : 'SELL'}`;
    const html = buildEmailHtml(signal);

    const res = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: emailTo, subject, html }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

function buildEmailHtml(signal: Signal): string {
  const dirColor = signal.direction === SignalDirection.Buy ? '#22C55E' : '#EF4444';
  const dirText = signal.direction === SignalDirection.Buy ? 'BUY' : 'SELL';
  const pairName = PAIR_CONFIG[signal.pair].displayName;

  const conditionsHtml = signal.conditions
    .map((c) => `<tr><td>${c.passed ? '✅' : '❌'}</td><td>${c.name}</td><td>${c.detail}</td></tr>`)
    .join('');

  const slTp =
    signal.stopLoss != null && signal.takeProfit != null
      ? `<tr><td><b>Stop Loss</b></td><td>${signal.stopLoss.toFixed(2)}</td></tr>
         <tr><td><b>Take Profit</b></td><td>${signal.takeProfit.toFixed(2)}</td></tr>`
      : '';

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#0D1117;color:#F9FAFB;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#161B22;border-radius:12px;padding:24px;">
    <h1 style="color:#EAB308;margin:0 0 16px;">🔔 Tín hiệu ĐẸP</h1>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;"><b>Cặp</b></td><td>${pairName}</td></tr>
      <tr><td style="padding:8px 0;"><b>Chiều</b></td>
        <td style="color:${dirColor};font-weight:bold;font-size:18px;">${dirText}</td></tr>
      <tr><td style="padding:8px 0;"><b>Giá</b></td><td>${signal.price.toFixed(2)}</td></tr>
      <tr><td style="padding:8px 0;"><b>ADX</b></td><td>${signal.adx.toFixed(1)} (trend mạnh)</td></tr>
      <tr><td style="padding:8px 0;"><b>MTF</b></td><td>1H ${signal.mtf1H ? '✓' : '✗'} | 4H ${signal.mtf4H ? '✓' : '✗'}</td></tr>
      ${slTp}
    </table>
    <h3 style="margin:24px 0 8px;color:#9CA3AF;">5 Điều kiện</h3>
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#21262D;">
        <th style="padding:8px;text-align:left;"></th>
        <th style="padding:8px;text-align:left;">Chỉ báo</th>
        <th style="padding:8px;text-align:left;">Chi tiết</th>
      </tr>
      ${conditionsHtml}
    </table>
    <p style="color:#6B7280;font-size:12px;margin-top:24px;">
      Thời gian: ${signal.timestamp}<br>
      Đây là tín hiệu tham khảo, không phải lời khuyên đầu tư.
    </p>
  </div>
</body>
</html>`;
}
