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

import { fetchUsageMaps } from './usage';

// Disk has two sources: what the guest filesystem reports, and the block
// layer behind it for instances whose agent does not answer. They measure
// different things, so a fallback row is tagged rather than presented as the
// same number.
const QUERIES = {
  cpu: 'clamp_max(rate(ceilometer_cpu[5m]) / 1e7 / ceilometer_vcpus, 100)',
  memory:
    '(1 - cube_instance_memory_usable_mb / cube_instance_memory_visible_mb) * 100',
  disk: '100 * sum by (resource) (cube_instance_guest_used_bytes) / sum by (resource) (cube_instance_guest_total_bytes)',
  diskAllocated:
    '100 * sum by (resource) (cube_storage_disk_allocated_bytes) / sum by (resource) (cube_storage_disk_provisioned_bytes)',
};

export const fetchInstanceUsage = () => fetchUsageMaps(QUERIES, 'resource');

// Guest filesystem first, block allocation second. `blockLevel` tells the
// renderer to tag the value, because the fallback is not filesystem usage.
export const getDiskUsage = (usage, id) => {
  const exact = (usage.disk || {})[id];
  if (exact !== undefined) {
    return { value: exact, blockLevel: false };
  }
  const allocated = (usage.diskAllocated || {})[id];
  if (allocated !== undefined) {
    return { value: allocated, blockLevel: true };
  }
  return { value: undefined, blockLevel: false };
};
