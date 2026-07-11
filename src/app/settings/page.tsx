'use client';

import { useEffect, useState } from 'react';
import {
  Layout,
  Card,
  Form,
  Input,
  Switch,
  Button,
  Typography,
  Space,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  MailOutlined,
  BellOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useSettingsStore } from '@/stores/settingsStore';
import { useMarketStore } from '@/stores/marketStore';
import { ApiUsageBar } from '@/components/ApiUsageBar';
import { getQuotaInfo } from '@/lib/storage';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function SettingsPage() {
  const {
    twelveDataKey,
    emailTo,
    emailEnabled,
    pushEnabled,
    setTwelveDataKey,
    setEmailTo,
    setEmailEnabled,
    setPushEnabled,
    hydrate,
    hydrated,
  } = useSettingsStore();

  const { apiUsage, refreshApiUsage } = useMarketStore();

  const [twelveDataInput, setTwelveDataInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated) {
      setTwelveDataInput(twelveDataKey);
      setEmailInput(emailTo);
    }
  }, [hydrated, twelveDataKey, emailTo]);

  useEffect(() => {
    if (hydrated && twelveDataKey) {
      refreshApiUsage(twelveDataKey);
    }
  }, [hydrated, twelveDataKey, refreshApiUsage]);

  const usageCount = apiUsage?.count ?? getQuotaInfo().count;

  const handleSave = () => {
    setTwelveDataKey(twelveDataInput.trim());
    setEmailTo(emailInput.trim());
    message.success('Đã lưu cài đặt');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
          background: '#0D1117',
          borderBottom: '1px solid #21262D',
        }}
      >
        <Link href="/">
          <ArrowLeftOutlined style={{ color: '#9CA3AF', fontSize: 16 }} />
        </Link>
        <Title level={4} style={{ margin: 0, color: '#F9FAFB' }}>
          Cài đặt
        </Title>
      </Header>

      <Content style={{ padding: '24px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card title={<><BarChartOutlined /> Nguồn dữ liệu</>}>
            <Form layout="vertical">
              <Form.Item label="Twelve Data API Key">
                <Input.Password
                  value={twelveDataInput}
                  onChange={(e) => setTwelveDataInput(e.target.value)}
                  placeholder="Dùng cho XAU/USD, EUR/USD"
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đăng ký miễn phí: twelvedata.com
              </Text>
            </Form>
          </Card>

          <Card title={<><MailOutlined /> Email thông báo</>}>
            <Form layout="vertical">
              <Form.Item label="Email nhận thông báo">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                Resend API key đã cấu hình trên server (.env.local)
              </Text>
              <Form.Item label="Gửi email khi tín hiệu ĐẸP">
                <Switch
                  checked={emailEnabled}
                  onChange={setEmailEnabled}
                />
                <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
                  5/5 điều kiện + ADX &gt; 30 + MTF đồng ý
                </Text>
              </Form.Item>
            </Form>
          </Card>

          <Card title={<><BellOutlined /> Notification</>}>
            <Form.Item label="Web notification">
              <Switch
                checked={pushEnabled}
                onChange={setPushEnabled}
              />
              <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
                Tín hiệu 4/5 điều kiện trở lên
              </Text>
            </Form.Item>
          </Card>

          <Card title={<><LineChartOutlined /> API Usage (Twelve Data)</>}>
            <ApiUsageBar count={usageCount} />
          </Card>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleSave}
          >
            Lưu cài đặt
          </Button>
        </Space>
      </Content>
    </Layout>
  );
}
