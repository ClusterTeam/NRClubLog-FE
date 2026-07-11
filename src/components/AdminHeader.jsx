import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { placeApi } from '../api/places'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/**
 * 기관 관리자 전용 헤더 — 네비 + 로그아웃.
 *
 * URL 의 :slug 를 자동으로 읽어 모든 링크에 적용.
 * 현재 페이지는 NavLink 의 isActive 로 강조됨.
 */
export default function AdminHeader() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  // 기관 정보 — 페이지 title 에 short_name 사용. 헤더 표시는 그대로 slug.
  const [info, setInfo] = useState(null)
  useEffect(() => {
    placeApi
      .getInfo(slug)
      .then(setInfo)
      .catch(() => {
        // 잘못된 slug 라면 RequireAuth 가 어차피 튕겨낼 거니까 무시
      })
  }, [slug])
  useDocumentTitle(info ? `${info.short_name} 동아리 관리자페이지` : null)

  // slug 기반 링크들 — 컴포넌트마다 재계산 (slug 가 바뀌면 자동 반영)
  const navItems = [
    { to: `/${slug}/setting/main`, label: '대시보드' },
    { to: `/${slug}/setting/club_log`, label: '동아리 활동 이력' },
    { to: `/${slug}/setting/club_list`, label: '동아리 일람' },
    { to: `/${slug}/setting/stats`, label: '활동 통계' },
  ]
  const clubLogUrl = `/${slug}/clublog`

  async function handleLogout() {
    try {
      await placeApi.logout(slug)
    } catch {
      // 로그아웃 호출 실패해도 어차피 로그인 페이지로 보낼 거니까 무시
    }
    navigate(`/${slug}/setting`, { replace: true })
  }

  return (
    <header className="border-b border-stone-300 bg-white px-6 py-3 sm:px-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="whitespace-nowrap text-lg font-bold">
          <NavLink
            to={`/${slug}/setting/main`}
            className="text-stone-900 hover:text-stone-600"
          >
            {info?.short_name || '(불러오는 중)'} 활동일지 — 관리자{' '}
            <span className="font-mono text-xs text-stone-500">[{slug}]</span>
          </NavLink>
        </h1>

        <button
          type="button"
          className="text-2xl lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="메뉴 열기"
          aria-expanded={mobileOpen}
        >
          ☰
        </button>

        {/* 데스크톱 네비 */}
        <nav className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-6 text-sm">
            <li>
              <a
                href={clubLogUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-stone-700 hover:text-orange-700"
              >
                일지 작성 페이지 ↗
              </a>
            </li>
            {navItems.map((item) => (
              <li key={item.to}>
                {/* end 옵션 — /setting/main 이 /setting/main/sub 의 prefix 라
                    중첩 라우트에서 잘못된 active 상태가 되는 것을 방지 */}
                <NavLink to={item.to} end className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-stone-300 px-3 py-1 text-stone-600 hover:bg-stone-100"
              >
                로그아웃
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* 모바일 네비 */}
      {mobileOpen && (
        <nav className="mt-3 lg:hidden">
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <a
                href={clubLogUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="block px-2 py-2 text-stone-700"
                onClick={() => setMobileOpen(false)}
              >
                일지 작성 페이지 ↗
              </a>
            </li>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `block px-2 py-2 ${
                      isActive ? 'font-semibold text-orange-700' : 'text-stone-700'
                    }`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-left text-stone-600 hover:bg-stone-100"
              >
                로그아웃
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}

function navLinkClass({ isActive }) {
  return isActive
    ? 'font-semibold text-orange-700'
    : 'text-stone-700 hover:text-orange-700'
}