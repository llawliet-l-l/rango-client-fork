import type { WidgetColors } from '@arthur2079/widget-embedded';

export type Type = 'Destination' | 'Source';

export type ColorsType = { light?: WidgetColors; dark?: WidgetColors };
export type PresetType = Array<
  ColorsType & {
    id: number | string;
  }
>;
