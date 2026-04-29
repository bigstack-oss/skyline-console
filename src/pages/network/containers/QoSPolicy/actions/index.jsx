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

import CreatePolicy from './CreatePolicy';
import EditPolicy from './EditPolicy';
import DeletePolicy from './DeletePolicy';
import AddRule from './AddRule';
import DeleteRules from './DeleteRules';
import EditBandwidthEgressRule from './EditBandwidthEgressRule';
import EditBandwidthIngressRule from './EditBandwidthIngressRule';
import EditDSCPMarkingRule from './EditDSCPMarkingRule';

const editRuleActions = [
  EditBandwidthEgressRule,
  EditBandwidthIngressRule,
  EditDSCPMarkingRule,
];

const actionConfigs = {
  primaryActions: [CreatePolicy],
  batchActions: [DeletePolicy],
  rowActions: {
    firstAction: AddRule,
    moreActions: [
      { action: EditPolicy },
      { title: t('Edit Rule'), actions: editRuleActions },
      { action: DeleteRules },
      { action: DeletePolicy },
    ],
  },
};

const consoleActions = {
  primaryActions: [CreatePolicy],
  batchActions: [DeletePolicy],
  rowActions: {
    firstAction: AddRule,
    moreActions: [
      { action: EditPolicy },
      { title: t('Edit Rule'), actions: editRuleActions },
      { action: DeleteRules },
      { action: DeletePolicy },
    ],
  },
};

export default { actionConfigs, consoleActions };
