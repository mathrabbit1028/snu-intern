import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Eye, EyeOff } from '../components/icons';

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // 이메일 인증이 불필요하므로 관련 상태 제거

  const email = useMemo(() => {
    const username = localEmail.replace(/@.*/, '');
    return username ? `${username}@snu.ac.kr` : '';
  }, [localEmail]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await signup({ name, email, password });
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '회원가입 실패';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 인증이 필요 없으므로 관련 로직 제거

  return (
    <div className="container page">
      <div className="card">
        <h1>회원가입</h1>
        <form onSubmit={onSubmit} className="form">
          <div className="stack">
            <span className="label">실명</span>
            <div className="field">
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="홍길동"
              />
            </div>
          </div>
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
                pattern="[^@\\s]+"
                title="메일 아이디만 입력하세요"
              />
              <span className="suffix">@snu.ac.kr</span>
            </div>
          </div>
          {/* 이메일 인증 불필요 */}
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
          <div className="stack">
            <span className="label">비밀번호 확인</span>
            <div className="field">
              <input
                className="input"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button type="button" className="icon-btn" onClick={() => setShowConfirm((v) => !v)} aria-label="비밀번호 확인 표시 토글">
                {showConfirm ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>
          {error ? <div className="error">{error}</div> : null}
          <div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? '가입 중…' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
