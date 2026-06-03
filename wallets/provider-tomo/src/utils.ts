import type { Provider } from './types.js';
import type { ProviderAPI as EvmProviderApi } from '@arthur2079/wallets-core/namespaces/evm';

import { Networks } from '@arthur2079/wallets-shared';

export function tomo() {
  const { tomo_evm } = window;

  if (!tomo_evm) {
    return null;
  }

  const instances = new Map();

  instances.set(Networks.ETHEREUM, tomo_evm);

  return instances;
}

export function getInstanceOrThrow(): Provider {
  const instances = tomo();

  if (!instances) {
    throw new Error('Tomo is not injected. Please check your wallet.');
  }

  return instances;
}

export function evmTomo(): EvmProviderApi {
  const instances = tomo();
  const evmInstance = instances?.get(Networks.ETHEREUM);
  if (!evmInstance) {
    throw new Error(
      'Tomo not injected or EVM not enabled. Please check your wallet.'
    );
  }
  return evmInstance as EvmProviderApi;
}
