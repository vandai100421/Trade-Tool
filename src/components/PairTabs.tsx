'use client';

import { Tabs } from 'antd';
import { TradingPair } from '@/types';
import { PAIR_CONFIG } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { useMarketStore } from '@/stores/marketStore';

interface Props {
  activePair: TradingPair;
  onSelect: (pair: TradingPair) => void;
}

export function PairTabs({ activePair, onSelect }: Props) {
  const prices = useMarketStore((s) => s.prices);

  const items = Object.values(TradingPair).map((pair) => {
    const config = PAIR_CONFIG[pair];
    const price = prices[pair];
    return {
      key: pair,
      label: (
        <span>
          {config.displayName}
          {price != null && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#9CA3AF' }}>
              {formatPrice(price)}
            </span>
          )}
        </span>
      ),
    };
  });

  return (
    <Tabs
      activeKey={activePair}
      onChange={(key) => onSelect(key as TradingPair)}
      items={items}
      size="large"
    />
  );
}
