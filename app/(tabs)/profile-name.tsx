import { ProfileTextEditScreen } from '@/components/careon/profile-edit-screen';
import { useAuth } from '@/lib/auth-state';

export default function ProfileNameScreen() {
  const { updateMe, user } = useAuth();

  return (
    <ProfileTextEditScreen
      initialValue={user?.name ?? ''}
      onSave={(name) => updateMe({ name })}
      title="이름/닉네임"
    />
  );
}
