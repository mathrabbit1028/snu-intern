import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  apiApplicantMe,
  apiUpsertApplicantMe,
  type ApplicantProfile,
} from '../api/client';

// Validation helpers
function isTwoDigitInt(v: string) {
  return /^\d{2}$/.test(v);
}
function formatStudentId(twoDigits: string) {
  // 20xx if >=20 else 19xx
  const n = parseInt(twoDigits, 10);
  if (isNaN(n)) return twoDigits;
  return n >= 20 ? `20${twoDigits}` : `19${twoDigits}`;
}

export default function ProfileForm({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(mode === 'edit');
  const [studentTwoDigits, setStudentTwoDigits] = useState('');
  const [mainMajor, setMainMajor] = useState('');
  const [subMajors, setSubMajors] = useState<string[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitBusy, setSubmitBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit') {
      apiApplicantMe()
        .then((p: ApplicantProfile | null) => {
          if (!p) return; // no profile
          // Attempt to parse enrollYear last two digits
          if (p.enrollYear && typeof p.enrollYear === 'number') {
            const yearStr = String(p.enrollYear);
            const two = yearStr.slice(-2);
            if (isTwoDigitInt(two)) setStudentTwoDigits(two);
          }
          // Load department - may be comma-separated for multiple departments
          if (p.department && typeof p.department === 'string') {
            const depts = p.department.split(',').map((s) => s.trim()).filter(Boolean);
            if (depts.length > 0) {
              setMainMajor(depts[0]); // first is main major
              setSubMajors(depts.slice(1)); // rest are sub majors
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [mode]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isTwoDigitInt(studentTwoDigits)) {
      next.studentTwoDigits = '학번은 두 자리 숫자여야 합니다.';
    }
    if (!mainMajor.trim()) {
      next.mainMajor = '주전공은 필수입니다.';
    }
    const allMajors = [mainMajor, ...subMajors].map((m) => m.trim()).filter(Boolean);
    const set = new Set(allMajors);
    if (set.size !== allMajors.length) {
      next.majorsDuplicate = '학과를 중복 작성할 수 없습니다.';
    }
    if (subMajors.length > 6) {
      next.subMajors = '복수/부전공은 최대 6개까지 가능합니다.';
    }
    // PDF is always required (create and edit)
    if (!cvFile) {
      next.cvFile = '이력서 PDF를 업로드해주세요.';
    } else {
      if (cvFile.type !== 'application/pdf') {
        next.cvFile = 'PDF 파일만 업로드 가능합니다.';
      } else if (cvFile.size > 5 * 1024 * 1024) {
        next.cvFile = '파일 크기는 5MB 이하여야 합니다.';
      }
    }
    setErrors(next);
    return next;
  };

  const addSubMajor = () => {
    setSubMajors((list) => (list.length < 6 ? [...list, ''] : list));
  };

  const removeSubMajor = (idx: number) => {
    setSubMajors((list) => list.filter((_, i) => i !== idx));
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return; // invalid; do not send
    setSubmitBusy(true);
    try {
      setServerError(null);
      const formattedId = formatStudentId(studentTwoDigits);
      
      // Combine all departments: main major first, then sub majors
      const allDepts = [mainMajor, ...subMajors]
        .map((m) => m.trim())
        .filter(Boolean);
      const department = allDepts.join(','); // comma-separated with main first
      
      // Build payload matching actual API schema with all required fields
      const payload: any = {
        enrollYear: parseInt(formattedId, 10),
        department: department,
        positions: [],
        slogan: "",
        explanation: "",
        stacks: [],
        imageKey: "",
        cvKey: "",
        portfolioKey: "",
        links: [],
      };
      
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      await apiUpsertApplicantMe(payload);
      alert('프로필이 저장되었습니다.');
      navigate('/mypage');
    } catch (err: any) {
      console.error('Profile save error:', err);
      const msg = err?.message || '프로필 저장 중 오류가 발생했습니다.';
      setServerError(msg);
    } finally {
      setSubmitBusy(false);
    }
  };

  if (loading) return <div className="muted">불러오는 중...</div>;

  return (
    <form onSubmit={submit} className="profile-form" style={{ display: 'grid', gap: 28 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <label className="label" style={{ fontSize: 18, fontWeight: 700 }}>
          {mode === 'create' ? '프로필 생성' : '프로필 수정'}
        </label>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <div className="stack">
          <label className="label">학번 *</label>
          <input
            className="input profile-input"
            placeholder="예: 25"
            value={studentTwoDigits}
            maxLength={2}
            onChange={(e) => setStudentTwoDigits(e.target.value.replace(/[^0-9]/g, ''))}
          />
          {errors.studentTwoDigits && <div className="error">{errors.studentTwoDigits}</div>}
        </div>
        <div className="stack">
          <label className="label">학과 *</label>
          <input
            className="input profile-input"
            placeholder="주전공"
            value={mainMajor}
            onChange={(e) => setMainMajor(e.target.value)}
          />
          {subMajors.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="input profile-input"
                placeholder={`복수/부전공 ${i + 1}`}
                value={m}
                onChange={(e) =>
                  setSubMajors((list) => list.map((v, idx) => (idx === i ? e.target.value : v)))
                }
              />
              <button
                type="button"
                className="delete-btn"
                onClick={() => removeSubMajor(i)}
                aria-label="삭제"
              >
                삭제
              </button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addSubMajor} disabled={subMajors.length >= 6}>
            추가
          </button>
          {errors.mainMajor && <div className="error">{errors.mainMajor}</div>}
          {errors.subMajors && <div className="error">{errors.subMajors}</div>}
          {errors.majorsDuplicate && <div className="error">{errors.majorsDuplicate}</div>}
        </div>
        <div className="stack">
          <label className="label">이력서 (CV) *</label>
          {cvFile ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="cv-file-name">{cvFile.name}</span>
              <button
                type="button"
                className="delete-btn"
                onClick={() => setCvFile(null)}
              >
                삭제
              </button>
            </div>
          ) : (
            <>
              <label className="upload-box" aria-label="PDF 업로드">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  onChange={onFileSelect}
                />
                <span>PDF 파일만 업로드 가능해요.</span>
              </label>
            </>
          )}
          {errors.cvFile && <div className="error">{errors.cvFile}</div>}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {serverError && (
          <div className="error" style={{ whiteSpace: 'pre-line' }}>
            {serverError}
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={submitBusy}>
          저장
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/mypage')}
          disabled={submitBusy}
        >
          뒤로가기
        </button>
      </div>
    </form>
  );
}
