import type { Provider } from '@hub3js/core';
import type { VersionedProviders } from '@hub3js/core/utils';
import type { Environments as TonConnectEnvironments } from '@arthur2079/provider-tonconnect';
import type { Environments as WalletConnectEnvironments } from '@arthur2079/provider-walletconnect-2';
import type { ProviderInterface } from '@arthur2079/wallets-react';

import { versions as binance } from '@arthur2079/provider-binance';
import { versions as bitget } from '@arthur2079/provider-bitget';
import { versions as braavos } from '@arthur2079/provider-braavos';
import { versions as brave } from '@arthur2079/provider-brave';
import { versions as coin98 } from '@arthur2079/provider-coin98';
import { versions as coinbase } from '@arthur2079/provider-coinbase';
import { versions as ctrl } from '@arthur2079/provider-ctrl';
import { versions as defaultInjected } from '@arthur2079/provider-default';
import { versions as enkrypt } from '@arthur2079/provider-enkrypt';
import { versions as exodus } from '@arthur2079/provider-exodus';
import { versions as freighter } from '@arthur2079/provider-freighter';
import { versions as gemwallet } from '@arthur2079/provider-gemwallet';
import { versions as ledger } from '@arthur2079/provider-ledger';
import { versions as mathwallet } from '@arthur2079/provider-math-wallet';
import { versions as metamask } from '@arthur2079/provider-metamask';
import { versions as noirWallet } from '@arthur2079/provider-noir-wallet';
import { versions as okx } from '@arthur2079/provider-okx';
import { versions as phantom } from '@arthur2079/provider-phantom';
import { versions as rabby } from '@arthur2079/provider-rabby';
import { versions as ready } from '@arthur2079/provider-ready';
import { versions as safe } from '@arthur2079/provider-safe';
import { versions as safepal } from '@arthur2079/provider-safepal';
import { versions as slush } from '@arthur2079/provider-slush';
import { versions as solflare } from '@arthur2079/provider-solflare';
import { versions as taho } from '@arthur2079/provider-taho';
import { versions as tokenPocket } from '@arthur2079/provider-tokenpocket';
import { versions as tomo } from '@arthur2079/provider-tomo';
import { versions as tonconnect } from '@arthur2079/provider-tonconnect';
import { versions as trezor } from '@arthur2079/provider-trezor';
import { versions as tronLink } from '@arthur2079/provider-tron-link';
import { versions as trustwallet } from '@arthur2079/provider-trustwallet';
import { versions as unisat } from '@arthur2079/provider-unisat';
import { versions as vultisig } from '@arthur2079/provider-vultisig';
import * as walletconnect2 from '@arthur2079/provider-walletconnect-2';
import { versions as xverse } from '@arthur2079/provider-xverse';
import { legacyProviderImportsToVersionsInterface } from '@arthur2079/wallets-core/utils';
import { type WalletType, WalletTypes } from '@arthur2079/wallets-shared';

import { isWalletExcluded, lazyProvider } from './helpers.js';

interface Options {
  walletconnect2: WalletConnectEnvironments;
  selectedProviders?: (WalletType | ProviderInterface | Provider)[];
  tonConnect?: TonConnectEnvironments;
}

export const allProviders = (
  options?: Options
): (() => VersionedProviders)[] => {
  const providers = options?.selectedProviders || [];

  if (
    !isWalletExcluded(providers, {
      type: WalletTypes.WALLET_CONNECT_2,
      name: 'WalletConnect',
    })
  ) {
    if (!!options?.walletconnect2?.WC_PROJECT_ID) {
      walletconnect2.init(options.walletconnect2);
    } else {
      throw new Error(
        'WalletConnect has been included in your providers. Passing a Project ID is required. Make sure you are passing "WC_PROJECT_ID".'
      );
    }
  }

  return [
    safe,
    defaultInjected,
    metamask,
    lazyProvider(legacyProviderImportsToVersionsInterface(walletconnect2)),
    tonconnect,
    phantom,
    ready,
    trustwallet,
    tronLink,
    enkrypt,
    bitget,
    binance,
    ctrl,
    xverse,
    safepal,
    brave,
    coin98,
    coinbase,
    freighter,
    exodus,
    mathwallet,
    okx,
    tokenPocket,
    tomo,
    taho,
    braavos,
    ledger,
    rabby,
    trezor,
    solflare,
    slush,
    unisat,
    vultisig,
    gemwallet,
    noirWallet,
  ];
};
