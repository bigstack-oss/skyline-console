// Copyright 2021 99cloud
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

import { isEmpty } from 'lodash';
import { multiTip } from './volume';

export const consumerTypes = {
  'front-end': t('Frontend'),
  'back-end': t('Backend'),
  both: t('Both of Frontend and Backend'),
};

export const creationMethod = {
  manu: t('Manu'),
  auto: t('Auto'),
};

export const controls = {
  'front-end': t('Front End'),
  'back-end': t('Back End'),
};

export const volumeTypeColumns = [
  {
    title: t('Name'),
    dataIndex: 'name',
  },
  {
    title: t('Description'),
    dataIndex: 'description',
    isHideable: true,
    valueRender: 'noValue',
  },
  {
    title: t('Public'),
    dataIndex: 'is_public',
    valueRender: 'yesNo',
  },
  {
    title: t('Shared'),
    dataIndex: 'multiattach',
    valueRender: 'yesNo',
    titleTip: multiTip,
    width: 120,
  },
];

export const volumeTypeFilters = [
  {
    label: t('Name'),
    name: 'name',
  },
];

export const volumeTypeSelectProps = {
  columns: volumeTypeColumns,
  filterParams: volumeTypeFilters,
};

// Types that exist in Cinder but must never be offered when creating,
// attaching or retyping a volume. `__DEFAULT__` is Cinder's own placeholder
// type; CubeCOS always configures a real default_volume_type instead. The
// admin Volume Types page and quota screens still list every type.
export const HIDDEN_VOLUME_TYPE_NAMES = ['__DEFAULT__'];

// Picked when Cinder's default type cannot be read (e.g. a policy denies
// GET /types/default to the user) or is itself hidden.
export const FALLBACK_VOLUME_TYPE_NAME = 'CubeStorage';

export const isHiddenVolumeType = (type) =>
  HIDDEN_VOLUME_TYPE_NAMES.includes((type || {}).name);

export const filterVolumeTypes = (types = []) =>
  (types || []).filter((it) => !isHiddenVolumeType(it));

// The type a picker should preselect: Cinder's configured default, then
// CubeStorage (case-insensitive), then the first visible type.
export const getPreferredVolumeType = (types = [], defaultType) => {
  const visible = filterVolumeTypes(types);
  const { id, name } = defaultType || {};
  const fallbackName = FALLBACK_VOLUME_TYPE_NAME.toLowerCase();
  return (
    (id && visible.find((it) => it.id === id)) ||
    (name && visible.find((it) => it.name === name)) ||
    visible.find((it) => (it.name || '').toLowerCase() === fallbackName) ||
    visible[0]
  );
};

export const hasEncryption = (volume) => {
  const { encryption } = volume || {};
  if (!encryption || isEmpty(encryption)) {
    return false;
  }
  return !encryption.deleted_at;
};
