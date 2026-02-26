/**
 * Mini Bar Chart
 * Pure SVG bar chart for analytics dashboard, no external deps
 */

"use client";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export default function MiniBarChart({
  data,
  height = 120,
  color = "hsl(var(--primary))",
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(
    12,
    Math.min(32, Math.floor(280 / data.length) - 4),
  );
  const chartWidth = data.length * (barWidth + 4);

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(chartWidth, 280)}
        height={height + 24}
        className="mx-auto"
      >
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * height;
          const x = i * (barWidth + 4) + 2;
          const y = height - barHeight;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                fill={color}
                rx={2}
                className="opacity-80 transition-opacity hover:opacity-100"
              />
              {/* Value on top */}
              {d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {d.value}
                </text>
              )}
              {/* Label on bottom */}
              <text
                x={x + barWidth / 2}
                y={height + 14}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
