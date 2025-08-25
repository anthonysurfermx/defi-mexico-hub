import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';

export enum ConnectionType {
  INJECTED = 'INJECTED',
}

export interface Connection {
  connector: MetaMask;
  hooks: any;
  type: ConnectionType;
}

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`);
}

const [metaMask, metaMaskHooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions, onError })
);

export const injectedConnection: Connection = {
  connector: metaMask,
  hooks: metaMaskHooks,
  type: ConnectionType.INJECTED,
};

export const PRIORITIZED_CONNECTORS: Connection[] = [
  injectedConnection,
];
