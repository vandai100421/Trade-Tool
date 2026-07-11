'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Segmented, Typography, Alert, Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { TradingPair, Timeframe } from '@/types';
import { APP_NAME, PAIR_CONFIG, TIMEFRAME_CONFIG } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMarketStore } from '@/stores/marketStore';
import { initNotifications } from '@/lib/notifications';
import { formatTime } from '@/lib/utils';
import { SignalCard } from '@/components/SignalCard';
import { CandlestickChart } from '@/components/CandlestickChart';
import { PairTabs } from '@/components/PairTabs';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function HomePage() {
  const [activePair, setActivePair] = useState<TradingPair>(TradingPair.BtcUsdt);
  const [chartTimeframe, setChartTimeframe] = useState<Timeframe>(Timeframe.M15);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { hydrated, hydrate, twelveDataKey } = useSettingsStore();
  const { signals, candles, watchPair, unwatchPair } = useMarketStore();

  useEffect(() => {
    hydrate();
    initNotifications();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    watchPair(activePair);
    return () => unwatchPair(activePair);
  }, [activePair, hydrated, watchPair, unwatchPair]);

  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const config = PAIR_CONFIG[activePair];
  const needsKey = config.source === 'twelveData' && !twelveDataKey;

  const chartKey = `${activePair}_${chartTimeframe}`;
  const chartCandles = candles[chartKey] ?? [];
  const signal = signals[activePair];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#0D1117',
          borderBottom: '1px solid #21262D',
        }}
      >
        <Title level={4} style={{ margin: 0, color: '#F9FAFB' }}>
          {APP_NAME}
        </Title>
        <Link href="/settings">
          <SettingOutlined style={{ fontSize: 18, color: '#9CA3AF' }} />
        </Link>
      </Header>

      <Content style={{ padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <PairTabs activePair={activePair} onSelect={setActivePair} />

        <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 16 }}>
          {needsKey ? (
            <Card style={{ textAlign: 'center', padding: '32px 0' }}>
              <Title level={4}>Cần Twelve Data API Key</Title>
              <Text type="secondary">
                Vào cài đặt để nhập API key cho {config.displayName}
              </Text>
              <br />
              <Link
                href="/settings"
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  color: '#3B82F6',
                }}
              >
                Mở cài đặt →
              </Link>
            </Card>
          ) : (
            <>
              <SignalCard signal={signal} />

              <Card title="Biểu đồ nến" extra={
                <Segmented
                  value={chartTimeframe}
                  onChange={(val) => setChartTimeframe(val as Timeframe)}
                  options={Object.values(Timeframe).map((tf) => ({
                    label: TIMEFRAME_CONFIG[tf].displayName,
                    value: tf,
                  }))}
                />
              }>
                <CandlestickChart
                  candles={chartCandles}
                  pair={activePair}
                  timeframe={chartTimeframe}
                />
              </Card>
            </>
          )}

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Cập nhật: {formatTime(lastUpdate)}
            </Text>
          </div>
        </Space>
      </Content>
    </Layout>
  );
}
