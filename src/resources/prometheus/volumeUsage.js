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

// How much of a thin-provisioned volume the pool has actually had to allocate.
// There is no guest reading here: a volume is a block device, and nothing maps
// one back to a guest mountpoint, so allocation is the only per-volume figure.
const QUERIES = {
  allocated:
    'sum by (disk_id) (cube_storage_disk_allocated_bytes{kind="volume"})',
  provisioned:
    'sum by (disk_id) (cube_storage_disk_provisioned_bytes{kind="volume"})',
};

export const fetchVolumeUsage = () => fetchUsageMaps(QUERIES, 'disk_id');

// The collector names an rbd image `volume-<uuid>`; the table row carries the
// bare uuid.
export const getVolumeUsage = (usage, id) => {
  const key = `volume-${id}`;
  const allocated = (usage.allocated || {})[key];
  const provisioned = (usage.provisioned || {})[key];
  if (allocated === undefined || !provisioned) {
    return { percent: undefined };
  }

  return {
    percent: (100 * allocated) / provisioned,
    allocated,
    provisioned,
  };
};
