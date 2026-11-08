import { useScanIntl } from '@/shared/i18n';
import type { ChannelFacet as ChannelFacetItem } from './buildAutoFilterFacets';
import { FacetChip } from './FacetChip';
import { FacetSection } from './FacetSection';

export type ChannelFacetProps = {
  channels: readonly ChannelFacetItem[];
  selected: number | null | undefined;
  onToggle: (channel: number) => void;
};

export function ChannelFacet({ channels, selected, onToggle }: ChannelFacetProps) {
  const { formatMessage } = useScanIntl();

  return (
    <FacetSection title={formatMessage('scan.filterSidebar.section.channel')}>
      {channels.map(({ channel, count }) => (
        <FacetChip
          key={channel}
          label={formatMessage('scan.filterSidebar.chipCount', {
            label: String(channel),
            count,
          })}
          selected={selected === channel}
          onClick={() => onToggle(channel)}
        />
      ))}
    </FacetSection>
  );
}
