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

import { action, observable } from 'mobx';
import { cosApiClientV1 } from 'src/apis/cosApi';
import { imageApi } from 'src/apis/imageApi';
import BaseStore from 'stores/base';

export class CosImageStore extends BaseStore {
  @observable
  members = [];

  @observable
  imageMaterials = [];

  @observable
  isImageMaterialsLoading = false;

  @observable
  isImageCreating = false;

  @observable
  error = null;

  abortController = null;

  get client() {
    return cosApiClientV1;
  }

  get fetchListByLimit() {
    return true;
  }

  get paramsFunc() {
    return this.paramsFuncPage;
  }

  updateParamsSortPage = (params, sortKey, sortOrder) => {
    if (sortKey && sortOrder) {
      params.sort_key = sortKey;
      params.sort_dir = sortOrder === 'descend' ? 'desc' : 'asc';
    }
  };

  updateParamsSort = this.updateParamsSortPage;

  get paramsFuncPage() {
    return (params) => {
      const { current, all_projects, ...rest } = params;
      return {
        ...rest,
      };
    };
  }

  get mapperBeforeFetchProject() {
    return (data) => ({
      originData: { ...data },
      project_name: data.project,
    });
  }

  itemInCurrentProject = ({ project, visibility }, all_projects) => {
    // use for neutron resource in admin project
    if (all_projects) return true;

    return project === this.currentProjectId || visibility === 'public';
  };

  listDidFetchProject(items) {
    return items;
  }

  // TODO: there is no update image api yet
  @action
  async update({ id }, newBody) {
    return this.client.patch(id, newBody);
  }

  @action
  async getMembers(id) {
    const result = await this.client.members.list(id);
    const { members = [] } = result || {};
    this.members = members;
    return members;
  }

  @action
  async createMember(id, member) {
    const body = {
      member,
    };
    await this.client.members.create(id, body);
    return this.updateMemberStatus(id, member, 'accepted');
  }

  @action
  async updateMemberStatus(id, member, status) {
    const body = {
      status,
    };
    return this.client.members.update(id, member, body);
  }

  @action
  async deleteMember(id, member) {
    return this.client.members.delete(id, member);
  }

  @action
  async updateMembers(id, adds, dels) {
    this.isSubmitting = true;
    await Promise.all(adds.map((it) => this.createMember(id, it)));
    return this.submitting(
      Promise.all(dels.map((it) => this.deleteMember(id, it)))
    );
  }

  @action
  async fetchList({
    limit,
    page,
    sortKey,
    sortOrder,
    conditions,
    timeFilter,
    ...filters
  } = {}) {
    this.list.isLoading = true;

    const { images, page: pagination } = await imageApi.getImageList({
      pageSize: limit,
      pageNum: page,
    });

    this.list.update({
      data: images,
      total: pagination.totalItemCount || 0,
      limit: pagination.size || 10,
      page: pagination.number || 1,
      sortKey,
      sortOrder,
      filters,
      timeFilter,
      isLoading: false,
    });

    return images;
  }

  @action
  async fetchImageMaterials() {
    this.isImageMaterialsLoading = true;
    this.error = null;

    try {
      const response = await imageApi.getImageMaterials();
      this.imageMaterials = response || [];
    } catch (error) {
      this.error = error;
    } finally {
      this.isImageMaterialsLoading = false;
    }
  }

  @action
  async createImage(queryParams, body) {
    this.isImageCreating = true;

    try {
      await imageApi.createImage(queryParams, body);
    } catch (error) {
      this.error = error;
    } finally {
      this.isImageCreating = false;
    }
  }
}

const cosImageStore = new CosImageStore();
export default cosImageStore;
