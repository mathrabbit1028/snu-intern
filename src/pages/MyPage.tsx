import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type ApplicantProfile, apiApplicantMe } from '../api/client';
import { type Post, getBookmarks } from '../api/posts';
import { useAuth } from '../auth/AuthContext';

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
  const hasProfile = !!profile;

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (tab !== 'bookmarks') return;
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
        setError(
          e instanceof Error ? e.message : '북마크를 불러오지 못했습니다'
        );
        setItems([]);
      })
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== 'info') return;
    let alive = true;
    setProfileBusy(true);
    apiApplicantMe()
      .then((p) => {
        if (!alive) return;
        setProfile(p);
      })
      .catch((e) => {
        if (!alive) return;
        setError(
          e instanceof Error ? e.message : '프로필을 불러오지 못했습니다'
        );
        setProfile(null);
      })
      .finally(() => alive && setProfileBusy(false));
    return () => {
      alive = false;
    };
  }, [tab]);

  const renderStatus = (p: Post) => {
    const raw = p.employmentEndDate?.trim();
    if (!raw) return <span className="status ongoing">상시모집</span>;
    const date = new Date(raw);
    if (isNaN(date.getTime()))
      return <span className="status ongoing">상시모집</span>;
    const diffDays = Math.ceil(
      (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return <span className="status closed">마감</span>;
    if (diffDays === 0) return <span className="status ongoing">D-Day</span>;
    return <span className="status ongoing">D-{diffDays}</span>;
  };

  const renderProfileInfo = () => {
    if (!profile) return null;

    const depts = String(profile.department || '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const formattedDept = depts
      .map((dept, idx) => (idx === 0 ? dept : `${dept}(복수전공)`))
      .join(' · ');

    const year = Number(profile.enrollYear);
    const displayYear = year >= 2000 ? year - 2000 : year - 1900;

    return (
      <div className="card profile-view-card">
        {/* Header Section */}
        <div className="profile-header">
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            {String(profile.name)}
          </h2>
          <div className="profile-meta">
            <div>{String(profile.email)}</div>
            <div>
              {formattedDept} {displayYear}학번
            </div>
          </div>
        </div>

        <div className="divider" />

        <h3 style={{ fontSize: 18, fontWeight: 700 }}>기본 정보</h3>

        {/* Positions */}
        <div className="info-block">
          <div className="info-label">희망 직무</div>
          <div className="info-content">
            {profile.positions && profile.positions.length > 0 ? (
              profile.positions.join(', ')
            ) : (
              <span className="muted">입력된 희망 직무가 없습니다.</span>
            )}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="info-block">
          <div className="info-label">기술 스택</div>
          <div className="info-content tags-display">
            {profile.stacks && profile.stacks.length > 0 ? (
              profile.stacks.map((s) => (
                <span key={s} className="display-tag">
                  {s}
                </span>
              ))
            ) : (
              <span className="muted">입력된 기술 스택이 없습니다.</span>
            )}
          </div>
        </div>

        {/* Self Intro */}
        <div className="info-block">
          <div className="info-label">자기소개</div>
          <div className="info-content pre-wrap">
            {profile.slogan && (
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                "{profile.slogan}"
              </div>
            )}
            {profile.explanation || (
              <span className="muted">입력된 자기소개가 없습니다.</span>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="info-block">
          <div className="info-label">소개 링크</div>
          <div className="info-content link-list">
            {profile.links && profile.links.length > 0 ? (
              profile.links.map((l, i) => (
                <a
                  key={i}
                  href={l.link}
                  target="_blank"
                  rel="noreferrer"
                  className="profile-link-item"
                >
                  {l.description || l.link}{' '}
                  <span style={{ fontSize: 12 }}>🔗</span>
                </a>
              ))
            ) : (
              <span className="muted">입력된 링크가 없습니다.</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container page" style={{ display: 'grid', gap: 32 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1 style={{ margin: 0 }}>마이페이지</h1>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}></div>
      </div>

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
          profileBusy ? (
            <div className="muted">불러오는 중...</div>
          ) : (
            renderProfileInfo()
          )
        ) : profileBusy ? (
          <div className="muted">불러오는 중...</div>
        ) : (
          <div className="card empty-profile-card">
            <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}>
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
                  <div className="bookmark-icon" aria-hidden>
                    🔖
                  </div>
                  <div className="bookmark-main">
                    <div className="bookmark-company">
                      {p.companyName || '회사명 없음'}
                    </div>
                    <div className="bookmark-title">
                      {p.positionTitle || '공고 제목 없음'}
                    </div>
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
