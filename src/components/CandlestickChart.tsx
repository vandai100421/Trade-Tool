'use client';

import { Card, Empty, Spin } from 'antd';
import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import { Candle, Timeframe, TradingPair } from '@/types';
import { EMA_LONG_PERIOD, EMA_SHORT_PERIOD } from '@/lib/constants';
import { ema } from '@/lib/indicators';

interface Props {
  candles: Candle[];
  pair: TradingPair;
  timeframe: Timeframe;
}

export function CandlestickChart({ candles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: '#21262D' },
        horzLines: { color: '#21262D' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#21262D' },
      timeScale: {
        borderColor: '#21262D',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderUpColor: '#22C55E',
      borderDownColor: '#EF4444',
      wickUpColor: '#22C55E',
      wickDownColor: '#EF4444',
    });
    ema20SeriesRef.current = chart.addLineSeries({
      color: '#F59E0B',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema50SeriesRef.current = chart.addLineSeries({
      color: '#8B5CF6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !ema20SeriesRef.current || !ema50SeriesRef.current) return;
    if (candles.length === 0) return;

    const candleData = candles.map((c) => ({
      time: Math.floor(c.timestamp / 1000) as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const closes = candles.map((c) => c.close);
    const ema20List = ema(closes, EMA_SHORT_PERIOD);
    const ema50List = ema(closes, EMA_LONG_PERIOD);

    const ema20Data = candles
      .map((c, i) => ({
        time: Math.floor(c.timestamp / 1000) as Time,
        value: ema20List[i],
      }))
      .filter((d) => !isNaN(d.value));

    const ema50Data = candles
      .map((c, i) => ({
        time: Math.floor(c.timestamp / 1000) as Time,
        value: ema50List[i],
      }))
      .filter((d) => !isNaN(d.value));

    candleSeriesRef.current.setData(candleData);
    ema20SeriesRef.current.setData(ema20Data);
    ema50SeriesRef.current.setData(ema50Data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  if (candles.length === 0) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="Đang tải biểu đồ..." />
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%' }} />;
}
