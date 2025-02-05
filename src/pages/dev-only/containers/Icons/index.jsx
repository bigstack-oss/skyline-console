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

import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';

// monochrome icons
import addCircle from 'asset/icon/monochrome/add_circle.svg';
import addSquare from 'asset/icon/monochrome/add_square.svg';

// colored icons
import ceph from 'asset/icon/colored/ceph.svg';

const icons = [
  {
    key: 'addCircle',
    label: 'addCircle',
    avatar: addCircle,
  },
  {
    key: 'addSquare',
    label: 'addSquare',
    avatar: addSquare,
  },
  {
    key: 'ceph',
    label: 'ceph',
    avatar: ceph,
  },
];

export class Icons extends Component {
  renderTitle() {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1>Icon Demo</h1>
        <Link to="/dev-only">Go back</Link>
      </div>
    );
  }

  renderIcon() {
    return icons.map((icon) => (
      <img
        alt={icon.label}
        src={icon.avatar}
        style={{ height: '30px', width: '30px', marginRight: '10px' }}
      />
    ));
  }

  render() {
    return (
      <div style={{ padding: '30px' }}>
        {this.renderTitle()}
        {this.renderIcon()}
      </div>
    );
  }
}

export default observer(Icons);
