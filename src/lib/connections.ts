// src/libs/connections.ts
import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';
import { WalletConnect as WalletConnectV2 } from '@web3-react/walletconnect-v2';

export enum ConnectionType {
  INJECTED = 'INJECTED',
  WALLET_CONNECT_V2 = 'WALLET_CONNECT_V2',
}

export interface Connection {
  connector: any;
  hooks: any;
  type: ConnectionType;
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`);
}

// MetaMask Connector
const [metaMask, metaMaskHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions, onError })
);

export const metaMaskConnection: Connection = {
  connector: metaMask,
  hooks: metaMaskHooks,
  type: ConnectionType.INJECTED,
};

// WalletConnect V2 Connector
const [walletConnectV2, walletConnectV2Hooks] = initializeConnector<WalletConnectV2>(
  (actions) =>
    new WalletConnectV2({
      actions,
      options: {
        projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'default_project_id',
        chains: [1, 137], // Ethereum, Polygon
        showQrModal: true,
        metadata: {
          name: 'DeFi México Hub',
          description: 'El Hub #1 de DeFi en México',
          url: 'https://defimexico.org',
          icons: ['https://defimexico.org/icon.png'],
        },
      },
      onError,
    })
);

export const walletConnectV2Connection: Connection = {
  connector: walletConnectV2,
  hooks: walletConnectV2Hooks,
  type: ConnectionType.WALLET_CONNECT_V2,
};

// Lista ordenada por prioridad
export const connections: Connection[] = [
  metaMaskConnection,
  walletConnectV2Connection,
];