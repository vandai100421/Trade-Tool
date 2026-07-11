'use client';

import { Card, Tag, Statistic, Row, Col, Typography, Space, Empty, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { Signal, SignalDirection, SignalQuality } from '@/types';
import { PAIR_CONFIG } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { TrendMatrixTable } from './TrendMatrixTable';

const { Text } = Typography;

export function SignalCard({ signal }: { signal: Signal | undefined }) {
  if (!signal) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Spin tip="Đang tải tín hiệu..." />
        </div>
      </Card>
    );
  }

  const isWait = signal.direction === SignalDirection.Wait;
  const dirColor = getDirectionColor(signal.direction);
  const config = PAIR_CONFIG[signal.pair];
  const passedCount = signal.conditions.filter((c) => c.passed).length;

  return (
    <Card
      variant="borderless"
      style={{ borderColor: dirColor, borderWidth: isWait ? 1 : 2 }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Statistic
            title={config.displayName}
            value={signal.price}
            precision={2}
            prefix="$"
          />
        </Col>
        <Col style={{ textAlign: 'right' }}>
          <Space direction="vertical" size={4}>
            <Statistic
              value={getDirectionLabel(signal.direction)}
              prefix={getDirectionIcon(signal.direction)}
              valueStyle={{ color: dirColor, fontSize: 28, fontWeight: 'bold' }}
            />
            <QualityTag quality={signal.quality} />
          </Space>
        </Col>
      </Row>

      {isWait ? (
        <>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                Chưa đủ điều kiện giao dịch
                <br />
                Đang chờ tín hiệu rõ ràng hơn
              </Text>
            }
          />
          {signal.trendMatrix && (
            <TrendMatrixTable trendMatrix={signal.trendMatrix} />
          )}
        </>
      ) : (
        <>
          <Text type="secondary" strong>
            5 Điều kiện ({passedCount}/5)
          </Text>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            {signal.conditions.map((c) => (
              <Row key={c.index} gutter={8} style={{ marginBottom: 4 }}>
                <Col span={1}>
                  <Text>{c.passed ? '✅' : '❌'}</Text>
                </Col>
                <Col span={6}>
                  <Text>{c.name}</Text>
                </Col>
                <Col span={17}>
                  <Text style={{ color: c.passed ? '#22C55E' : '#EF4444' }}>
                    {c.detail}
                  </Text>
                </Col>
              </Row>
            ))}
          </div>

          <Card size="small" style={{ backgroundColor: '#21262D' }}>
            <Row justify="space-around" align="middle">
              <Col>
                <Statistic
                  title="ADX"
                  value={signal.adx}
                  precision={1}
                  valueStyle={{
                    color: signal.adx > 30 ? '#22C55E' : '#9CA3AF',
                    fontSize: 16,
                  }}
                />
              </Col>
              <Col>
                <Statistic
                  title="MTF 1H"
                  value={signal.mtf1H ? '✓' : '✗'}
                  valueStyle={{
                    color: signal.mtf1H ? '#22C55E' : '#EF4444',
                    fontSize: 16,
                  }}
                />
              </Col>
              <Col>
                <Statistic
                  title="MTF 4H"
                  value={signal.mtf4H ? '✓' : '✗'}
                  valueStyle={{
                    color: signal.mtf4H ? '#22C55E' : '#EF4444',
                    fontSize: 16,
                  }}
                />
              </Col>
            </Row>
            {signal.stopLoss != null && signal.takeProfit != null && (
              <>
                <Row
                  justify="space-around"
                  align="middle"
                  style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #21262D' }}
                >
                  <Col>
                    <Statistic
                      title="Stop Loss"
                      value={signal.stopLoss}
                      precision={2}
                      valueStyle={{ color: '#EF4444', fontSize: 16 }}
                    />
                  </Col>
                  <Col>
                    <Statistic
                      title="Take Profit"
                      value={signal.takeProfit}
                      precision={2}
                      valueStyle={{ color: '#22C55E', fontSize: 16 }}
                    />
                  </Col>
                </Row>
              </>
            )}
          </Card>

          {signal.trendMatrix && (
            <TrendMatrixTable trendMatrix={signal.trendMatrix} />
          )}
        </>
      )}
    </Card>
  );
}

function QualityTag({ quality }: { quality: SignalQuality }) {
  const { color, label } = getQualityStyle(quality);
  return <Tag color={color}>{label}</Tag>;
}

function getDirectionColor(dir: SignalDirection): string {
  switch (dir) {
    case SignalDirection.Buy: return '#22C55E';
    case SignalDirection.Sell: return '#EF4444';
    case SignalDirection.Wait: return '#6B7280';
  }
}

function getDirectionLabel(dir: SignalDirection): string {
  switch (dir) {
    case SignalDirection.Buy: return 'BUY';
    case SignalDirection.Sell: return 'SELL';
    case SignalDirection.Wait: return 'WAIT';
  }
}

function getDirectionIcon(dir: SignalDirection) {
  switch (dir) {
    case SignalDirection.Buy: return <ArrowUpOutlined />;
    case SignalDirection.Sell: return <ArrowDownOutlined />;
    case SignalDirection.Wait: return <MinusOutlined />;
  }
}

function getQualityStyle(quality: SignalQuality): { color: string; label: string } {
  switch (quality) {
    case SignalQuality.Beautiful: return { color: 'gold', label: 'ĐẸP' };
    case SignalQuality.Strong: return { color: 'blue', label: 'Mạnh' };
    case SignalQuality.Normal: return { color: 'default', label: 'Thường' };
    case SignalQuality.None: return { color: 'default', label: 'Chờ' };
  }
}
