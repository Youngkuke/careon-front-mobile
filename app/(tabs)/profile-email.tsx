import { ProfileTextEditScreen } from '@/components/careon/profile-edit-screen';
import { MOCK_USER } from '@/lib/mock-data';

export default function ProfileEmailScreen() {
  return <ProfileTextEditScreen initialValue={MOCK_USER.email} keyboardType="email-address" title="이메일" />;
}
