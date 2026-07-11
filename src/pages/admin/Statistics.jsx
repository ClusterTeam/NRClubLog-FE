import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { placeApi } from '../../api/places'
import AdminHeader from '../../components/AdminHeader'
import {
  ChartCard,
  RankBarChart,
  DonutChart,
  LineChart,
  ColumnChart,
  EmptyChart,
} from '../../components/charts'

/**
 * 동아리 활동 통계 페이지 — 활동 데이터를 시각화해 동아리별 활동 의욕을 북돋습니다.
 *
 * 모든 집계는 프론트에서 처리합니다. getLogs 가 전체 로그(동아리·분야·인원·연령성별)를
 * 한 번에 내려주므로 별도 통계 API 없이도 다양한 분류/표현을 그릴 수 있습니다.
 *
 * 분류(탭):
 *   1) 월별 동아리 순위   — 랭킹 막대 + 비율 도넛 + 1위 하이라이트
 *   2) 연간 동아리 순위   — 랭킹 막대 + 비율 도넛 + 요약 지표
 *   3) 월별 활동 추이     — 라인 차트 + 세로 막대 + 최다/평균 지표
 *   4) 분야별 활동 분포   — 도넛 + 분야 랭킹 막대
 *   5) 참여자 구성        — 연령대·성별 막대 + 성별 도넛 + 연령대 도넛
 *
 * 지표(metric): '건수'(로그 수) / '참여 인원'(total_count 합) 을 토글.
 */
export default function Statistics() {
  const { slug } = useParams()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [info, setInfo] = useState(null)
  useEffect(() => {
    placeApi.getInfo(slug).then(setInfo).catch(() => {})
  }, [slug])

  useEffect(() => {
    setLoading(true)
    placeApi
      .getLogs(slug)
      .then((data) => setLogs((data.logs || []).map(normalizeLog)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  // 데이터에 존재하는 연도 목록 (내림차순). 없으면 올해.
  const years = useMemo(() => {
    const set = new Set(logs.map((l) => l.year).filter(Boolean))
    if (set.size === 0) set.add(new Date().getFullYear())
    return [...set].sort((a, b) => b - a)
  }, [logs])

  const [tab, setTab] = useState('monthly')
  const [year, setYear] = useState(null)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [metric, setMetric] = useState('count') // 'count' | 'people'

  // 연도 목록이 처음 잡히면 최신 연도로 초기화.
  useEffect(() => {
    if (year == null && years.length) setYear(years[0])
  }, [years, year])

  const unit = metric === 'people' ? '명' : '건'
  const metricLabel = metric === 'people' ? '참여 인원' : '활동 건수'

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminHeader />

      <main className="px-6 py-8 sm:px-10">
        <h1 className="text-2xl font-bold text-stone-900">동아리 활동 통계</h1>
        <p className="mt-2 text-sm text-stone-600">
          {info?.full_name || '기관'}의 활동 데이터를 시각적으로 살펴보고 동아리별 활동 현황을 비교할 수 있습니다.
        </p>

        {error && (
          <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 분류(탭) */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-orange-700 text-white shadow-sm'
                  : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 조회 조건 */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <Select label="연도" value={year ?? ''} onChange={(v) => setYear(Number(v))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </Select>

          {tab === 'monthly' && (
            <Select label="월" value={month} onChange={(v) => setMonth(Number(v))}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </Select>
          )}

          {tab !== 'demographics' && (
            <div className="flex flex-col gap-1 text-xs text-stone-500">
              지표
              <div className="inline-flex overflow-hidden rounded-md border border-stone-300">
                <MetricButton active={metric === 'count'} onClick={() => setMetric('count')}>
                  활동 건수
                </MetricButton>
                <MetricButton active={metric === 'people'} onClick={() => setMetric('people')}>
                  참여 인원
                </MetricButton>
              </div>
            </div>
          )}

          <span className="ml-auto text-sm text-stone-500">
            전체 <strong className="text-stone-800">{logs.length}</strong>건 수집됨
          </span>
        </div>

        {loading || year == null ? (
          <p className="mt-10 text-stone-500">불러오는 중…</p>
        ) : (
          <div className="mt-6">
            {tab === 'monthly' && (
              <MonthlyRanking logs={logs} year={year} month={month} metric={metric} unit={unit} metricLabel={metricLabel} />
            )}
            {tab === 'yearly' && (
              <YearlyRanking logs={logs} year={year} metric={metric} unit={unit} metricLabel={metricLabel} />
            )}
            {tab === 'trend' && (
              <MonthlyTrend logs={logs} year={year} metric={metric} unit={unit} metricLabel={metricLabel} />
            )}
            {tab === 'category' && (
              <CategoryDistribution logs={logs} year={year} metric={metric} unit={unit} metricLabel={metricLabel} />
            )}
            {tab === 'demographics' && (
              <Demographics logs={logs} year={year} />
            )}
          </div>
        )}
      </main>
    </div>
  )
}

const TABS = [
  { key: 'monthly', label: '월별 동아리 순위' },
  { key: 'yearly', label: '연간 동아리 순위' },
  { key: 'trend', label: '월별 활동 추이' },
  { key: 'category', label: '분야별 활동 분포' },
  { key: 'demographics', label: '참여자 구성' },
]
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/* ==================================================================== */
/* 분류 1) 월별 동아리 순위                                              */
/* ==================================================================== */
function MonthlyRanking({ logs, year, month, metric, unit, metricLabel }) {
  const scoped = useMemo(
    () => logs.filter((l) => l.year === year && l.month === month),
    [logs, year, month]
  )
  const ranking = useMemo(() => rankByClub(scoped, metric), [scoped, metric])

  if (ranking.length === 0) {
    return <EmptyChart message={`${year}년 ${month}월에는 활동 기록이 없습니다.`} />
  }

  const top = ranking[0]
  const totalValue = ranking.reduce((a, r) => a + r.value, 0)

  return (
    <div className="space-y-6">
      {/* 1위 하이라이트 + 요약 지표 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Highlight
          badge="🏆 이달의 최다 활동 동아리"
          title={top.label}
          value={`${top.value.toLocaleString('ko-KR')}${unit}`}
          sub={`전체의 ${((top.value / totalValue) * 100).toFixed(1)}% 차지`}
        />
        <MiniStat label={`활동 동아리 수`} value={`${ranking.length}개`} />
        <MiniStat label={`${month}월 총 ${metricLabel}`} value={`${totalValue.toLocaleString('ko-KR')}${unit}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title={`${year}년 ${month}월 동아리 활동 순위`}
          subtitle={`${metricLabel} 내림차순`}
        >
          <RankBarChart items={ranking} unit={unit} />
        </ChartCard>

        <ChartCard
          title="전체 활동 중 동아리별 비율"
          subtitle="상위 8개 + 그 외 묶음"
        >
          <DonutChart slices={topNWithEtc(ranking, 8)} unit={unit} centerTitle={`총 ${unit}`} />
        </ChartCard>
      </div>
    </div>
  )
}

/* ==================================================================== */
/* 분류 2) 연간 동아리 순위                                              */
/* ==================================================================== */
function YearlyRanking({ logs, year, metric, unit, metricLabel }) {
  const scoped = useMemo(() => logs.filter((l) => l.year === year), [logs, year])
  const ranking = useMemo(() => rankByClub(scoped, metric), [scoped, metric])

  if (ranking.length === 0) {
    return <EmptyChart message={`${year}년에는 활동 기록이 없습니다.`} />
  }

  const top = ranking[0]
  const totalValue = ranking.reduce((a, r) => a + r.value, 0)
  const activeMonths = new Set(scoped.map((l) => l.month)).size

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Highlight
          badge="🥇 올해의 최다 활동 동아리"
          title={top.label}
          value={`${top.value.toLocaleString('ko-KR')}${unit}`}
          sub={`전체의 ${((top.value / totalValue) * 100).toFixed(1)}% 차지`}
        />
        <MiniStat label="활동 동아리 수" value={`${ranking.length}개`} />
        <MiniStat label={`연간 총 ${metricLabel}`} value={`${totalValue.toLocaleString('ko-KR')}${unit}`} sub={`${activeMonths}개월간 활동`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title={`${year}년 연간 동아리 활동 순위`} subtitle={`${metricLabel} 내림차순 · 상위 15개`}>
          <RankBarChart items={ranking.slice(0, 15)} unit={unit} />
        </ChartCard>
        <ChartCard title="연간 활동 비율" subtitle="상위 8개 + 그 외 묶음">
          <DonutChart slices={topNWithEtc(ranking, 8)} unit={unit} centerTitle={`총 ${unit}`} />
        </ChartCard>
      </div>
    </div>
  )
}

/* ==================================================================== */
/* 분류 3) 월별 활동 추이                                                */
/* ==================================================================== */
function MonthlyTrend({ logs, year, metric, unit, metricLabel }) {
  const scoped = useMemo(() => logs.filter((l) => l.year === year), [logs, year])

  const series = useMemo(() => {
    const acc = MONTHS.map(() => 0)
    for (const l of scoped) acc[l.month - 1] += valueOf(l, metric)
    return MONTHS.map((m) => ({ label: `${m}월`, value: acc[m - 1] }))
  }, [scoped, metric])

  if (scoped.length === 0) {
    return <EmptyChart message={`${year}년에는 활동 기록이 없습니다.`} />
  }

  const total = series.reduce((a, s) => a + s.value, 0)
  const peak = series.reduce((best, s) => (s.value > best.value ? s : best), series[0])
  const activeMonths = series.filter((s) => s.value > 0).length
  const avg = activeMonths ? total / activeMonths : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat label={`연간 총 ${metricLabel}`} value={`${total.toLocaleString('ko-KR')}${unit}`} />
        <Highlight badge="📈 가장 활발했던 달" title={peak.label} value={`${peak.value.toLocaleString('ko-KR')}${unit}`} />
        <MiniStat label="활동한 달 평균" value={`${avg.toFixed(1)}${unit}`} sub={`${activeMonths}개월 기준`} />
      </div>

      <ChartCard title={`${year}년 월별 활동 추이`} subtitle={`${metricLabel} 기준`}>
        <LineChart points={series} unit={unit} />
      </ChartCard>

      <ChartCard title={`${year}년 월별 활동량 비교`} subtitle="가장 많은 달을 진하게 표시">
        <ColumnChart bars={series} unit={unit} />
      </ChartCard>
    </div>
  )
}

/* ==================================================================== */
/* 분류 4) 분야별 활동 분포                                              */
/* ==================================================================== */
function CategoryDistribution({ logs, year, metric, unit, metricLabel }) {
  const scoped = useMemo(() => logs.filter((l) => l.year === year), [logs, year])
  const ranking = useMemo(() => rankByKey(scoped, (l) => l.category || '(미분류)', metric), [scoped, metric])

  if (ranking.length === 0) {
    return <EmptyChart message={`${year}년에는 활동 기록이 없습니다.`} />
  }

  const top = ranking[0]
  const totalValue = ranking.reduce((a, r) => a + r.value, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Highlight
          badge="🔥 가장 활발한 분야"
          title={top.label}
          value={`${top.value.toLocaleString('ko-KR')}${unit}`}
          sub={`전체의 ${((top.value / totalValue) * 100).toFixed(1)}% 차지`}
        />
        <MiniStat label="활동 분야 수" value={`${ranking.length}개`} />
        <MiniStat label={`연간 총 ${metricLabel}`} value={`${totalValue.toLocaleString('ko-KR')}${unit}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title={`${year}년 분야별 활동 비율`} subtitle={`${metricLabel} 기준`}>
          <DonutChart slices={ranking} unit={unit} centerTitle={`총 ${unit}`} />
        </ChartCard>
        <ChartCard title="분야별 활동 순위" subtitle={`${metricLabel} 내림차순`}>
          <RankBarChart items={ranking} unit={unit} medal={false} />
        </ChartCard>
      </div>
    </div>
  )
}

/* ==================================================================== */
/* 분류 5) 참여자 구성 (연령대·성별)                                     */
/* ==================================================================== */
const AGE_GENDER = [
  { key: 'elem_m', band: '초등', gender: 'm', label: '초등 남' },
  { key: 'elem_f', band: '초등', gender: 'f', label: '초등 여' },
  { key: 'mid_m', band: '중등', gender: 'm', label: '중등 남' },
  { key: 'mid_f', band: '중등', gender: 'f', label: '중등 여' },
  { key: 'high_m', band: '고등', gender: 'm', label: '고등 남' },
  { key: 'high_f', band: '고등', gender: 'f', label: '고등 여' },
  { key: 'univ_m', band: '후기청소년', gender: 'm', label: '후기 남' },
  { key: 'univ_f', band: '후기청소년', gender: 'f', label: '후기 여' },
]

function Demographics({ logs, year }) {
  const scoped = useMemo(() => logs.filter((l) => l.year === year), [logs, year])

  const sums = useMemo(() => {
    const s = {}
    for (const g of AGE_GENDER) s[g.key] = 0
    for (const l of scoped) for (const g of AGE_GENDER) s[g.key] += Number(l[g.key] || 0)
    return s
  }, [scoped])

  const total = Object.values(sums).reduce((a, v) => a + v, 0)
  if (total === 0) {
    return <EmptyChart message={`${year}년에는 참여자 기록이 없습니다.`} />
  }

  // 8개 연령·성별 그룹 (내림차순 막대)
  const groups = AGE_GENDER
    .map((g) => ({ label: g.label, value: sums[g.key] }))
    .sort((a, b) => b.value - a.value)

  // 성별 도넛
  const male = AGE_GENDER.filter((g) => g.gender === 'm').reduce((a, g) => a + sums[g.key], 0)
  const female = total - male
  const genderSlices = [
    { label: '남성', value: male },
    { label: '여성', value: female },
  ]

  // 연령대 도넛
  const bands = ['초등', '중등', '고등', '후기청소년']
  const bandSlices = bands.map((band) => ({
    label: band,
    value: AGE_GENDER.filter((g) => g.band === band).reduce((a, g) => a + sums[g.key], 0),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MiniStat label={`${year}년 누적 참여 인원`} value={`${total.toLocaleString('ko-KR')}명`} />
        <MiniStat label="남성 비율" value={`${((male / total) * 100).toFixed(1)}%`} sub={`${male.toLocaleString('ko-KR')}명`} />
        <MiniStat label="여성 비율" value={`${((female / total) * 100).toFixed(1)}%`} sub={`${female.toLocaleString('ko-KR')}명`} />
      </div>

      <ChartCard title={`${year}년 연령대·성별 참여 인원`} subtitle="인원 내림차순">
        <RankBarChart items={groups} unit="명" medal={false} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="성별 참여 비율" subtitle="누적 참여 인원 기준">
          <DonutChart slices={genderSlices} unit="명" centerTitle="총 인원" />
        </ChartCard>
        <ChartCard title="연령대별 참여 비율" subtitle="누적 참여 인원 기준">
          <DonutChart slices={bandSlices} unit="명" centerTitle="총 인원" />
        </ChartCard>
      </div>
    </div>
  )
}

/* ==================================================================== */
/* 집계 헬퍼                                                             */
/* ==================================================================== */

/** 로그에 year/month 파생 필드를 붙임. activity_date 는 'YYYY-MM-DD' 를 우선하되 유연 파싱. */
function normalizeLog(log) {
  const nums = String(log.activity_date ?? '').match(/\d+/g)
  let year = null
  let month = null
  if (nums && nums.length >= 2) {
    year = Number(nums[0])
    month = Number(nums[1])
  }
  return { ...log, year, month }
}

/** 로그 한 건의 지표값. metric='people' 이면 참여 인원, 아니면 1(건수). */
function valueOf(log, metric) {
  return metric === 'people' ? Number(log.total_count || 0) : 1
}

/** 동아리명 기준 집계 → [{label, value}] 내림차순. */
function rankByClub(logs, metric) {
  return rankByKey(logs, (l) => l.club_name || '(이름 없음)', metric)
}

/** 임의 key 함수 기준 집계 → [{label, value}] 내림차순. */
function rankByKey(logs, keyFn, metric) {
  const map = new Map()
  for (const l of logs) {
    const k = keyFn(l)
    map.set(k, (map.get(k) || 0) + valueOf(l, metric))
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
}

/** 상위 n개만 남기고 나머지는 '그 외'로 합침 (도넛 가독성용). */
function topNWithEtc(ranking, n) {
  if (ranking.length <= n) return ranking
  const head = ranking.slice(0, n)
  const rest = ranking.slice(n).reduce((a, r) => a + r.value, 0)
  return rest > 0 ? [...head, { label: '그 외', value: rest }] : head
}

/* ==================================================================== */
/* 보조 UI                                                               */
/* ==================================================================== */
function Select({ label, value, onChange, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-stone-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:border-orange-500 focus:outline-none"
      >
        {children}
      </select>
    </label>
  )
}

function MetricButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-orange-700 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'
      }`}
    >
      {children}
    </button>
  )
}

function Highlight({ badge, title, value, sub }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm">
      <p className="text-xs font-medium text-orange-700">{badge}</p>
      <p className="mt-2 truncate text-xl font-bold text-stone-900" title={title}>{title}</p>
      <p className="mt-1 text-2xl font-extrabold text-orange-700">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-500">{sub}</p>}
    </div>
  )
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
    </div>
  )
}
