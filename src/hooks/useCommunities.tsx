// src/hooks/useCommunities.tsx - STUB
import { useState } from 'react';

export function useCommunities() {
  const [communities] = useState([]);
  const [loading] = useState(false);

  return {
    communities,
    loading,
    error: null,
    reload: () => {},
    refresh: () => {}
  };
}