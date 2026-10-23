"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, ColorType, type IChartApi, type UTCTimestamp } from "lightweight-charts";

export type Candle = { time: UTCTimestamp; open: number; high: number; low: number; close: number };

export function PriceChart({ candles }: { candles: Candle[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: "#111111" }, textColor: "#5f5f5f", fontFamily: "var(--font-geist-mono)", fontSize: 10 },
      grid: { vertLines: { color: "#1a1a1a" }, horzLines: { color: "#1a1a1a" } },
      rightPriceScale: { borderColor: "#222222" },
      timeScale: { borderColor: "#222222", timeVisible: true, secondsVisible: false },
      crosshair: { vertLine: { color: "#3a3a3a", labelBackgroundColor: "#2f2f2f" }, horzLine: { color: "#3a3a3a", labelBackgroundColor: "#2f2f2f" } },
      autoSize: true,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#ededed",
      downColor: "#ff6b6b",
      borderUpColor: "#ededed",
      borderDownColor: "#ff6b6b",
      wickUpColor: "#9b9b9b",
      wickDownColor: "#ff6b6b",
      priceFormat: { type: "price", precision: 8, minMove: 0.00000001 },
    });
    series.setData(candles);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [candles]);

  return <div ref={ref} className="absolute inset-0" />;
}
