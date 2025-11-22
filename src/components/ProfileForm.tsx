import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ApplicantProfile,
  apiApplicantMe,
  apiUpsertApplicantMe,
} from '../api/client';

function isTwoDigitInt(v: string) {
  return /^\d{2}$/.test(v);
}
function formatStudentId(twoDigits: string) {
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
  const [existingCvKey, setExistingCvKey] = useState<string | null>(null);

  const [positions, setPositions] = useState<string[]>([]);
  const [currStack, setCurrStack] = useState('');
  const [stacks, setStacks] = useState<string[]>([]);
  const [slogan, setSlogan] = useState('');
  const [explanation, setExplanation] = useState('');
  const [links, setLinks] = useState<{ description: string; link: string }[]>(
    []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitBusy, setSubmitBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit') {
      apiApplicantMe()
        .then((p: ApplicantProfile | null) => {
          if (!p) return;
          if (p.enrollYear) {
            const yearStr = String(p.enrollYear);
            const two = yearStr.slice(-2);
            if (isTwoDigitInt(two)) setStudentTwoDigits(two);
          }
          if (p.department) {
            const depts = p.department
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            if (depts.length > 0) {
              setMainMajor(depts[0]);
              setSubMajors(depts.slice(1));
            }
          }
          if (p.cvKey) {
            setExistingCvKey(p.cvKey as string);
          }
          if (p.positions) setPositions(p.positions);
          if (p.stacks) setStacks(p.stacks);
          if (p.slogan) setSlogan(p.slogan);
          if (p.explanation) setExplanation(p.explanation);
          if (p.links) setLinks(p.links);
        })
        .finally(() => setLoading(false));
    }
  }, [mode]);

  const addPosition = () => setPositions((prev) => [...prev, '']);
  const removePosition = (idx: number) =>
    setPositions((prev) => prev.filter((_, i) => i !== idx));
  const updatePosition = (idx: number, val: string) => {
    setPositions((prev) => prev.map((p, i) => (i === idx ? val : p)));
  };

  const removeSubMajor = (idx: number) => {
    setSubMajors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStackKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = currStack.trim();
      if (!val) return;
      if (val.length > 30) {
        return;
      }
      if (stacks.includes(val)) {
        return;
      }
      if (stacks.length >= 10) {
        return;
      }
      setStacks([...stacks, val]);
      setCurrStack('');
    }
  };
  const removeStack = (valToRemove: string) => {
    setStacks(stacks.filter((s) => s !== valToRemove));
  };

  const addLink = () =>
    setLinks((prev) => [...prev, { description: '', link: '' }]);
  const removeLink = (idx: number) =>
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  const updateLink = (
    idx: number,
    field: 'description' | 'link',
    val: string
  ) => {
    setLinks((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const validate = () => {
    const next: Record<string, string> = {};

    if (!isTwoDigitInt(studentTwoDigits))
      next.studentTwoDigits = '두 자리 수 숫자로 작성해주세요. (e.g. 25)';
    if (!mainMajor.trim()) next.mainMajor = '주전공 학과명을 입력해주세요.';
    const allMajors = [mainMajor, ...subMajors]
      .map((m) => m.trim())
      .filter(Boolean);
    const set = new Set(allMajors);
    if (set.size !== allMajors.length)
      next.majorsDuplicate =
        '주전공은 필수 작성이며, 다전공은 총 6개 이하로 중복되지 않게 입력해주세요.';
    if (subMajors.length > 6)
      next.subMajors =
        '주전공은 필수 작성이며, 다전공은 총 6개 이하로 중복되지 않게 입력해주세요.';

    if (mode === 'create') {
      if (!cvFile) {
        next.cvFile = '5MB 이하의 PDF 파일을 올려주세요.';
      } else {
        if (cvFile.type !== 'application/pdf')
          next.cvFile = 'PDF 파일만 업로드 가능해요.';
        else if (cvFile.size > 5 * 1024 * 1024)
          next.cvFile = '5MB 이하의 PDF 파일을 올려주세요.';
      }
    } else {
      if (!cvFile && !existingCvKey) {
        next.cvFile = '5MB 이하의 PDF 파일을 올려주세요.';
      } else if (cvFile) {
        if (cvFile.type !== 'application/pdf')
          next.cvFile = 'PDF 파일만 업로드 가능해요.';
        else if (cvFile.size > 5 * 1024 * 1024)
          next.cvFile = '5MB 이하의 PDF 파일을 올려주세요.';
      }
    }

    const posSet = new Set(positions.map((p) => p.trim()).filter(Boolean));
    if (posSet.size !== positions.filter((p) => p.trim()).length) {
      next.positions = '중복되지 않는 100자 이내의 직무명을 작성해주세요.';
    }
    positions.forEach((p) => {
      if (p.length > 100)
        next.positions = '중복되지 않는 100자 이내의 직무명을 작성해주세요.';
    });

    if (currStack.length > 30)
      next.currStack =
        '기존 태그와 중복되지 않는 30자 이하의 기술 스택을 작성해주세요.';
    if (stacks.includes(currStack.trim()))
      next.currStack =
        '기존 태그와 중복되지 않는 30자 이하의 기술 스택을 작성해주세요.';

    if (slogan.length > 100)
      next.slogan = '한 줄 소개는 100자 이내로 작성해주세요.';

    if (explanation.length > 5000)
      next.explanation = '상세 소개는 5000자 이내로 작성해주세요.';

    if (links.length > 5)
      next.links =
        '외부 소개 링크는 최대 5개까지 입력 가능하며 링크는 https로 시작해야 합니다.';
    const linkSet = new Set();
    links.forEach((l) => {
      if (l.description.length > 100)
        next.links =
          '중복되지 않는 유효한 링크와 100자 이내의 설명글을 입력해주세요.';
      if (l.link && !l.link.startsWith('https://'))
        next.links =
          '외부 소개 링크는 최대 5개까지 입력 가능하며 링크는 https로 시작해야 합니다.';

      const key = `${l.description}|${l.link}`;
      if (linkSet.has(key))
        next.links =
          '중복되지 않는 유효한 링크와 100자 이내의 설명글을 입력해주세요.';
      linkSet.add(key);
    });

    setErrors(next);
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      return;
    }

    setSubmitBusy(true);
    try {
      setServerError(null);
      const formattedId = formatStudentId(studentTwoDigits);
      const allDepts = [mainMajor, ...subMajors]
        .map((m) => m.trim())
        .filter(Boolean);
      const department = allDepts.join(',');

      const cleanPositions = positions.map((p) => p.trim()).filter(Boolean);
      const cleanStacks = stacks;
      const cleanLinks = links.filter(
        (l) => l.description.trim() && l.link.trim()
      );

      let cvKey = '';

      if (existingCvKey && existingCvKey.startsWith('static/private/CV/')) {
        cvKey = existingCvKey;
      }

      if (cvFile) {
        const randomStr = Math.random()
          .toString(36)
          .substring(2, 12)
          .padEnd(10, '0');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        cvKey = `static/private/CV/${randomStr}_${dateStr}/${cvFile.name}`;
      }

      const payload: Record<string, unknown> = {
        enrollYear: parseInt(formattedId, 10),
        department,
      };

      if (cleanPositions.length > 0) payload.positions = cleanPositions;
      if (slogan) payload.slogan = slogan;
      if (explanation) payload.explanation = explanation;
      if (cleanStacks.length > 0) payload.stacks = cleanStacks;
      if (cleanLinks.length > 0) payload.links = cleanLinks;

      payload.cvKey = cvKey;

      await apiUpsertApplicantMe(
        payload as Parameters<typeof apiUpsertApplicantMe>[0]
      );
      alert('프로필이 저장되었습니다.');
      navigate('/mypage');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('프로필 저장 중 오류가 발생했습니다.');
      }
    } finally {
      setSubmitBusy(false);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCvFile(file);
  };

  if (loading) return <div className="muted">불러오는 중...</div>;

  return (
    <form
      onSubmit={submit}
      className="profile-form"
      style={{ display: 'grid', gap: 48 }}
    >
      {/* === Required Section === */}
      <div style={{ display: 'grid', gap: 24 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label className="label" style={{ fontSize: 18, fontWeight: 700 }}>
            {mode === 'create' ? '프로필 생성' : '프로필 수정'}
          </label>
        </div>

        <div style={{ display: 'grid', gap: 32 }}>
          <div className="section-header">
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              필수 작성 항목
            </h3>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              아래 항목은 필수로 작성해주세요.
            </p>
          </div>

          <div className="stack">
            <label className="label">
              학번 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="input profile-input"
                placeholder="25"
                value={studentTwoDigits}
                maxLength={2}
                style={{ width: 120 }}
                onChange={(e) =>
                  setStudentTwoDigits(e.target.value.replace(/[^0-9]/g, ''))
                }
              />
              <span>학번</span>
            </div>
            {errors.studentTwoDigits && (
              <div className="error">{errors.studentTwoDigits}</div>
            )}
          </div>

          <div className="stack">
            <label className="label">
              학과 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              className="input profile-input"
              placeholder="주전공 학과명을 입력해주세요. (예시: 컴퓨터공학부, 경제학부 등)"
              value={mainMajor}
              onChange={(e) => setMainMajor(e.target.value)}
            />
            {subMajors.map((m, i) => (
              <div
                key={i}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <input
                  className="input profile-input"
                  placeholder="다전공 학과명을 입력해주세요."
                  value={m}
                  style={{ flex: 1 }}
                  onChange={(e) =>
                    setSubMajors((list) =>
                      list.map((v, idx) => (idx === i ? e.target.value : v))
                    )
                  }
                />
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => removeSubMajor(i)}
                >
                  삭제
                </button>
              </div>
            ))}
            <div>
              <button
                type="button"
                className="add-btn"
                onClick={() =>
                  setSubMajors((prev) =>
                    prev.length < 6 ? [...prev, ''] : prev
                  )
                }
              >
                추가
              </button>
            </div>
            {errors.mainMajor && (
              <div className="error">{errors.mainMajor}</div>
            )}
            {errors.majorsDuplicate && (
              <div className="error">{errors.majorsDuplicate}</div>
            )}
            {errors.subMajors && (
              <div className="error">{errors.subMajors}</div>
            )}
          </div>

          <div className="stack">
            <label className="label">
              이력서 (CV) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>

            {/* Edit 모드에서 기존 CV 표시 */}
            {mode === 'edit' && existingCvKey && !cvFile && (
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                }}
              >
                <span className="cv-file-name">
                  현재 파일: {existingCvKey.split('/').pop()}
                </span>
                <label
                  className="btn-secondary"
                  style={{ cursor: 'pointer', padding: '6px 12px' }}
                >
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={onFileSelect}
                  />
                  변경
                </label>
              </div>
            )}

            {/* 새 파일 선택된 경우 */}
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
              /* Create 모드이거나 Edit 모드에서 기존 CV가 없는 경우 */
              (!existingCvKey || mode === 'create') && (
                <label className="upload-box">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={onFileSelect}
                  />
                  <span>PDF 파일만 업로드 가능해요.</span>
                </label>
              )
            )}
            {errors.cvFile && <div className="error">{errors.cvFile}</div>}
          </div>
        </div>
      </div>

      <div
        className="divider"
        style={{ height: 1, background: 'var(--border)' }}
      />

      {/* === Optional Section === */}
      <div style={{ display: 'grid', gap: 32 }}>
        <div className="section-header">
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            선택 작성 항목
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            아래 항목은 필수로 작성하지 않아도 괜찮지만, 작성해 주시면 채용
            담당자가 지원자의 강점을 이해하는 데 더욱 도움이 되어요.
          </p>
        </div>

        {/* 1. 희망 직무 */}
        <div className="stack">
          <label className="label">희망 직무</label>
          {positions.map((pos, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8 }}>
              <input
                className="input profile-input"
                placeholder="희망 직무를 입력해주세요. (예시: 웹 프론트엔드 개발, 백엔드 개발 등)"
                value={pos}
                onChange={(e) => updatePosition(idx, e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="delete-btn"
                onClick={() => removePosition(idx)}
              >
                삭제
              </button>
            </div>
          ))}
          <div>
            <button type="button" className="add-btn" onClick={addPosition}>
              추가
            </button>
          </div>
          {errors.positions && <div className="error">{errors.positions}</div>}
        </div>

        {/* 2. 기술 스택 */}
        <div className="stack">
          <label className="label">기술 스택</label>

          <div className="tag-container">
            {stacks.map((stack) => (
              <span key={stack} className="tag">
                {stack}
                <button type="button" onClick={() => removeStack(stack)}>
                  &times;
                </button>
              </span>
            ))}
          </div>

          <input
            className="input profile-input"
            placeholder="사용할 수 있는 상세 기술 스택을 입력해주세요. (최대 10개)"
            value={currStack}
            onChange={(e) => setCurrStack(e.target.value)}
            onKeyDown={handleStackKeyDown}
          />
          <p className="info-text">
            기술 스택은 엔터로 구분되며 한 개당 최대 30자까지 입력할 수 있어요.
          </p>
          {errors.currStack && <div className="error">{errors.currStack}</div>}
        </div>

        {/* 3. 한 줄 소개 */}
        <div className="stack">
          <label className="label">한 줄 소개</label>
          <textarea
            className="input profile-input"
            placeholder="나를 소개하는 한마디를 입력해주세요."
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            rows={2}
            style={{ resize: 'none' }}
          />
          <div
            className="char-count"
            style={{
              textAlign: 'right',
              fontSize: 12,
              color: slogan.length > 100 ? 'var(--danger)' : 'var(--muted)',
            }}
          >
            {slogan.length}/100
          </div>
          {errors.slogan && <div className="error">{errors.slogan}</div>}
        </div>

        {/* 4. 자기소개 */}
        <div className="stack">
          <label className="label">자기소개</label>
          <textarea
            className="input profile-input"
            placeholder="자신에 대한 상세 소개를 작성해주세요."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={8}
            style={{ resize: 'vertical' }}
          />
          <div
            className="char-count"
            style={{
              textAlign: 'right',
              fontSize: 12,
              color:
                explanation.length > 5000 ? 'var(--danger)' : 'var(--muted)',
            }}
          >
            {explanation.length}/5000
          </div>
          {errors.explanation && (
            <div className="error">{errors.explanation}</div>
          )}
        </div>

        {/* 5. 기타 소개 링크 */}
        <div className="stack">
          <label className="label">기타 소개 링크</label>
          {links.map((l, idx) => (
            <div
              key={idx}
              className="link-row"
              style={{
                display: 'grid',
                gap: 8,
                position: 'relative',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <button
                type="button"
                className="delete-btn-icon"
                onClick={() => removeLink(idx)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  border: 'none',
                  background: 'transparent',
                  color: '#aaa',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
              <input
                className="input profile-input"
                placeholder="링크 제목을 작성해주세요. (e.g. 깃허브)"
                value={l.description}
                onChange={(e) => updateLink(idx, 'description', e.target.value)}
              />
              <input
                className="input profile-input"
                placeholder="https://"
                value={l.link}
                onChange={(e) => updateLink(idx, 'link', e.target.value)}
              />
            </div>
          ))}
          <div>
            <button type="button" className="add-btn" onClick={addLink}>
              추가
            </button>
          </div>
          <p className="info-text">
            깃허브, 링크드인, 개인 홈페이지 등 자신을 소개할 수 있는 기타 링크를
            첨부해주세요.
          </p>
          {errors.links && (
            <div className="error" style={{ whiteSpace: 'pre-line' }}>
              {errors.links}
            </div>
          )}
        </div>
      </div>

      {/* === Actions === */}
      <div style={{ display: 'grid', gap: 12 }}>
        {serverError && (
          <div className="error" style={{ whiteSpace: 'pre-line' }}>
            {serverError}
          </div>
        )}
        <button
          type="submit"
          className="btn-primary big-btn"
          disabled={submitBusy}
        >
          저장
        </button>
        <button
          type="button"
          className="btn-secondary big-btn"
          onClick={() => navigate('/mypage')}
          disabled={submitBusy}
        >
          뒤로가기
        </button>
      </div>
    </form>
  );
}
