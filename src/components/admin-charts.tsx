import { formatPrice } from "@/lib/format";

type SalesPoint = { key?: string; label: string; amount: number };

/** Compact IDR for axis labels: 1.2M, 340k. */
function compact(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return String(amount);
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 16, bottom: 30, left: 48 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((d) => d.amount), 1);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const base = padding.top + innerH;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerH - (d.amount / max) * innerH,
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${base} L ${points[0].x.toFixed(1)} ${base} Z`
      : "";

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="group"
        aria-label={`Revenue over the last ${data.length} days, ${formatPrice(total)} in total. A table of the values follows.`}
      >
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-caramel)" }} stopOpacity="0.25" />
            <stop offset="100%" style={{ stopColor: "var(--color-caramel)" }} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => {
          const y = padding.top + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="stroke-latte"
                strokeDasharray={t === 0 ? undefined : "3 3"}
              />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="10" className="fill-mocha">
                {t === 0 ? "0" : compact(Math.round(max * t))}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#salesFill)" />}
        {linePath && <path d={linePath} fill="none" strokeWidth="2" className="stroke-caramel-dark" />}

        {points.map((p, i) => {
          const tipW = 112;
          const tipX = Math.min(Math.max(p.x - tipW / 2, 4), width - tipW - 4);
          const tipY = p.y > padding.top + 44 ? p.y - 46 : p.y + 10;
          return (
            <g
              key={p.key ?? i}
              tabIndex={0}
              aria-label={`${p.label}: ${formatPrice(p.amount)}`}
              role="img" className="group outline-none"
            >
              <title>{`${p.label}: ${formatPrice(p.amount)}`}</title>
              {/* Large invisible target so the point is easy to hover. */}
              <rect x={p.x - stepX / 2} y={padding.top} width={stepX} height={innerH} fill="transparent" />
              <circle cx={p.x} cy={p.y} r="3.5" className="fill-coffee group-hover:fill-caramel-dark group-focus-visible:stroke-caramel-dark" strokeWidth="2" />
              {i % 2 === 0 && (
                <text x={p.x} y={height - 9} textAnchor="middle" fontSize="10" className="fill-mocha">
                  {p.label}
                </text>
              )}
              <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <rect x={tipX} y={tipY} width={tipW} height="36" rx="8" className="fill-espresso" />
                <text x={tipX + tipW / 2} y={tipY + 15} textAnchor="middle" fontSize="10" className="fill-latte">
                  {p.label}
                </text>
                <text x={tipX + tipW / 2} y={tipY + 29} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-white">
                  {formatPrice(p.amount)}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      <figcaption className="sr-only">
        <table>
          <caption>Revenue per day, last {data.length} days</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Revenue (IDR)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.key ?? i}>
                <th scope="row">{d.label}</th>
                <td>{formatPrice(d.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}

type ProductBar = { name: string; units: number };

export function TopProductsChart({ data }: { data: ProductBar[] }) {
  const max = Math.max(...data.map((d) => d.units), 1);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-mocha">
        No sales yet. Top products will appear here.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {data.map((d) => {
        const pct = (d.units / max) * 100;
        const narrow = pct < 22;
        return (
          <li key={d.name} aria-label={`${d.name}: ${d.units} sold`} className="grid gap-1">
            <span className="truncate text-sm text-espresso" title={d.name}>
              {d.name}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-foam">
                <div
                  className="flex h-full items-center justify-end rounded-full bg-caramel-dark px-2 text-xs font-semibold text-white"
                  style={{ width: `${Math.max(pct, 4)}%` }}
                >
                  {!narrow && d.units}
                </div>
              </div>
              {narrow && <span className="text-xs font-semibold tabular-nums text-espresso">{d.units}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
