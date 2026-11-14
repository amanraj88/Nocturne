import React from 'react';
import { useLounge } from '@/context/LoungeContext';

export const MiniPlayer: React.FC = () => {
  const { currentRoom, currentTrack, leaveRoom } = useLounge();

  if (!currentRoom?.id || !currentRoom?.slug || !currentTrack) {
    return null;
  }

  return (
    <div style={{ display: 'none' }} onClick={() => leaveRoom()}>
      {/* Hidden container maintaining lifecycle invariant */}
    </div>
  );
};
