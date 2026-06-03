import type { WidgetConfig } from '../../types';
import type { LegacyEventHandler as EventHandler } from '@arthur2079/wallets-core/legacy';

export type PropTypes = {
  onUpdateState?: EventHandler;
  config: WidgetConfig;
};
