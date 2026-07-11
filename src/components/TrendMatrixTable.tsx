'use client';

import { Card, Table, Tag, Typography, Alert } from 'antd';
import { TrendAnalysis, TrendDirection, TrendMatrix, TrendStrength } from '@/types';

const { Text } = Typography;

interface Props {
  trendMatrix: TrendMatrix | undefined;
}

export function TrendMatrixTable({ trendMatrix }: Props) {
  if (!trendMatrix) return null;

  const columns = [
    {
      title: '',
      dataIndex: 'metric',
      key: 'metric',
      width: 100,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Ngắn hạn (15m)',
      dataIndex: 'shortTerm',
      key: 'shortTerm',
      align: 'center' as const,
    },
    {
      title: 'Trung hạn (1H)',
      dataIndex: 'mediumTerm',
      key: 'mediumTerm',
      align: 'center' as const,
    },
    {
      title: 'Dài hạn (1D)',
      dataIndex: 'longTerm',
      key: 'longTerm',
      align: 'center' as const,
    },
  ];

  const directionRow = {
    key: 'direction',
    metric: 'Hướng',
    shortTerm: <DirectionTag trend={trendMatrix.shortTerm} />,
    mediumTerm: <DirectionTag trend={trendMatrix.mediumTerm} />,
    longTerm: <DirectionTag trend={trendMatrix.longTerm} />,
  };

  const strengthRow = {
    key: 'strength',
    metric: 'Sức mạnh',
    shortTerm: <StrengthTag trend={trendMatrix.shortTerm} />,
    mediumTerm: <StrengthTag trend={trendMatrix.mediumTerm} />,
    longTerm: <StrengthTag trend={trendMatrix.longTerm} />,
  };

  const adxRow = {
    key: 'adx',
    metric: 'ADX',
    shortTerm: trendMatrix.shortTerm.adx.toFixed(1),
    mediumTerm: trendMatrix.mediumTerm.adx.toFixed(1),
    longTerm: trendMatrix.longTerm.adx.toFixed(1),
  };

  const emaGapRow = {
    key: 'emaGap',
    metric: 'EMA Gap',
    shortTerm: <PercentValue value={trendMatrix.shortTerm.emaGapPercent} />,
    mediumTerm: <PercentValue value={trendMatrix.mediumTerm.emaGapPercent} />,
    longTerm: <PercentValue value={trendMatrix.longTerm.emaGapPercent} />,
  };

  const priceVsEmaRow = {
    key: 'priceVsEma',
    metric: 'Giá vs EMA',
    shortTerm: <PercentValue value={trendMatrix.shortTerm.priceVsEmaPercent} />,
    mediumTerm: <PercentValue value={trendMatrix.mediumTerm.priceVsEmaPercent} />,
    longTerm: <PercentValue value={trendMatrix.longTerm.priceVsEmaPercent} />,
  };

  const data = [directionRow, strengthRow, adxRow, emaGapRow, priceVsEmaRow];

  const summary = getTrendSummary(trendMatrix);

  return (
    <Card size="small" title="Phân tích Trend 3 lớp" style={{ backgroundColor: '#21262D' }}>
      <Table
        dataSource={data}
        columns={columns}
        pagination={false}
        size="small"
        bordered
      />
      {summary && (
        <Alert
          style={{ marginTop: 12 }}
          type={summary.type}
          message={summary.message}
          showIcon
        />
      )}
    </Card>
  );
}

function DirectionTag({ trend }: { trend: TrendAnalysis }) {
  const { color, icon, text } = getDirectionStyle(trend.direction);
  return (
    <Tag color={color} style={{ margin: 0 }}>
      {icon} {text}
    </Tag>
  );
}

function StrengthTag({ trend }: { trend: TrendAnalysis }) {
  const { color, text } = getStrengthStyle(trend.strength);
  return <Tag color={color} style={{ margin: 0 }}>{text}</Tag>;
}

function PercentValue({ value }: { value: number }) {
  const color = value > 0 ? '#22C55E' : value < 0 ? '#EF4444' : '#9CA3AF';
  const sign = value > 0 ? '+' : '';
  return <Text style={{ color }}>{sign}{value.toFixed(2)}%</Text>;
}

function getDirectionStyle(dir: TrendDirection): { color: string; icon: string; text: string } {
  switch (dir) {
    case TrendDirection.Bullish: return { color: 'success', icon: '🟢', text: 'Bullish' };
    case TrendDirection.Bearish: return { color: 'error', icon: '🔴', text: 'Bearish' };
    case TrendDirection.Neutral: return { color: 'default', icon: '⚪', text: 'Neutral' };
  }
}

function getStrengthStyle(strength: TrendStrength): { color: string; text: string } {
  switch (strength) {
    case TrendStrength.VeryStrong: return { color: 'gold', text: 'Rất mạnh' };
    case TrendStrength.Strong: return { color: 'success', text: 'Mạnh' };
    case TrendStrength.Forming: return { color: 'processing', text: 'Đang hình thành' };
    case TrendStrength.Weak: return { color: 'default', text: 'Yếu' };
  }
}

function getTrendSummary(matrix: TrendMatrix): { type: 'success' | 'warning' | 'error' | 'info'; message: string } | null {
  const dirs = [matrix.shortTerm.direction, matrix.mediumTerm.direction, matrix.longTerm.direction];
  const bullCount = dirs.filter((d) => d === TrendDirection.Bullish).length;
  const bearCount = dirs.filter((d) => d === TrendDirection.Bearish).length;

  if (bullCount === 3) {
    const allStrong = [matrix.shortTerm, matrix.mediumTerm, matrix.longTerm]
      .every((t) => t.strength === TrendStrength.Strong || t.strength === TrendStrength.VeryStrong);
    return {
      type: 'success',
      message: allStrong
        ? '🟢 Cả 3 timeframe đều Bullish và mạnh — trend cực mạnh, ưu tiên tìm điểm BUY'
        : '🟢 Cả 3 timeframe đều Bullish — trend đồng thuận, tìm điểm BUY',
    };
  }

  if (bearCount === 3) {
    const allStrong = [matrix.shortTerm, matrix.mediumTerm, matrix.longTerm]
      .every((t) => t.strength === TrendStrength.Strong || t.strength === TrendStrength.VeryStrong);
    return {
      type: 'error',
      message: allStrong
        ? '🔴 Cả 3 timeframe đều Bearish và mạnh — trend cực mạnh, ưu tiên tìm điểm SELL'
        : '🔴 Cả 3 timeframe đều Bearish — trend đồng thuận, tìm điểm SELL',
    };
  }

  if (bullCount === 2 && bearCount === 0) {
    return {
      type: 'info',
      message: '🟢 2/3 timeframe Bullish — trend khá tốt, cẩn thận timeframe còn lại',
    };
  }

  if (bearCount === 2 && bullCount === 0) {
    return {
      type: 'info',
      message: '🔴 2/3 timeframe Bearish — trend khá tốt cho SELL, cẩn thận timeframe còn lại',
    };
  }

  if (bullCount >= 1 && bearCount >= 1) {
    return {
      type: 'warning',
      message: '⚠️ Trend conflict giữa các timeframe — nên chờ cho đến khi đồng thuận hơn',
    };
  }

  return {
    type: 'info',
    message: '⚪ Trend chưa rõ ràng — nên đứng ngoài',
  };
}
