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

import { ConfirmAction } from 'containers/Action';
import { firstUpperCase } from 'utils';
import globalQoSPolicyStore from 'stores/neutron/qos-policy';

export default class DeletePolicy extends ConfirmAction {
  get id() {
    return 'delete';
  }

  get title() {
    return t('Delete QoS Policy');
  }

  get isDanger() {
    return true;
  }

  get buttonText() {
    return t('Delete Policy');
  }

  get actionName() {
    return t('delete qos policy');
  }

  get successText() {
    return firstUpperCase(t('{action} successfully.', { action: this.name }));
  }

  get errorText() {
    return t('Unable to {action}.', { action: this.name.toLowerCase() });
  }

  policy = 'delete_policy';

  aliasPolicy = 'neutron:delete_policy';

  allowedCheckFunc = (item) => {
    if (!item) {
      return true;
    }
    return this.isOwnerOrAdmin(item);
  };

  isOwnerOrAdmin() {
    // TODO: check owner
    return true;
  }

  confirmContext = (data) => {
    if (!this.messageHasItemName) {
      return t('Are you sure to {action}?', {
        action: this.actionNameDisplay || this.title,
      });
    }
    const name = this.getName(data);
    return t('Are you sure to {action} (policy: {name})?', {
      action: this.actionNameDisplay || this.title,
      name,
    });
  };

  onSubmit = (data) => globalQoSPolicyStore.delete(data);
}
