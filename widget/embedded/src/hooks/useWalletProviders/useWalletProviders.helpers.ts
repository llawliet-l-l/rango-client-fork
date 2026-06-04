import type { ProviderInterface } from '@arthur2079/wallets-react';

import { Provider } from '@arthur2079/wallets-core';

export function hashProviders(
  providers: (string | ProviderInterface | Provider)[]
): string {
  return providers
    .map((provider) => {
      if (typeof provider === 'string') {
        return provider;
      }
      if (provider instanceof Provider) {
        return provider.id;
      }
      return provider.config.type;
    })
    .join('-');
}
