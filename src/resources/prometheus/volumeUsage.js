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

// Guest filesystem usage per volume, with block allocation behind it. The
// collector keys the rollup off the volume uuid in the disk serial; an
// unattached or agentless volume has no guest reading and falls back.
const QUERIES = {
  guestUsed: 'sum by (volume) (cube_volume_guest_used_bytes)',
  guestTotal: 'sum by (volume) (cube_volume_guest_total_bytes)',
  allocated:
    'sum by (disk_id) (cube_storage_disk_allocated_bytes{kind="volume"})',
  provisioned:
    'sum by (disk_id) (cube_storage_disk_provisioned_bytes{kind="volume"})',
};

// Two label names on purpose: the guest series are keyed by volume uuid, the
// block series by the rbd image name, which is the uuid with a volume- prefix.
export const fetchVolumeUsage = async () => {
  const [guest, block] = await Promise.all([
    fetchUsageMaps(
      { guestUsed: QUERIES.guestUsed, guestTotal: QUERIES.guestTotal },
      'volume'
    ),
    fetchUsageMaps(
      { allocated: QUERIES.allocated, provisioned: QUERIES.provisioned },
      'disk_id'
    ),
  ]);
  return { ...guest, ...block };
};

// Guest filesystem first, block allocation second. `blockLevel` tells the
// renderer to tag the row, because allocation is not usage: blocks stay
// allocated once written, so it runs ahead and never falls.
export const getVolumeUsage = (usage, id) => {
  const used = (usage.guestUsed || {})[id];
  const total = (usage.guestTotal || {})[id];
  if (used !== undefined && total) {
    return {
      percent: (100 * used) / total,
      used,
      total,
      blockLevel: false,
    };
  }

  const key = `volume-${id}`;
  const allocated = (usage.allocated || {})[key];
  const provisioned = (usage.provisioned || {})[key];
  if (allocated !== undefined && provisioned) {
    return {
      percent: (100 * allocated) / provisioned,
      used: allocated,
      total: provisioned,
      blockLevel: true,
    };
  }

  return { percent: undefined };
};
