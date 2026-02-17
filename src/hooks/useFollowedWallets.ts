import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { followedWalletsService, FollowedWallet } from '@/services/followed-wallets.service';

export function useFollowedWallets() {
  const { isAuthenticated } = useAuth();
  const [wallets, setWallets] = useState<FollowedWallet[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setWallets([]);
      return;
    }
    setLoading(true);
    try {
      const data = await followedWalletsService.getAll();
      setWallets(data);
    } catch (err) {
      console.error('Failed to load followed wallets:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const follow = useCallback(async (address: string, label?: string) => {
    const wallet = await followedWalletsService.follow(address, label);
    setWallets(prev => [wallet, ...prev]);
    return wallet;
  }, []);

  const unfollow = useCallback(async (address: string) => {
    await followedWalletsService.unfollow(address);
    setWallets(prev => prev.filter(w => w.wallet_address !== address.toLowerCase()));
  }, []);

  const isFollowing = useCallback((address: string) => {
    return wallets.some(w => w.wallet_address === address.toLowerCase());
  }, [wallets]);

  return { wallets, loading, follow, unfollow, isFollowing, refresh };
}
