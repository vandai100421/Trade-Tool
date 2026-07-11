'use client';

import { ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ReactNode } from 'react';

export function AntdThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3B82F6',
          colorBgBase: '#0D1117',
          colorBgContainer: '#161B22',
          colorBgElevated: '#21262D',
          colorBorder: '#21262D',
          colorBorderSecondary: '#21262D',
          colorText: '#F9FAFB',
          colorTextSecondary: '#9CA3AF',
          colorSuccess: '#22C55E',
          colorError: '#EF4444',
          colorWarning: '#EAB308',
          borderRadius: 8,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
