import { cn } from '@/lib/utils';

export interface TrendPoint {
    /** ISO date (YYYY-MM-DD). */
    date: string;
    buy: number;
    sell: number;
    margin: number;
}

interface TrendChartProps {
    data: TrendPoint[];
    /** Chart height in pixels. Defaults to 260. */
    height?: number;
    className?: string;
}

/** Chart plot inset (left room for the y-axis labels). */
const PADDING = { top: 16, right: 12, bottom: 28, left: 56 };

const currency = new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const dayLabel = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
});

/**
 * Rounds a max value up to a "nice" axis ceiling (1, 2, 5 x 10^n).
 */
function niceCeil(value: number): number {
    if (value <= 0) {
        return 100;
    }

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const step =
        normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

    return step * magnitude;
}

/**
 * Dependency-free SVG chart: grouped bars for purchases / sales per day,
 * with a margin line on top of the same axis.
 *
 * Uses a fixed viewBox and `preserveAspectRatio="none"` is avoided: the SVG
 * scales with its container while keeping a stable internal coordinate system,
 * which keeps it crisp on every breakpoint.
 */
export default function TrendChart({
    data,
    height = 260,
    className,
}: TrendChartProps) {
    if (data.length === 0) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-muted-foreground dark:border-neutral-800 dark:text-neutral-400',
                    className,
                )}
                style={{ height }}
            >
                Aucune donnée à afficher pour le moment.
            </div>
        );
    }

    const width = 720;
    const plotWidth = width - PADDING.left - PADDING.right;
    const plotHeight = height - PADDING.top - PADDING.bottom;

    const maxValue = niceCeil(
        Math.max(
            ...data.map((point) =>
                Math.max(point.buy, point.sell, Math.abs(point.margin)),
            ),
            1,
        ),
    );

    const slotWidth = plotWidth / data.length;
    const barWidth = Math.max(Math.min(slotWidth / 3, 22), 3);
    const gap = 4;

    const xFor = (index: number) =>
        PADDING.left + slotWidth * index + slotWidth / 2;
    const yFor = (value: number) =>
        PADDING.top + plotHeight - (value / maxValue) * plotHeight;

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ratio * maxValue);

    const marginPoints = data
        .map(
            (point, index) =>
                `${xFor(index)},${yFor(Math.max(point.margin, 0))}`,
        )
        .join(' ');

    const labelStep = Math.ceil(data.length / 7);

    return (
        <div className={cn('w-full', className)}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-auto w-full"
                role="img"
                    aria-label="Évolution des achats et des ventes"
                >
                    {/* Horizontal grid + y-axis labels */}
                {ticks.map((tick) => {
                    const y = yFor(tick);

                    return (
                        <g key={tick}>
                            <line
                                x1={PADDING.left}
                                y1={y}
                                x2={width - PADDING.right}
                                y2={y}
                                className="stroke-slate-200 dark:stroke-neutral-800"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                            />
                            <text
                                x={PADDING.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-slate-400 text-[10px] dark:fill-neutral-500"
                            >
                                {currency.format(tick)}
                            </text>
                        </g>
                    );
                })}

                {/* Bars: purchases (amber) + sales (sky) */}
                {data.map((point, index) => {
                    const center = xFor(index);
                    const buyHeight =
                        (Math.max(point.buy, 0) / maxValue) * plotHeight;
                    const sellHeight =
                        (Math.max(point.sell, 0) / maxValue) * plotHeight;

                    return (
                        <g key={point.date}>
                            <title>
                                {`${dayLabel.format(new Date(point.date))} — Achats: ${point.buy.toLocaleString('fr-FR')} / Ventes: ${point.sell.toLocaleString('fr-FR')}`}
                            </title>
                            <rect
                                x={center - barWidth - gap / 2}
                                y={yFor(Math.max(point.buy, 0))}
                                width={barWidth}
                                height={Math.max(buyHeight, 1)}
                                rx={2}
                                className="fill-amber-500 dark:fill-amber-400"
                            />
                            <rect
                                x={center + gap / 2}
                                y={yFor(Math.max(point.sell, 0))}
                                width={barWidth}
                                height={Math.max(sellHeight, 1)}
                                rx={2}
                                className="fill-sky-500 dark:fill-sky-400"
                            />
                        </g>
                    );
                })}

                {/* Margin line */}
                <polyline
                    points={marginPoints}
                    fill="none"
                    className="stroke-emerald-500 dark:stroke-emerald-400"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {data.map((point, index) => (
                    <circle
                        key={`dot-${point.date}`}
                        cx={xFor(index)}
                        cy={yFor(Math.max(point.margin, 0))}
                        r={3}
                        className="fill-emerald-500 dark:fill-emerald-400"
                    />
                ))}

                {/* X-axis labels */}
                {data.map((point, index) => {
                    if (index % labelStep !== 0 && index !== data.length - 1) {
                        return null;
                    }

                    return (
                        <text
                            key={`x-${point.date}`}
                            x={xFor(index)}
                            y={height - 8}
                            textAnchor="middle"
                            className="fill-slate-400 text-[10px] dark:fill-neutral-500"
                        >
                            {dayLabel.format(new Date(point.date))}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}
