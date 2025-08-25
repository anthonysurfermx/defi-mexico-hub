// src/components/WalletConnect.tsx - IMPORTS CORREGIDOS
import React, { useState, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Wallet, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Option } from './Option';
import { ConnectionType } from '@/libs/injected'; // ✅ IMPORT CORREGIDO

export const WalletConnect: React.FC = () => {
  const { account, isActive, chainId } = useWeb3React();
  const [activeConnectionType, setActiveConnectionType] = useState<ConnectionType | null>(null);

  // Callbacks following Uniswap's pattern
  const onActivate = useCallback((connectionType: ConnectionType) => {
    setActiveConnectionType(connectionType);
  }, []);

  const onDeactivate = useCallback(() => {
    setActiveConnectionType(null);
  }, []);

  // Utility functions
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast.success('Dirección copiada al portapapeles');
    }
  };

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      case 10: return 'Optimism';
      case 8453: return 'Base';
      default: return `Chain ${chainId}`;
    }
  };

  const openEtherscan = () => {
    if (account && chainId) {
      const baseUrl = chainId === 1 
        ? 'https://etherscan.io' 
        : chainId === 137 
        ? 'https://polygonscan.com'
        : chainId === 42161
        ? 'https://arbiscan.io'
        : chainId === 10
        ? 'https://optimistic.etherscan.io'
        : chainId === 8453
        ? 'https://basescan.org'
        : 'https://etherscan.io';
      window.open(`${baseUrl}/address/${account}`, '_blank');
    }
  };

  // If wallet is connected, show connected state
  if (isActive && account) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">{formatAddress(account)}</span>
            <span className="sm:hidden">Wallet</span>
            {chainId && (
              <span className="hidden md:inline text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {getChainName(chainId)}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium">MetaMask Conectada</p>
            <p className="text-xs text-muted-foreground">{account}</p>
            {chainId && (
              <p className="text-xs text-muted-foreground mt-1">
                Red: {getChainName(chainId)}
              </p>
            )}
          </div>
          
          <div className="p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyAddress} 
              className="w-full justify-start"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar dirección
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openEtherscan} 
              className="w-full justify-start"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver en Explorer
            </Button>
          </div>

          <DropdownMenuSeparator />
          
          {/* Option component following Uniswap's exact pattern */}
          <div className="p-2">
            <Option
              isEnabled={true}
              isConnected={isActive}
              connectionType={ConnectionType.INJECTED}
              onActivate={onActivate}
              onDeactivate={onDeactivate}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // If wallet is not connected, show connect button
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Conectar Wallet</span>
          <span className="sm:hidden">Wallet</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2">
          {/* Option component following Uniswap's exact pattern */}
          <Option
            isEnabled={true}
            isConnected={false}
            connectionType={ConnectionType.INJECTED}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};