import { defineVersions } from '@arthur2079/wallets-core/utils';

import { buildLegacyProvider } from './legacy/index.js';
import { buildProvider } from './provider.js';

const versions = () =>
  defineVersions()
    .version('0.0.0', buildLegacyProvider())
    .version('1.0.0', buildProvider())
    .build();

export { versions };
