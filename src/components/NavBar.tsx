import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NavBar = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="nav-brand">
          SNU Intern
        </Link>
        <div className="spacer" />
        {loading ? (
          <span className="muted">로딩중…</span>
        ) : user ? (
          <div
            className="gap-12"
            style={{ gridAutoFlow: 'column', alignItems: 'center' }}
          >
            <span>{user.name}</span>
            <button className="nav-btn" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <div
            className="gap-12"
            style={{ gridAutoFlow: 'column', alignItems: 'center' }}
          >
            <Link className="nav-link" to="/login">
              로그인
            </Link>
            <Link className="nav-btn" to="/signup">
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
