import ProfileForm from '../components/ProfileForm';

export default function CreateProfile() {
  return (
    <div className="container page" style={{ display: 'grid', gap: 32 }}>
      <h1 style={{ margin: 0 }}>프로필 생성</h1>
      <div style={{ fontSize: 18, fontWeight: 700 }}>필수 작성 항목</div>
      <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>
        아래 항목은 필수로 작성해주세요.
      </div>
      <ProfileForm mode="create" />
    </div>
  );
}
