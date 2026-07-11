import { Routes, Route, Link } from 'react-router-dom'

import RequireAuth from './components/RequireAuth'
import RequireSuperAuth from './components/RequireSuperAuth'
import { useDocumentTitle } from './hooks/useDocumentTitle'

// 기관 페이지들
import MainPage from './pages/MainPage'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ClubLog from './pages/admin/ClubLog'
import ClubList from './pages/admin/ClubList'
import Statistics from './pages/admin/Statistics'

// 슈퍼 페이지들
import SuperLogin from './pages/super/Login'
import SuperDashboard from './pages/super/Dashboard'
import SuperPlaces from './pages/super/Places'

/*
 * 라우터 — 멀티테넌트.
 *
 * 기관별 (slug 기반):
 *   /:slug/clublog                   일지 작성 페이지
 *   /:slug/setting                   기관 관리자 로그인
 *   /:slug/setting/main              대시보드
 *   /:slug/setting/club_log          활동 이력 관리
 *   /:slug/setting/club_list         동아리 일람
 *   /:slug/setting/stats             동아리 활동 통계
 *
 * 슈퍼 관리자:
 *   /super/setting                   슈퍼 로그인 (다음 턴에 페이지 작성)
 *   /super/setting/main              슈퍼 대시보드
 *   /super/setting/places            기관 CRUD
 *
 * 그 외 경로 -> NotFound (안내 메시지).
 */
export default function App() {
  return (
    <Routes>
      {/* 기관 공개 + 로그인 */}
      <Route path="/:slug/clublog" element={<MainPage />} />
      <Route path="/:slug/setting" element={<Login />} />

      {/* 기관 관리자 보호 라우트 */}
      <Route element={<RequireAuth />}>
        <Route path="/:slug/setting/main" element={<Dashboard />} />
        <Route path="/:slug/setting/club_log" element={<ClubLog />} />
        <Route path="/:slug/setting/club_list" element={<ClubList />} />
        <Route path="/:slug/setting/stats" element={<Statistics />} />
      </Route>

      {/* 슈퍼 관리자 */}
      <Route path="/super/setting" element={<SuperLogin />} />
      <Route element={<RequireSuperAuth />}>
        <Route path="/super/setting/main" element={<SuperDashboard />} />
        <Route path="/super/setting/places" element={<SuperPlaces />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  useDocumentTitle('페이지를 찾을 수 없습니다')
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <h1 className="text-3xl font-bold text-stone-900">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-4 text-stone-600">
        기관별 활동일지에 접근하려면 안내받은 URL 을 통해 들어와 주세요.
        <br />
        (예시:{' '}
        <code className="rounded bg-stone-200 px-1.5 py-0.5 text-sm">
          /nareum/clublog
        </code>
        )
      </p>
    </div>
  )
}