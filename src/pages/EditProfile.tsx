import ProfileForm from '../components/ProfileForm';

export default function EditProfile() {
  return (
    <div className="container page" style={{ display: 'grid', gap: 32 }}>
      <h1 style={{ margin: 0 }}>프로필 수정</h1>
      <ProfileForm mode="edit" />
    </div>
  );
}
