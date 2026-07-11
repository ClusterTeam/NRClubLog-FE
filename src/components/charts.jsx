/**
 * 경량 차트 컴포넌트 모음 — 외부 라이브러리 없이 SVG/CSS 로만 그립니다.
 *
 * 이 프로젝트는 의존성을 최소로 유지하므로(차트 라이브러리 미사용),
 * 활동 통계 페이지에서 쓰는 막대/도넛/라인 차트를 여기서 직접 구현합니다.
 *
 * 공통 규칙:
 *   - 색상은 stone/orange 테마에 맞춘 PALETTE 를 순환 사용.
 *   - 반응형: SVG 는 viewBox + width:100% 로 컨테이너에 맞춰 늘어남.
 *   - 값 포맷은 호출부에서 unit(단위) 문자열만 넘기면 됩니다.
 */

/** 여러 계열(동아리·분야 등)을 구분하기 위한 색상 팔레트. 앞쪽은 테마색(주황) 계열. */
export const PALETTE = [
  '#c2410c', '#ea580c', '#f97316', '#f59e0b', '#0d9488',
  '#0891b2', '#4f46e5', '#db2777', '#65a30d', '#7c3aed',
  '#dc2626', '#0284c7', '#9333ea', '#16a34a', '#d97706',
]

/** 순위 index → 색상. 팔레트 길이를 넘어가면 순환. */
export function colorAt(i) {
  return PALETTE[i % PALETTE.length]
}

/** 숫자를 천 단위 콤마로. (예: 1234 -> '1,234') */
function fmt(n) {
  return Number(n || 0).toLocaleString('ko-KR')
}

/* ==================================================================== */
/* 카드 래퍼 — 모든 차트를 감싸는 공통 박스                              */
/* ==================================================================== */
export function ChartCard({ title, subtitle, children, right }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-stone-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

/* ==================================================================== */
/* 순위 막대그래프 — 내림차순 가로 막대 (동아리 순위용)                  */
/* ==================================================================== */
/**
 * @param items  [{ label, value }] — 이미 내림차순 정렬되어 들어온다고 가정.
 * @param unit   값 뒤에 붙일 단위 ('건', '명' 등)
 * @param medal  true 면 1~3위에 금·은·동 배지 색.
 */
export function RankBarChart({ items, unit = '', medal = true }) {
  if (!items || items.length === 0) return <EmptyChart />
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <ol className="space-y-3">
      {items.map((it, idx) => {
        const pct = (it.value / max) * 100
        const color = medal ? medalColor(idx) : colorAt(idx)
        return (
          <li key={it.label} className="flex items-center gap-3">
            <RankBadge rank={idx + 1} medal={medal} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-stone-800">
                  {it.label}
                </span>
                <span className="shrink-0 text-sm font-semibold text-stone-900">
                  {fmt(it.value)}
                  <span className="ml-0.5 text-xs font-normal text-stone-500">{unit}</span>
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function medalColor(idx) {
  return ['#d97706', '#78716c', '#b45309'][idx] || '#f97316'
}

function RankBadge({ rank, medal }) {
  const isMedal = medal && rank <= 3
  const bg = isMedal ? medalColor(rank - 1) : '#e7e5e4'
  const fg = isMedal ? '#ffffff' : '#57534e'
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {rank}
    </span>
  )
}

/* ==================================================================== */
/* 도넛(파이형) 그래프 — 비율 표현                                       */
/* ==================================================================== */
/**
 * @param slices       [{ label, value }] — 색상은 자동 배정.
 * @param unit         값 단위
 * @param centerTitle  도넛 가운데 위쪽 작은 글씨 (예: '총 활동')
 */
export function DonutChart({ slices, unit = '', centerTitle = '합계' }) {
  const data = (slices || []).filter((s) => s.value > 0)
  const total = data.reduce((a, s) => a + s.value, 0)
  if (total === 0) return <EmptyChart />

  const cx = 100
  const cy = 100
  const rO = 92
  const rI = 58

  // 누적 각도로 슬라이스 계산
  let acc = 0
  const arcs = data.map((s, i) => {
    const frac = s.value / total
    const a0 = acc * 360
    acc += frac
    const a1 = acc * 360
    return { ...s, i, frac, a0, a1, color: colorAt(i) }
  })

  const onlyOne = arcs.length === 1

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg viewBox="0 0 200 200" className="h-52 w-52 shrink-0">
        {onlyOne ? (
          // 슬라이스가 하나뿐이면 각도 arc 가 degenerate → 링(원)으로 그림
          <circle
            cx={cx}
            cy={cy}
            r={(rO + rI) / 2}
            fill="none"
            stroke={arcs[0].color}
            strokeWidth={rO - rI}
          />
        ) : (
          arcs.map((a) => (
            <path key={a.i} d={donutSlice(cx, cy, rO, rI, a.a0, a.a1)} fill={a.color}>
              <title>{`${a.label}: ${fmt(a.value)}${unit} (${(a.frac * 100).toFixed(1)}%)`}</title>
            </path>
          ))
        )}
        {/* 가운데 합계 */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-stone-500" style={{ fontSize: 12 }}>
          {centerTitle}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" className="fill-stone-900" style={{ fontSize: 22, fontWeight: 700 }}>
          {fmt(total)}
        </text>
      </svg>

      {/* 범례 */}
      <ul className="w-full space-y-2">
        {arcs.map((a) => (
          <li key={a.i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: a.color }} />
            <span className="min-w-0 flex-1 truncate text-stone-700">{a.label}</span>
            <span className="shrink-0 font-medium text-stone-900">{fmt(a.value)}{unit}</span>
            <span className="w-12 shrink-0 text-right text-xs text-stone-500">
              {(a.frac * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 도넛 한 조각의 SVG path. a0/a1 은 12시 기준 시계방향 각도(도). */
function donutSlice(cx, cy, rO, rI, a0, a1) {
  const large = a1 - a0 > 180 ? 1 : 0
  const o0 = polar(cx, cy, rO, a0)
  const o1 = polar(cx, cy, rO, a1)
  const i1 = polar(cx, cy, rI, a1)
  const i0 = polar(cx, cy, rI, a0)
  return [
    `M ${o0.x} ${o0.y}`,
    `A ${rO} ${rO} 0 ${large} 1 ${o1.x} ${o1.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rI} ${rI} 0 ${large} 0 ${i0.x} ${i0.y}`,
    'Z',
  ].join(' ')
}

function polar(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/* ==================================================================== */
/* 라인 차트 — 월별 추이 등 시계열 표현                                  */
/* ==================================================================== */
/**
 * @param points  [{ label, value }] — x축 순서대로.
 * @param unit    값 단위
 */
export function LineChart({ points, unit = '' }) {
  if (!points || points.length === 0) return <EmptyChart />

  const W = 620
  const H = 260
  const padL = 44
  const padR = 16
  const padT = 16
  const padB = 34
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const max = Math.max(...points.map((p) => p.value), 1)
  // y축 눈금을 깔끔하게 (4단계)
  const yTicks = niceTicks(max, 4)
  const yMax = yTicks[yTicks.length - 1]

  const n = points.length
  const x = (i) => padL + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
  const y = (v) => padT + innerH - (v / yMax) * innerH

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ')
  const areaPath =
    `${linePath} L ${x(n - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 300 }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* y축 그리드 + 라벨 */}
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} stroke="#f5f5f4" strokeWidth="1" />
          <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="fill-stone-400" style={{ fontSize: 11 }}>
            {fmt(t)}
          </text>
        </g>
      ))}

      {/* 영역 + 라인 */}
      <path d={areaPath} fill="url(#areaFill)" />
      <path d={linePath} fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* 데이터 점 + x축 라벨 */}
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.value)} r="3.5" fill="#ffffff" stroke="#ea580c" strokeWidth="2">
            <title>{`${p.label}: ${fmt(p.value)}${unit}`}</title>
          </circle>
          <text x={x(i)} y={H - 12} textAnchor="middle" className="fill-stone-500" style={{ fontSize: 11 }}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** 0..max 를 사람이 읽기 좋은 눈금 배열로. (step 개 구간) */
function niceTicks(max, step) {
  const rough = max / step
  const mag = Math.pow(10, Math.floor(Math.log10(rough || 1)))
  const norm = rough / mag
  const niceStep = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
  const ticks = []
  for (let v = 0; v <= max + niceStep - 0.0001; v += niceStep) ticks.push(Math.round(v))
  return ticks
}

/* ==================================================================== */
/* 세로 막대그래프 — 월별 등 소수 항목 비교                              */
/* ==================================================================== */
/**
 * @param bars  [{ label, value }]
 * @param unit  값 단위
 */
export function ColumnChart({ bars, unit = '' }) {
  if (!bars || bars.length === 0) return <EmptyChart />
  const max = Math.max(...bars.map((b) => b.value), 1)
  const topIdx = bars.reduce((best, b, i, arr) => (b.value > arr[best].value ? i : best), 0)

  return (
    <div className="flex h-56 items-end gap-1.5 sm:gap-2">
      {bars.map((b, i) => {
        const pct = (b.value / max) * 100
        const isTop = i === topIdx && b.value > 0
        return (
          <div key={b.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium text-stone-500 sm:text-xs">
              {b.value > 0 ? fmt(b.value) : ''}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md transition-all duration-700 ease-out"
                style={{
                  height: `${Math.max(pct, b.value > 0 ? 2 : 0)}%`,
                  backgroundColor: isTop ? '#c2410c' : '#fdba74',
                }}
                title={`${b.label}: ${fmt(b.value)}${unit}`}
              />
            </div>
            <span className="truncate text-[10px] text-stone-500 sm:text-xs">{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ==================================================================== */
export function EmptyChart({ message = '해당 기간에 표시할 데이터가 없습니다.' }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-stone-200 text-sm text-stone-400">
      {message}
    </div>
  )
}
