import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RoomIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default featured lounge or home
    void router.replace('/room/tokyo-afterhours');
  }, [router]);

  return null;
}
