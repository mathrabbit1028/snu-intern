import { useEffect, useMemo, useState } from 'react';
import { type Post, addBookmark, removeBookmark } from '../api/posts';
import { useAuth } from '../auth/AuthContext';

export default function PostCard({
  post,
  onChanged,
  onRequireLogin,
}: {
  post: Post;
  onChanged?: (next: boolean) => void;
  onRequireLogin?: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState(!!post.isBookmarked);

  // Sync liked state with post.isBookmarked when it changes (e.g., after logout/refresh)
  useEffect(() => {
    setLiked(!!post.isBookmarked);
  }, [post.isBookmarked]);

  const deadline = useMemo(
    () => (post.employmentEndDate ? new Date(post.employmentEndDate) : null),
    [post.employmentEndDate]
  );

  const toggle = async () => {
    if (!user) {
      onRequireLogin?.();
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (liked) await removeBookmark(post.id);
      else await addBookmark(post.id);
      setLiked(!liked);
      onChanged?.(!liked);
    } catch (_e) {
      alert('북마크 처리 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="postcard">
      <div className="post-header">
        <div
          style={{ width: 48, height: 48, background: '#eee', borderRadius: 8 }}
          aria-hidden
        />
        <button
          className={`bookmark-btn${liked ? ' active' : ''}`}
          onClick={toggle}
          disabled={busy}
          aria-label="bookmark"
        >
          {liked ? '★' : '☆'}
        </button>
      </div>
      <div className="meta-row">
        <span className="badge">{post.companyName}</span>
        <span className="badge">{post.domain}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{post.positionTitle}</div>
      <div style={{ fontSize: 13, color: '#cbd2e0' }}>{post.slogan ?? ''}</div>
      <div className="meta-row">
        {deadline && (
          <span className="d-day">마감 {deadline.toLocaleDateString()}</span>
        )}
        {typeof post.headCount === 'number' && (
          <span>모집 {post.headCount}명</span>
        )}
      </div>
    </div>
  );
}
