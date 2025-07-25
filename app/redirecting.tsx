import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserContext } from '../components/UserContext';

export default function Redirecting() {
  const router = useRouter();
  const { getHomeRoute } = useUserContext();

  useEffect(() => {
    const home = getHomeRoute();
    setTimeout(() => {
      router.replace(home);
    }, 50); // small delay to ensure navigation stack resets
  }, []);

  return null;
} 