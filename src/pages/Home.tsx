import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiGetPosts } from '../api/client';
import type { Post, Position, Domain } from '../types/post';
import PostCard from '../components/PostCard';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import './Home.css';

const POSTS_PER_PAGE = 12;

const Home = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // All posts from API (page=0 + page=1 combined = 17 posts)
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  // Posts to display on current page
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  // Total pages for client-side pagination
  const [totalPages, setTotalPages] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Parse filters from URL
  const positions = searchParams.getAll('positions') as Position[];
  const domains = searchParams.getAll('domains') as Domain[];
  const isActive = searchParams.get('isActive') === 'true';
  const order = Number.parseInt(searchParams.get('order') || '0', 10);
  const page = Number.parseInt(searchParams.get('page') || '1', 10);

  // Update URL with filters
  const updateFilters = (newFilters: {
    positions?: Position[];
    domains?: Domain[];
    isActive?: boolean;
    order?: number;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    
    const updatedPositions = newFilters.positions !== undefined ? newFilters.positions : positions;
    const updatedDomains = newFilters.domains !== undefined ? newFilters.domains : domains;
    const updatedIsActive = newFilters.isActive !== undefined ? newFilters.isActive : isActive;
    const updatedOrder = newFilters.order !== undefined ? newFilters.order : order;
    let updatedPage = newFilters.page !== undefined ? newFilters.page : page;
    
    // Reset to page 1 if filters changed (not page itself)
    if (newFilters.positions !== undefined || newFilters.domains !== undefined || 
        newFilters.isActive !== undefined || newFilters.order !== undefined) {
      updatedPage = 1;
    }
    
    updatedPositions.forEach(p => params.append('positions', p));
    updatedDomains.forEach(d => params.append('domains', d));
    
    if (updatedIsActive) {
      params.set('isActive', 'true');
    }
    
    if (updatedOrder !== 0) {
      params.set('order', String(updatedOrder));
    }
    
    if (updatedPage !== 1) {
      params.set('page', String(updatedPage));
    }
    
    setSearchParams(params);
  };

  // Fetch all posts when filters change (NOT page)
  useEffect(() => {
    const fetchAllPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch page=0 and page=1 to get all 17 posts
        const [response0, response1] = await Promise.all([
          apiGetPosts({
            positions: positions.length > 0 ? positions : undefined,
            domains: domains.length > 0 ? domains : undefined,
            isActive: isActive || undefined,
            order,
            page: 0, // First page (12 posts)
          }),
          apiGetPosts({
            positions: positions.length > 0 ? positions : undefined,
            domains: domains.length > 0 ? domains : undefined,
            isActive: isActive || undefined,
            order,
            page: 1, // Second page (5 posts)
          }),
        ]);
        
        // Combine posts from both pages
        const combinedPosts = [...response0.posts, ...response1.posts];
        setAllPosts(combinedPosts);
        
        // Calculate total pages for client-side pagination (3 posts per page)
        const calculatedTotalPages = Math.ceil(combinedPosts.length / POSTS_PER_PAGE);
        setTotalPages(calculatedTotalPages || 1);
        
      } catch (err) {
        setError('공고를 불러오는데 실패했습니다.');
        console.error('Failed to fetch posts:', err);
        setAllPosts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, [positions.join(','), domains.join(','), isActive, order]);

  // Update display posts when page or allPosts changes
  useEffect(() => {
    if (allPosts.length === 0) {
      setDisplayPosts([]);
      return;
    }
    
    // Client-side pagination: 3 posts per page
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const postsForPage = allPosts.slice(startIndex, endIndex);
    
    setDisplayPosts(postsForPage);
    
    // If current page is out of bounds, reset to page 1
    if (page > totalPages && totalPages > 0) {
      updateFilters({ page: 1 });
    }
  }, [allPosts, page, totalPages]);

  const handleReset = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleBookmarkChange = async () => {
    // Refresh all posts to update bookmark status
    try {
      const [response0, response1] = await Promise.all([
        apiGetPosts({
          positions: positions.length > 0 ? positions : undefined,
          domains: domains.length > 0 ? domains : undefined,
          isActive: isActive || undefined,
          order,
          page: 0,
        }),
        apiGetPosts({
          positions: positions.length > 0 ? positions : undefined,
          domains: domains.length > 0 ? domains : undefined,
          isActive: isActive || undefined,
          order,
          page: 1,
        }),
      ]);
      
      const combinedPosts = [...response0.posts, ...response1.posts];
      setAllPosts(combinedPosts);
    } catch (err) {
      console.error('Failed to refresh posts:', err);
    }
  };

  return (
    <div className="container page">
      <h1 className="page-title">공고 목록</h1>
      
      <FilterBar
        selectedPositions={positions}
        selectedDomains={domains}
        isActive={isActive}
        order={order}
        onPositionsChange={(positions) => updateFilters({ positions })}
        onDomainsChange={(domains) => updateFilters({ domains })}
        onIsActiveChange={(isActive) => updateFilters({ isActive })}
        onOrderChange={(order) => updateFilters({ order })}
        onReset={handleReset}
      />

      {loading && <div className="loading">로딩 중...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && displayPosts.length === 0 && (
        <div className="no-posts">공고가 없습니다.</div>
      )}
      
      {!loading && !error && displayPosts.length > 0 && (
        <>
          <div className="posts-grid">
            {displayPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isLoggedIn={!!user}
                onLoginRequired={() => setShowLoginModal(true)}
                onBookmarkChange={handleBookmarkChange}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              lastPage={totalPages}
              onPageChange={(page) => updateFilters({ page })}
            />
          )}
        </>
      )}

      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="찜하기를 하려면 로그인이 필요해요"
        message="계정이 없으시다면 지금 바로 회원가입해보세요"
        showLoginButton={true}
      />
    </div>
  );
};

export default Home;
