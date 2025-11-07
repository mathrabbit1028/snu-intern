import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, lastPage, onPageChange }: PaginationProps) => {
  if (lastPage <= 1) return null;

  // Calculate page range to show (max 5 pages)
  const getPageRange = () => {
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(lastPage, start + maxButtons - 1);
    
    // Adjust start if we're near the end
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageRange();

  return (
    <div className="pagination">
      <button
        className="pagination-button pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        &lt;
      </button>
      
      {pages.map((page) => (
        <button
          key={page}
          className={`pagination-button ${page === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      
      <button
        className="pagination-button pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
        aria-label="다음 페이지"
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination;
