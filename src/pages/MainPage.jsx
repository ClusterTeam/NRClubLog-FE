import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { placeApi } from '../api/places'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/**
 * 일지 작성 페이지 (공개 — 로그인 불필요).
 *
 * URL: /:slug/clublog
 *
 * 흐름:
 *   1. 마운트 시 기관 정보(full_name) + 동아리 목록을 병렬로 가져옴
 *   2. 사용자가 폼 작성 -> placeApi.createLog(slug, data)
 *   3. 성공 시 저장완료 모달 -> '다시 작성' 또는 '닫기'
 */
const INITIAL_COUNTS = {
  elem_m: 0, elem_f: 0,
  mid_m: 0, mid_f: 0,
  high_m: 0, high_f: 0,
  univ_m: 0, univ_f: 0,
}

function todayString() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function MainPage() {
  const { slug } = useParams()
  const [info, setInfo] = useState(null)
  useDocumentTitle(info ? `${info.short_name} 동아리 활동일지` : null)
  const [clubs, setClubs] = useState([])
  const [clubDict, setClubDict] = useState({})
  const [loadError, setLoadError] = useState('')

  // 폼 필드
  const [clubName, setClubName] = useState('')
  const [category, setCategory] = useState('')
  const [activityDate, setActivityDate] = useState(todayString())
  const [startTime, setStartTime] = useState('14:00')
  const [endTime, setEndTime] = useState('16:00')
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [participants, setParticipants] = useState('')
  const [counts, setCounts] = useState(INITIAL_COUNTS)

  // 제출 상태
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  useEffect(() => {
    Promise.all([placeApi.getInfo(slug), placeApi.getClubs(slug)])
      .then(([infoData, clubsData]) => {
        setInfo(infoData)
        setClubs(clubsData.clubs || [])
        setClubDict(clubsData.club_dict || {})
      })
      .catch((err) => setLoadError(err.message))
  }, [slug])

  function handleClubChange(name) {
    setClubName(name)
    setCategory(clubDict[name] || '')
  }

  function handleCountChange(key, val) {
    const n = parseInt(val, 10) || 0
    setCounts((prev) => ({ ...prev, [key]: Math.max(0, n) }))
  }

  function resetForm() {
    setClubName('')
    setCategory('')
    setContent('')
    setAuthor('')
    setParticipants('')
    setCounts(INITIAL_COUNTS)
    setError('')
    setModal(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const totalCount = Object.values(counts).reduce((s, v) => s + v, 0)
    if (totalCount === 0) {
      setError('총 인원수가 0명일 수 없습니다.')
      return
    }
    if (!clubName) {
      setError('동아리를 선택해주세요.')
      return
    }

    const [year, month, day] = activityDate.split('-').map(Number)
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)

    const payload = {
      category,
      club_name: clubName,
      activity_year: year,
      activity_month: month,
      activity_day: day,
      start_hour: sh, start_minute: sm,
      end_hour: eh, end_minute: em,
      participants,
      author,
      activity_content: content,
      element_man: counts.elem_m, element_woman: counts.elem_f,
      middle_man: counts.mid_m, middle_woman: counts.mid_f,
      high_man: counts.high_m, high_woman: counts.high_f,
      univ_man: counts.univ_m, univ_woman: counts.univ_f,
    }

    setSubmitting(true)
    try {
      const response = await placeApi.createLog(slug, payload)
      setModal({ ...response.result, message: response.message })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-center">
        <p className="text-stone-700">{loadError}</p>
      </div>
    )
  }
  if (!info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-500">불러오는 중…</p>
      </div>
    )
  }

  const totalCount = Object.values(counts).reduce((s, v) => s + v, 0)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 상단 — 풀네임으로 페이지 타이틀 */}
      <header className="flex items-center gap-4 bg-orange-700 px-6 py-6 text-white sm:px-10">
        <h1 className="min-w-0 text-xl font-bold sm:text-2xl">
          {info.full_name} 동아리 활동일지
        </h1>
        <Link
          to={`/${slug}/setting`}
          className="shrink-0 rounded-md border border-white/60 px-3 py-2 text-sm font-medium transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          관리자
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-stone-200 bg-white p-6 shadow-sm"
        >
          <Field label="동아리 명" required>
            <select
              value={clubName}
              onChange={(e) => handleClubChange(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">선택하세요</option>
              {clubs.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="동아리 분야">
            <input
              type="text"
              value={category}
              readOnly
              placeholder="동아리 선택 시 자동 표시"
              className={`${inputClass} bg-stone-100`}
            />
          </Field>

          <Field label="활동 일자" required>
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              required
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="시작 시간" required>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={inputClass}
              />
            </Field>
            <Field label="종료 시간" required>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="활동 내용" required>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              className={inputClass}
            />
          </Field>

          <Field label="작성자" required>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className={inputClass}
            />
          </Field>

          <Field label="참가자">
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="쉼표(,)로 구분 (루미, 미라, 조이)"
              className={inputClass}
            />
          </Field>

          <fieldset className="rounded-md border border-stone-200 p-4">
            <legend className="px-1 text-sm font-medium text-stone-700">
              연령별 참가자 수 (총{' '}
              <span className="font-bold text-orange-700">{totalCount}</span>명)
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <CountInput label="초등 남" value={counts.elem_m}
                onChange={(v) => handleCountChange('elem_m', v)} />
              <CountInput label="초등 여" value={counts.elem_f}
                onChange={(v) => handleCountChange('elem_f', v)} />
              <CountInput label="중등 남" value={counts.mid_m}
                onChange={(v) => handleCountChange('mid_m', v)} />
              <CountInput label="중등 여" value={counts.mid_f}
                onChange={(v) => handleCountChange('mid_f', v)} />
              <CountInput label="고등 남" value={counts.high_m}
                onChange={(v) => handleCountChange('high_m', v)} />
              <CountInput label="고등 여" value={counts.high_f}
                onChange={(v) => handleCountChange('high_f', v)} />
              <CountInput label="후기 남" value={counts.univ_m}
                onChange={(v) => handleCountChange('univ_m', v)} />
              <CountInput label="후기 여" value={counts.univ_f}
                onChange={(v) => handleCountChange('univ_f', v)} />
            </div>
          </fieldset>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-orange-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {submitting ? '저장 중…' : '작성 완료'}
          </button>
        </form>
      </main>

      {modal && (
        <SuccessModal
          modal={modal}
          onContinue={resetForm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

/* ---------- 보조 컴포넌트 ---------- */

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      {children}
    </label>
  )
}

function CountInput({ label, value, onChange }) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-stone-600">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-stone-900 focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
      />
    </label>
  )
}

function SuccessModal({ modal, onContinue, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        
        {/* Grid 레이아웃 적용: 좌측 텍스트(1fr), 우측 이미지(auto) */}
        <div className="grid grid-cols-[1fr_auto] items-start gap-4">
          
          {/* 왼쪽 텍스트 영역 */}
          <div>
            <h2 className="text-xl font-bold text-orange-700">저장 완료!</h2>
            <div className="mt-4 text-sm">
              <p className="text-stone-700">
                <span className="text-stone-500">[{modal.category}]</span>{' '}
                <span className="font-semibold">{modal.club}</span> 동아리 활동
              </p>
              <p className="mt-1 text-stone-600">
                {modal.date} · {modal.people}명
              </p>
              <p className="mt-4 text-stone-600">
                위 정보가 정상적으로 저장되었습니다.
              </p>
            </div>
          </div>

          {/* 오른쪽 도장 이미지 영역 */}
          <div className="flex items-center justify-center pt-2">
            <img
              src="/img/center_goodjob.png"
              alt="참 잘했어요 도장"
              className="h-28 w-28 rotate-[30deg] object-contain opacity-90"
            />
          </div>
          
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 rounded-md bg-orange-700 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-800"
          >
            새로작성
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
          >
            닫기
          </button>
        </div>
        
      </div>
    </div>
  )
}

const inputClass =
  'block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600'
