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

export class Overview extends Component {
  renderTitle() {
    return <h1>Overview</h1>;
  }

  renderLinks() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Link style={{ fontSize: '1rem' }} to="/dev-only/buttons">
          Buttons
        </Link>
        <Link style={{ fontSize: '1rem' }} to="/dev-only/icons">
          Icons
        </Link>
      </div>
    );
  }

  render() {
    return (
      <div className="container" style={{ padding: '30px' }}>
        {this.renderTitle()}
        {this.renderLinks()}
      </div>
    );
  }
}

export default observer(Overview);
