import { Web3ReactProvider } from '@web3-react/core';
import { PRIORITIZED_CONNECTORS } from '../injected';

interface Web3ContextProviderProps {
  children: React.ReactNode;
}

export default function Web3ContextProvider({ children }: Web3ContextProviderProps) {
  const connectors = PRIORITIZED_CONNECTORS.map(({ connector, hooks }) => [connector, hooks]);
  
  return (
    <Web3ReactProvider connectors={connectors as [any, any][]}>
      {children}
    </Web3ReactProvider>
  );
}
