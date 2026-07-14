import { ProfileTextEditScreen } from '@/components/careon/profile-edit-screen';
import { MOCK_USER } from '@/lib/mock-data';

export default function ProfileNameScreen() {
  return <ProfileTextEditScreen initialValue={MOCK_USER.name} title="이름/닉네임" />;
}
