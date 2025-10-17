import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Eye, EyeOff } from '../components/icons';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [localEmail, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const email = useMemo(() => {
    // Force domain to @snu.ac.kr
    const username = localEmail.replace(/@.*/, '');
    return username ? `${username}@snu.ac.kr` : '';
  }, [localEmail]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '로그인 실패';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <div className="card">
        <h1>로그인</h1>
        <form onSubmit={onSubmit} className="form">
          <div className="stack">
            <span className="label">메일</span>
            <div className="field">
              <input
                className="input"
                type="text"
                value={localEmail}
                onChange={(e) => setLocalEmail(e.target.value)}
                placeholder="아이디"
                required
                inputMode="email"
                pattern="[^@\s]+"
                title="메일 아이디만 입력하세요"
              />
              <span className="suffix">@snu.ac.kr</span>
            </div>
          </div>

          <div className="stack">
            <span className="label">비밀번호</span>
            <div className="field">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="icon-btn" onClick={() => setShowPassword((v) => !v)} aria-label="비밀번호 표시 토글">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {error ? <div className="error">{error}</div> : null}
          <div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? '로그인 중…' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
