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
import { StepAction } from 'containers/Action';
import globalSegmentStore from 'src/stores/masakari/segments';
import React from 'react';
import { Button, Modal } from 'antd';
import { toJS } from 'mobx';
import { QuestionCircleFilled } from '@ant-design/icons';
import stylesConfirm from 'src/components/Confirm/index.less';
import globalHostStore from 'src/stores/masakari/hosts';
import Notify from 'src/components/Notify';
import { getHostCreateBody } from 'resources/masakari/segment';
import StepHost from './StepHost';
import StepSegment from './StepSegment';

export class StepCreate extends StepAction {
  static id = 'instance-ha-create';

  static title = t('Create Segment');

  static path = '/ha/segments-admin/create-step-admin';

  init() {
    this.store = globalHostStore;
    this.state = { btnIsLoading: false, ...this.state };
    // Hosts already added to the created segment, so a retry after a
    // partial failure only sends the ones that are still missing.
    this.addedHosts = new Set();
    this.failedHosts = [];
  }

  static policy = 'get_images';

  static allowed() {
    return Promise.resolve(true);
  }

  get name() {
    return t('Create Segment');
  }

  get instanceName() {
    const { segment_name } = this.values || {};
    return segment_name;
  }

  get errorText() {
    if (this.failedHosts.length) {
      return t(
        'Segment {name} was created, but these hosts could not be added: {hosts}. Confirm again to retry them, or cancel to delete the segment.',
        { name: this.instanceName, hosts: this.failedHosts.join(', ') }
      );
    }
    return super.errorText;
  }

  get listUrl() {
    return this.getRoutePath('masakariSegments');
  }

  get hasConfirmStep() {
    return false;
  }

  next() {
    this.currentRef.current.wrappedInstance.checkFormInput(
      (values) => {
        this.updateData(values);

        if (this.state.current === 0) {
          this.setState({ btnIsLoading: true });
          const { segment_name, recovery_method, service_type, description } =
            this.state.data;

          globalSegmentStore
            .create({
              segment: {
                name: segment_name,
                recovery_method,
                service_type,
                description,
              },
            })
            .then(
              (item) => {
                this.setState(
                  { extra: toJS({ createdSegmentId: item.segment.uuid }) },
                  () => {
                    this.setState((prev) => ({ current: prev.current + 1 }));
                  }
                );
              },
              (err) => {
                this.responseError = err;
                const { response: { data: responseData } = {} } = err;
                Notify.errorWithDetail(responseData, this.errorText);
              }
            )
            .finally(() => {
              this.setState({ btnIsLoading: false });
            });
        }
      },
      () => this.setState({ btnIsLoading: false })
    );
  }

  getNextBtn() {
    const { current } = this.state;
    if (current >= this.steps.length - 1) {
      return null;
    }
    const { title } = this.steps[current + 1];
    return (
      <Button
        type="primary"
        onClick={() => this.next()}
        loading={this.state.btnIsLoading}
      >
        {`${t('Next')}: ${title}`}
      </Button>
    );
  }

  getPrevBtn() {
    const { current } = this.state;
    if (current === 0) {
      return null;
    }
    const preTitle = this.steps[current - 1].title;
    return (
      <Button style={{ margin: '0 8px' }} onClick={() => this.prev()}>
        {`${t('Previous')}: ${preTitle}`}
      </Button>
    );
  }

  async prev() {
    const { createdSegmentId } = this.state.extra || {};
    if (createdSegmentId) {
      try {
        // Wait for the delete, otherwise creating the segment again under
        // the same name races it and masakari rejects the duplicate.
        await globalSegmentStore.delete({ id: createdSegmentId });
      } catch (err) {
        const { response: { data } = {} } = err || {};
        Notify.errorWithDetail(
          data,
          t('Unable to {action}.', { action: t('delete segments') })
        );
        return;
      }
      this.addedHosts = new Set();
      this.failedHosts = [];
      this.setState({ extra: {} });
    }
    this.currentRef.current.wrappedInstance.checkFormInput(
      this.updateDataOnPrev,
      this.updateDataOnPrev
    );
  }

  onClickCancel = () => {
    if (this.state.current !== 0) {
      Modal.confirm({
        title: t('Confirm'),
        icon: <QuestionCircleFilled className={stylesConfirm.warn} />,
        content: t(
          'The created segment will be deleted. Are you sure you want to cancel?'
        ),
        okText: t('Confirm'),
        cancelText: t('Cancel'),
        loading: true,
        onOk: () => {
          return globalSegmentStore
            .delete({ id: this.state.extra.createdSegmentId })
            .finally(() => this.routing.push(this.listUrl));
        },
      });
    } else {
      this.routing.push(this.listUrl);
    }
  };

  get steps() {
    return [
      { title: t('Create Segment'), component: StepSegment },
      { title: t('Add Host'), component: StepHost },
    ];
  }

  onSubmit = async (values) => {
    const { createdSegmentId } = this.state.extra;
    const { selectedRows = [] } = values.name || {};
    const pending = selectedRows.filter((it) => !this.addedHosts.has(it.host));
    const results = await Promise.allSettled(
      pending.map((it) =>
        this.store.create(
          createdSegmentId,
          getHostCreateBody({ ...it, name: it.host })
        )
      )
    );

    this.failedHosts = [];
    results.forEach((result, index) => {
      const { host } = pending[index];
      if (result.status === 'fulfilled') {
        this.addedHosts.add(host);
        return;
      }
      this.failedHosts.push(host);
      const { response: { data } = {} } = result.reason || {};
      Notify.errorWithDetail(
        data,
        t('Unable to add host {name} to the segment.', { name: host })
      );
    });

    if (this.failedHosts.length) {
      throw new Error(this.errorText);
    }
    return results;
  };
}

export default inject('rootStore')(observer(StepCreate));
