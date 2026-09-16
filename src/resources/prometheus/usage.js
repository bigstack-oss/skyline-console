// Copyright 2026 99cloud
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import client from 'client/skyline';

// Shared by the instance and volume lists. One instant query per metric
// returns every row at once, rather than a request per table row.

// Collapses a Prometheus vector into { <labelValue>: number }, keyed by the
// label the calling page joins on.
export const toMap = (result, key) =>
  (result || []).reduce((acc, item) => {
    const id = (item.metric || {})[key];
    const value = parseFloat((item.value || [])[1]);
    if (id && !Number.isNaN(value)) {
      acc[id] = value;
    }
    return acc;
  }, {});

// Runs { name: query } in parallel. A failed query yields an empty map for that
// metric only: one metric being unavailable must not blank the others.
export const fetchUsageMaps = async (queries, key) => {
  const entries = await Promise.all(
    Object.entries(queries).map(async ([name, query]) => {
      try {
        const res = await client.query.list({ query });
        return [name, toMap(((res || {}).data || {}).result, key)];
      } catch (e) {
        return [name, {}];
      }
    })
  );

  return entries.reduce((acc, [name, map]) => {
    acc[name] = map;
    return acc;
  }, {});
};

// Boundaries match tpl_alert_vm_disk.tick: normal below 50, informational from
// 75, warning from 85, critical from 95. The bar collapses warn and crit into
// one red band -- a row at 90% and a row at 96% both need attention now.
export const usageColor = (value) => {
  if (value < 50) {
    return globalCSS.primaryColor;
  }
  if (value < 75) {
    return globalCSS.successColor;
  }
  if (value < 85) {
    return globalCSS.warnDarkColor;
  }
  return globalCSS.dangerColor;
};

export const formatUsagePercent = (value) =>
  value === undefined || value === null || Number.isNaN(value)
    ? '-'
    : `${value.toFixed(1)}%`;
