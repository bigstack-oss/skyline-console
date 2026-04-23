export const RULE_TYPE_BANDWIDTH_LIMIT = 'bandwidth_limit';
export const RULE_TYPE_DSCP_MARKING = 'dscp_marking';
export const RULE_TYPE_MINIMUM_BANDWIDTH = 'minimum_bandwidth';
export const RULE_TYPE_MINIMUM_PACKET_RATE = 'minimum_packet_rate';

export const RULE_DIRECTION_INGRESS = 'ingress';
export const RULE_DIRECTION_EGRESS = 'egress';

const DSCP_MARKING_OPTIONS =
  '0,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,46,48,56';

export const dscpMarkingItems = DSCP_MARKING_OPTIONS.split(',').map((item) => ({
  label: item,
  value: item,
}));
