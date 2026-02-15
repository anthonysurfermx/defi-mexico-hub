import { ProtocolTVLChart } from './ProtocolTVLChart';
import { ChainTVLChart } from './ChainTVLChart';
import { ProtocolFeesChart } from './ProtocolFeesChart';
import { KastGrowthChart } from './KastGrowthChart';

interface Props {
  type: string;
  identifier: string;
  title?: string;
}

export function DefiChart({ type, identifier, title }: Props) {
  switch (type) {
    case 'protocol_tvl':
      return <ProtocolTVLChart identifier={identifier} title={title} />;
    case 'chain_tvl':
      return <ChainTVLChart identifier={identifier} title={title} />;
    case 'protocol_fees':
      return <ProtocolFeesChart identifier={identifier} title={title} />;
    case 'kast_growth':
      return <KastGrowthChart />;
    default:
      return null;
  }
}
