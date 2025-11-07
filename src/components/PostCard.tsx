import { useState } from 'react';
import type { Post } from '../types/post';
import { DOMAIN_NAMES } from '../types/post';
import { apiBookmarkPost, apiUnbookmarkPost } from '../api/client';
import './PostCard.css';

interface PostCardProps {
  post: Post;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onBookmarkChange: () => void;
}

const PostCard = ({ post, isLoggedIn, onLoginRequired, onBookmarkChange }: PostCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isBookmarked) {
        await apiUnbookmarkPost(post.id);
        setIsBookmarked(false);
      } else {
        await apiBookmarkPost(post.id);
        setIsBookmarked(true);
      }
      onBookmarkChange();
    } catch (error) {
      console.error('북마크 처리 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `마감: ${year}. ${month}. ${day}.`;
  };

  // Generate a consistent color based on company name
  const getCompanyColor = (name: string) => {
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', 
      '#F44336', '#00BCD4', '#FFEB3B', '#795548'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="post-card">
      <div className="post-card-header">
        <div 
          className="company-logo-block" 
          style={{ backgroundColor: getCompanyColor(post.companyName) }}
        />
        <button 
          className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmarkClick}
          disabled={isLoading}
          aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>
      <div className="post-card-body">
        <p className="company-name">{post.companyName}</p>
        <h3 className="position-title">{post.positionTitle}</h3>
        <div className="post-tags">
          <span className="tag tag-domain">{DOMAIN_NAMES[post.domain]}</span>
        </div>
        <p className="employment-date">{formatDate(post.employmentEndDate)}</p>
        <p className="slogan">{post.slogan}</p>
      </div>
    </div>
  );
};

export default PostCard;
