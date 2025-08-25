import { Connector } from '@web3-react/types';
import { ConnectionType } from '../injected';

export const tryActivateConnector = async (
  connector: Connector
): Promise<ConnectionType | undefined> => {
  try {
    await connector.activate();
    return ConnectionType.INJECTED;
  } catch (error) {
    console.debug(`web3-react connection error: ${error}`);
    return undefined;
  }
};

export const tryDeactivateConnector = async (connector: Connector): Promise<null> => {
  try {
    await connector.deactivate?.();
    await connector.resetState();
    return null;
  } catch (error) {
    console.debug(`web3-react disconnection error: ${error}`);
    return null;
  }
};
