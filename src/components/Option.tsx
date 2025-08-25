import React, { useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Connection, ConnectionType, injectedConnection } from '@/libs/injected';
import { tryActivateConnector, tryDeactivateConnector } from '@/libs/utils/connection';
import { toast } from 'sonner';

interface OptionProps {
  isEnabled: boolean;
  isConnected: boolean;
  connectionType: ConnectionType;
  onActivate: (connectionType: ConnectionType) => void;
  onDeactivate: () => void;
}

export const Option: React.FC<OptionProps> = ({
  isEnabled,
  isConnected,
  connectionType,
  onActivate,
  onDeactivate,
}) => {
  const [isPending, setIsPending] = useState(false);
  const { connector } = useWeb3React();

  const isCurrentlyConnected = connector === injectedConnection.connector && isConnected;
  const disabled = !isEnabled || isPending;

  const onClick = async () => {
    if (isCurrentlyConnected) {
      setIsPending(true);
      try {
        await tryDeactivateConnector(injectedConnection.connector);
        onDeactivate();
        toast.success('Wallet desconectada');
      } catch (error) {
        console.error('Error disconnecting:', error);
        toast.error('Error al desconectar wallet');
      } finally {
        setIsPending(false);
      }
    } else {
      if (!window.ethereum?.isMetaMask) {
        window.open('https://metamask.io/', '_blank', 'noopener,noreferrer');
        return;
      }

      setIsPending(true);
      try {
        const connectionType = await tryActivateConnector(injectedConnection.connector);
        if (connectionType) {
          onActivate(connectionType);
          toast.success('Conectado con MetaMask');
        }
      } catch (error) {
        console.error('Error connecting:', error);
        toast.error('Error conectando con MetaMask');
      } finally {
        setIsPending(false);
      }
    }
  };

  const getButtonText = () => {
    if (isPending) return '';
    if (isCurrentlyConnected) return 'Desconectar';
    if (!window.ethereum?.isMetaMask) return 'Instalar MetaMask';
    return 'Conectar MetaMask';
  };

  return (
    <Button
      variant={isCurrentlyConnected ? "destructive" : "default"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="w-full justify-start"
    >
      <div className="flex items-center w-full">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
          alt="MetaMask" 
          className="w-5 h-5"
        />
        <span className="ml-2 flex-1 text-left">{getButtonText()}</span>
        {isPending && (
          <Loader2 className="w-4 h-4 animate-spin ml-auto" />
        )}
      </div>
    </Button>
  );
};
