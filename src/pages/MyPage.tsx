import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getBookmarks, type Post } from '../api/posts';
import { apiApplicantMe, type ApplicantProfile } from '../api/client';

export default function MyPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'bookmarks' | 'info'>('bookmarks');
  const [items, setItems] = useState<Post[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profile, setProfile] = useState<ApplicantProfile | null | undefined>(
    undefined
  );
  const hasProfile = !!profile; // null = no profile, object = has profile

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (tab !== 'bookmarks') return; // only fetch when bookmarks tab active
    let alive = true;
    setBusy(true);
    setError(null);
    getBookmarks()
      .then((posts) => {
        if (!alive) return;
        setItems(posts);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : '북마크를 불러오지 못했습니다');
        setItems([]);
      })
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [tab]);

  // Load profile when info tab active
  useEffect(() => {
    if (tab !== 'info') return;
    let alive = true;
    setProfileBusy(true);
    apiApplicantMe()
      .then((p) => {
        if (!alive) return;
        setProfile(p); // p=null means no profile
      })
      .catch((e) => {
        if (!alive) return;
        // For non-APPLICANT_002 errors, surface message
        setError(e instanceof Error ? e.message : '프로필을 불러오지 못했습니다');
        setProfile(null);
      })
      .finally(() => alive && setProfileBusy(false));
    return () => {
      alive = false;
    };
  }, [tab]);

  const renderStatus = (p: Post) => {
    const raw = p.employmentEndDate?.trim();
    if (!raw) {
      return <span className="status ongoing">상시모집</span>;
    }
    const date = new Date(raw);
    if (isNaN(date.getTime())) return <span className="status ongoing">상시모집</span>;
    const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return <span className="status closed">마감</span>;
    if (diffDays === 0) return <span className="status ongoing">D-Day</span>;
    return <span className="status ongoing">D-{diffDays}</span>;
  };

  return (
    <div className="container page" style={{ display: 'grid', gap: 32 }}>
      <h1 style={{ margin: 0 }}>마이페이지</h1>
      <div className="tabs-row">
        <div className="tabs">
          <button
            className={`tab-btn${tab === 'bookmarks' ? ' active' : ''}`}
            onClick={() => setTab('bookmarks')}
          >
            관심공고
          </button>
          <button
            className={`tab-btn${tab === 'info' ? ' active' : ''}`}
            onClick={() => setTab('info')}
          >
            내 정보
          </button>
        </div>
        {tab === 'info' && hasProfile && (
          <button
            className="pill-btn"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/profile/edit')}
          >
            내 프로필 수정
          </button>
        )}
        {tab === 'info' && !hasProfile && (
          <button
            className="pill-btn"
            style={{ marginLeft: 'auto' }}
            onClick={() => navigate('/profile/new')}
          >
            내 프로필 생성
          </button>
        )}
      </div>
      {tab === 'info' ? (
        hasProfile ? (
          <div className="card" style={{ display: 'grid', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>내 프로필</h2>
            {profileBusy ? (
              <div className="muted">불러오는 중...</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {/* Large name without label */}
                {profile?.name && (
                  <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {String(profile.name)}
                  </div>
                )}
                {/* Small email without label */}
                {profile?.email && (
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                    {String(profile.email)}
                  </div>
                )}
                {/* Department(s) with middot separator + enrollYear */}
                {profile?.department && profile?.enrollYear ? (
                  <div style={{ fontSize: 14 }}>
                    {(() => {
                      const depts = String(profile.department)
                        .split(',')
                        .map((d) => d.trim())
                        .filter(Boolean);
                      // First is main major, rest are sub majors with label
                      const formatted = depts.map((dept, idx) => 
                        idx === 0 ? dept : `${dept}(복수전공)`
                      ).join('·');
                      // Format enrollYear: subtract 2000 for 20xx years
                      const year = Number(profile.enrollYear);
                      const displayYear = year >= 2000 ? year - 2000 : year - 1900;
                      return `${formatted} ${displayYear}학번`;
                    })()}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : profileBusy ? (
          <div className="muted">불러오는 중...</div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 36,
              justifyItems: 'center',
              paddingTop: 40,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              아직 프로필이 등록되지 않았어요!
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--muted)',
                textAlign: 'center',
                maxWidth: 460,
              }}
            >
              기업에 소개할 나의 정보를 작성해서 나를 소개해보세요.
            </div>
            <button
              className="profile-create-cta"
              onClick={() => navigate('/profile/new')}
            >
              지금 바로 프로필 작성하기
            </button>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {busy ? (
            <div className="muted">불러오는 중...</div>
          ) : error ? (
            <div style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</div>
          ) : items.length === 0 ? (
            <div className="muted">북마크한 공고가 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {items.map((p) => (
                <div key={p.id} className="bookmark-row">
                  <div className="bookmark-icon" aria-hidden>🔖</div>
                  <div className="bookmark-main">
                    <div className="bookmark-company">{p.companyName || '회사명 없음'}</div>
                    <div className="bookmark-title">{p.positionTitle || '공고 제목 없음'}</div>
                  </div>
                  <div className="bookmark-status">{renderStatus(p)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
