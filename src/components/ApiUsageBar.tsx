'use client';

import { Progress, Typography, Space, Alert } from 'antd';
import { TWELVE_DATA_DAILY_LIMIT, TWELVE_DATA_WARNING_THRESHOLD } from '@/lib/constants';

const { Text } = Typography;

interface Props {
  count: number;
}

export function ApiUsageBar({ count }: Props) {
  const limit = TWELVE_DATA_DAILY_LIMIT;
  const percent = Math.min((count / limit) * 100, 100);
  const isWarning = count >= TWELVE_DATA_WARNING_THRESHOLD;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ justifyContent: 'space-between', width: '100%' }}>
        <Text type="secondary">Hôm nay</Text>
        <Text strong style={{ color: isWarning ? '#EAB308' : undefined }}>
          {count} / {limit} requests
        </Text>
      </Space>
      <Progress
        percent={percent}
        strokeColor={isWarning ? '#EAB308' : '#3B82F6'}
        trailColor="#21262D"
        showInfo={false}
      />
      {isWarning && (
        <Alert
          type="warning"
          message="Sắp hết quota! Cân nhắc giảm tần suất polling."
          banner
        />
      )}
    </Space>
  );
}
