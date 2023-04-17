import BlackSSLProvider from './BlackSSLProvider';
import ClashProvider from './ClashProvider';
import CustomProvider from './CustomProvider';
import ShadowsocksJsonSubscribeProvider from './ShadowsocksJsonSubscribeProvider';
import ShadowsocksrSubscribeProvider from './ShadowsocksrSubscribeProvider';
import ShadowsocksSubscribeProvider from './ShadowsocksSubscribeProvider';
import SsdProvider from './SsdProvider';
import TrojanProvider from './TrojanProvider';
import V2rayNSubscribeProvider from './V2rayNSubscribeProvider';

export type PossibleProviderType =
  | BlackSSLProvider
  | ShadowsocksJsonSubscribeProvider
  | ShadowsocksSubscribeProvider
  | CustomProvider
  | V2rayNSubscribeProvider
  | ShadowsocksrSubscribeProvider
  | ClashProvider
  | SsdProvider
  | TrojanProvider;
