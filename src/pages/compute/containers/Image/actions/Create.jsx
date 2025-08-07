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

import { inject, observer } from 'mobx-react';
import { FormAction } from 'containers/Action';
import { projectTableOptions } from 'resources/keystone/project';
import { ProjectStore } from 'stores/keystone/project';
import cosImageStore from 'stores/cos/image';
import { responseToOptions } from 'utils/image';
import { removeExtension } from 'utils/file';
import { volumeApi } from 'src/apis/volumeApi';
import { imageApi } from 'src/apis/imageApi';

export class CreateForm extends FormAction {
  constructor(props) {
    super(props);
    this.state = {
      sourceFromAnotherHypervisor: false,
      isSelectedImageReserved: false,
      selectedProjectIds: [],
    };
  }

  init() {
    this.store = cosImageStore;
    this.projectStore = new ProjectStore();

    Promise.all([
      this.isAdminPage ? this.getProjects() : Promise.resolve(),
      this.getImageMaterials(),
    ]).catch(console.error);
  }

  static id = 'image-create';

  static title = t('Create Image');

  static path = (_, containerProp) => {
    const { isAdminPage } = containerProp;
    return isAdminPage
      ? '/compute/image-admin/create'
      : '/compute/image/create';
  };

  get listUrl() {
    return this.getRoutePath('image');
  }

  get name() {
    return t('Create image');
  }

  get labelCol() {
    return {
      xs: { span: 6 },
      sm: { span: 5 },
    };
  }

  get hasRequestCancelCallback() {
    return true;
  }

  static policy = ['add_image', 'upload_image'];

  static aliasPolicy = ['glance:add_image', 'glance:upload_image'];

  static allowed() {
    return Promise.resolve(true);
  }

  async getProjects() {
    await this.projectStore.fetchProjectsWithDomain();
    this.updateDefaultValue();
  }

  async getImageMaterials() {
    await this.store.fetchImageMaterials();
  }

  get projects() {
    return this.projectStore.list.data || [];
  }

  get defaultValue() {
    return {
      visibility: this.state.sourceFromAnotherHypervisor ? undefined : 'public',
    };
  }

  get imageMaterials() {
    const {
      reservedImages = [],
      oses = [],
      destinations = [],
      domains = [],
      visibilities = [],
      projects = [],
    } = this.store.imageMaterials || {};

    return {
      reservedImages,
      oses: responseToOptions(oses),
      destinations: responseToOptions(destinations),
      domains: responseToOptions(domains),
      visibilities: responseToOptions(visibilities),
      projects: responseToOptions(projects),
    };
  }

  get isImageMaterialsLoading() {
    return this.store.isImageMaterialsLoading;
  }

  updateFormValues = (values) => {
    Object.entries(values).forEach(([field, value]) =>
      this.updateFormValue(field, value)
    );
  };

  resetFormValue = () => {
    this.setState({
      isSelectedImageReserved: false,
      sourceFromAnotherHypervisor: false,
      selectedProjectIds: [],
    });

    this.updateFormValues({
      os: undefined,
      project: { selectedRowKeys: [], selectedRows: [] },
      destination: undefined,
      domain: undefined,
      source: false,
      visibility: 'public',
    });
  };

  checkIsSelectedImageReserved = (file) => {
    if (!file) return this.resetFormValue();

    const selectedFileName = removeExtension(file.name);

    const reservedImage = this.imageMaterials.reservedImages.find(
      (image) => image.name === selectedFileName
    );

    if (!reservedImage) return this.resetFormValue();

    const sourceFromAnotherHypervisor =
      !!reservedImage.sourceFromAnotherHypervisor;

    const formValues = {
      os: reservedImage.os,
      destination: reservedImage.destination,
      domain: reservedImage.domain,
      source: sourceFromAnotherHypervisor,
      visibility: reservedImage.visibility,
    };

    this.setState({
      isSelectedImageReserved: true,
      sourceFromAnotherHypervisor,
    });

    if (this.isAdminPage) {
      const reservedProject = this.projects.find(
        (project) => project.name === reservedImage.project
      );
      if (reservedProject) {
        const selectedProjectIds = [reservedProject.id];
        this.setState({ selectedProjectIds });
        formValues.project = {
          selectedRowKeys: selectedProjectIds,
          selectedRows: [reservedProject],
        };
      }
    }

    this.updateFormValues(formValues);
  };

  validateFile = (_, value) => {
    return value
      ? Promise.resolve()
      : Promise.reject(t('Please select a file'));
  };

  get formItems() {
    return [
      {
        name: 'file',
        label: t('Select image'),
        type: 'upload',
        validator: this.validateFile,
        required: true,
        buttonText: t('Select image file'),
        displayButton: false,
        onChange: (file) => this.checkIsSelectedImageReserved(file),
      },
      {
        name: 'name',
        label: t('Specify Image Name'),
        type: 'input-name',
        isImage: true,
        required: true,
      },
      {
        name: 'project',
        label: t('Owned Project'),
        type: 'select-table',
        required: this.isAdminPage,
        hidden: !this.isAdminPage,
        data: this.projects || [],
        initValue: {
          selectedRowKeys: this.state.selectedProjectIds,
        },
        isLoading: this.projectStore.list.isLoading,
        disabledFunc: () => {
          return this.state.isSelectedImageReserved;
        },
        ...projectTableOptions,
      },
      {
        name: 'os',
        label: t('OS'),
        type: 'select',
        required: true,
        options: this.imageMaterials?.oses || [],
        isLoading: this.isImageMaterialsLoading,
        disabled: this.state.isSelectedImageReserved,
      },
      {
        name: 'destination',
        label: t('Destination'),
        type: 'select',
        required: true,
        options: this.imageMaterials?.destinations || [],
        isLoading: this.isImageMaterialsLoading,
        disabled: this.state.isSelectedImageReserved,
      },
      {
        name: 'domain',
        label: t('Domain'),
        type: 'select',
        required: true,
        options: this.imageMaterials?.domains || [],
        isLoading: this.isImageMaterialsLoading,
        disabled: this.state.isSelectedImageReserved,
      },
      {
        name: 'source',
        label: t('Source'),
        type: 'check',
        content: t('From another hypervisor'),
        disabled: this.state.isSelectedImageReserved,
        onChange: (value) =>
          this.setState({ sourceFromAnotherHypervisor: value }),
      },
      {
        name: 'visibility',
        label: t('Visibility'),
        type: 'radio',
        optionType: 'default',
        options: this.imageMaterials?.visibilities || [],
        hidden: this.state.sourceFromAnotherHypervisor,
        isLoading: this.isImageMaterialsLoading,
        disabled: this.state.isSelectedImageReserved,
      },
    ];
  }

  onSubmit = async (values) => {
    const selectedProject = this.isAdminPage
      ? values.project?.selectedRows?.[0]?.name
      : 'admin';

    const queryParams = {
      file: values.name,
      name: values.name,
      os: values.os,
      destination: values.destination,
      domain: values.domain,
      sourceFromAnotherHypervisor: this.state.sourceFromAnotherHypervisor,
      project: selectedProject,
    };

    if (!this.state.sourceFromAnotherHypervisor) {
      queryParams.visibility = values.visibility;
    }

    const body = values.file;

    // If `sourceFromAnotherHypervisor` is true, create it as a volume from image.
    // Otherwise, create it as an image.
    if (this.state.sourceFromAnotherHypervisor) {
      await volumeApi.createVolumeFromImage(queryParams, body);
      this.props.history.push(
        this.isAdminPage ? '/storage/volume-admin' : '/storage/volume'
      );
    } else {
      await imageApi.createImage(queryParams, body);
      this.props.history.push(
        this.isAdminPage ? '/compute/image-admin' : '/compute/image'
      );
    }
  };
}

export default inject('rootStore')(observer(CreateForm));
