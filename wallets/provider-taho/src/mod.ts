import { defineVersions } from '@arthur2079/wallets-core/utils';

import { buildProvider } from './provider.js';

const versions = () =>
  defineVersions().version('1.0.0', buildProvider()).build();

export { versions };
