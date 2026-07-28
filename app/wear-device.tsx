import { Redirect } from 'expo-router';

// Backward-compatible target for policy notifications already sent by the API.
export default function WearDeviceRedirect() {
  return <Redirect href="/wear" />;
}
