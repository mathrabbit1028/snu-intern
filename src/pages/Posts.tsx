import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type Post, getPosts } from '../api/posts';
import { useAuth } from '../auth/AuthContext';
import FilterBar from '../components/FilterBar';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import PostCard from '../components/PostCard';

export default function Posts() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastPage, setLastPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const page = parseInt(sp.get('page') ?? '1', 10);

  const queryParams = useMemo(() => {
    const roles = sp.getAll('roles');
    const domains = sp.getAll('domains');
    const isActive = sp.get('isActive') ?? 'false';
    const order = sp.get('order') ?? '0';
    return {
      page: page - 1, // Convert to 0-based for API
      roles,
      domains,
      isActive,
      order,
      // Add user state to trigger refetch on login/logout
      _user: user?.id ?? undefined,
    };
  }, [sp, page, user]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPosts(queryParams)
      .then((data) => {
        if (!alive) return;
        setPosts(data.posts ?? []);
        // Use API lastPage directly (already 1-based)
        const apiLastPage = data.paginator?.lastPage ?? 1;
        setLastPage(apiLastPage);
      })
      .catch((_e) => {
        if (!alive) return;
        setPosts([]);
        setLastPage(1);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [queryParams]);

  return (
    <div className="container page" style={{ display: 'grid', gap: 12 }}>
      <h1>스누인턴 공고</h1>
      <FilterBar />
      {loading ? (
        <div>불러오는 중...</div>
      ) : posts.length === 0 ? (
        <div style={{ padding: 12, color: '#889' }}>공고가 없습니다.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }}
          >
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onRequireLogin={() => setLoginOpen(true)}
              />
            ))}
          </div>
          <Pagination current={page} lastPage={lastPage} />
        </div>
      )}

      <Modal open={loginOpen} onClose={() => setLoginOpen(false)}>
        <h2>로그인이 필요합니다</h2>
        <div className="muted">찜하기 기능은 로그인 후 이용할 수 있어요.</div>
        <div className="buttons">
          <button className="btn-primary" onClick={() => navigate('/login')}>
            로그인하기
          </button>
          <button className="btn-secondary" onClick={() => setLoginOpen(false)}>
            뒤로가기
          </button>
        </div>
      </Modal>
    </div>
  );
}
