import {
  RULE_TYPE_BANDWIDTH_LIMIT,
  RULE_TYPE_DSCP_MARKING,
  RULE_DIRECTION_INGRESS,
  RULE_DIRECTION_EGRESS,
} from './const';

/**
 * Get the label of the rule type
 * @param {string} ruleType
 * @returns string
 */
export const getRuleTypeLabel = (ruleType) => {
  if (ruleType === RULE_TYPE_BANDWIDTH_LIMIT) return t('Bandwidth limit');
  if (ruleType === RULE_TYPE_DSCP_MARKING) return t('DSCP Marking');
  return '-';
};

/**
 * Get the label of the rule direction
 * @param {string} ruleDirection
 * @returns string
 */
export const getRuleDirectionLabel = (ruleDirection) => {
  if (ruleDirection === RULE_DIRECTION_INGRESS) return t('Ingress');
  if (ruleDirection === RULE_DIRECTION_EGRESS) return t('Egress');
  return '-';
};

export const getBandwidthLimitOptions = (rule) => {
  if (rule.type === RULE_TYPE_BANDWIDTH_LIMIT) {
    const limitInMbps = rule?.max_kbps ? rule.max_kbps / 1024 : '-';
    const burstInMbps = rule?.max_burst_kbps ? rule.max_burst_kbps / 1024 : '-';
    return {
      limitInMbps,
      burstInMbps,
    };
  }
  return {};
};

/**
 * Get the label of the rule detail
 * @param {*} rule
 * @returns string
 */
export const getRuleDetail = (rule) => {
  if (rule.type === RULE_TYPE_BANDWIDTH_LIMIT) {
    const { limitInMbps, burstInMbps } = getBandwidthLimitOptions(rule);
    return `Max ${limitInMbps} Mbps, Burst ${burstInMbps} Mbps`;
  }
  if (rule.type === RULE_TYPE_DSCP_MARKING) {
    return `${rule.dscp_mark}`;
  }
  return '-';
};

/**
 * Get full summary of the rule, including type, direction and detail
 * @param {Object} rule
 * @returns string
 */
export const getRuleSummary = (rule) => {
  const type = getRuleTypeLabel(rule.type);
  const direction = getRuleDirectionLabel(rule.direction);
  const detail = getRuleDetail(rule);

  if (direction === '-') return `${type}: ${detail}`;
  return `${type} (${direction}): ${detail}`;
};
