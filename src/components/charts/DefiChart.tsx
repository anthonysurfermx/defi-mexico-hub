import { ProtocolTVLChart } from './ProtocolTVLChart';
import { ChainTVLChart } from './ChainTVLChart';
import { ProtocolFeesChart } from './ProtocolFeesChart';
import { KastGrowthChart } from './KastGrowthChart';
import { TetherDominanceChart } from './TetherDominanceChart';
import { USDTGrowthChart } from './USDTGrowthChart';
import { USDTChainsChart } from './USDTChainsChart';
import { MXNStablecoinsChart } from './MXNStablecoinsChart';
import { TetherGrowthThesisChart } from './TetherGrowthThesisChart';
import { LatamExchangeHeatChart } from './LatamExchangeHeatChart';
import { LatamAdoptionChart } from './LatamAdoptionChart';
import { LongshotBiasChart } from './LongshotBiasChart';
import { MakerTakerEdgeChart } from './MakerTakerEdgeChart';
import { KellyPositionChart } from './KellyPositionChart';
import { PolymarketFlowChart } from './PolymarketFlowChart';

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
    case 'tether_dominance':
      return <TetherDominanceChart />;
    case 'usdt_growth':
      return <USDTGrowthChart />;
    case 'usdt_chains':
      return <USDTChainsChart />;
    case 'mxn_stablecoins':
      return <MXNStablecoinsChart />;
    case 'tether_growth_thesis':
      return <TetherGrowthThesisChart />;
    case 'latam_exchange_heat':
      return <LatamExchangeHeatChart />;
    case 'latam_adoption':
      return <LatamAdoptionChart />;
    case 'longshot_bias':
      return <LongshotBiasChart />;
    case 'maker_taker_edge':
      return <MakerTakerEdgeChart />;
    case 'kelly_position':
      return <KellyPositionChart />;
    case 'polymarket_flow':
      return <PolymarketFlowChart />;
    default:
      return null;
  }
}
