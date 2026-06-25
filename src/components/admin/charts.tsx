type SalesPoint = { label: string; cents: number };

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const width = 600;
  const height = 200;
  const padding = { top: 16, right: 16, bottom: 28, left: 16 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map((d) => d.cents), 1);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (d.cents / max) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + innerH} L ${points[0].x.toFixed(1)} ${padding.top + innerH} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Revenue over the last 14 days"
    >
      <defs>
        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b87333" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#b87333" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + innerH * t}
          y2={padding.top + innerH * t}
          stroke="#e7d8c9"
          strokeDasharray="3 3"
        />
      ))}

      {areaPath && <path d={areaPath} fill="url(#salesFill)" />}
      {linePath && (
        <path d={linePath} fill="none" stroke="#b87333" strokeWidth="2" />
      )}

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#6b4423" />
          {i % 2 === 0 && (
            <text
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#6b5b4e"
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
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
    <ul className="flex flex-col gap-3">
      {data.map((d) => (
        <li key={d.name} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-espresso">
            {d.name}
          </span>
          <div className="h-6 flex-1 overflow-hidden rounded-full bg-foam">
            <div
              className="flex h-full items-center justify-end rounded-full bg-caramel px-2 text-xs font-semibold text-white"
              style={{ width: `${(d.units / max) * 100}%` }}
            >
              {d.units}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
