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
import SkylineButton from 'src/components/skyline/SkylineButton';

export class Buttons extends Component {
  renderTitle() {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1>Button Demo</h1>
        <Link to="/dev-only">Go back</Link>
      </div>
    );
  }

  renderButtonBlocks(title, type, size) {
    return (
      <div style={{ marginBottom: '10px' }}>
        <h3>{title}</h3>
        <SkylineButton type={type} size={size}>
          Skyline Button
        </SkylineButton>
      </div>
    );
  }

  renderButtons() {
    return (
      <div>
        {this.renderButtonBlocks('Primary - large', 'primary', 'large')}
        {this.renderButtonBlocks('Primary - middle', 'primary', 'middle')}
        {this.renderButtonBlocks('Primary - small', 'primary', 'small')}
        {this.renderButtonBlocks('Secondary - large', 'secondary', 'large')}
        {this.renderButtonBlocks('Secondary - middle', 'secondary', 'middle')}
        {this.renderButtonBlocks('Secondary - small', 'secondary', 'small')}
      </div>
    );
  }

  render() {
    return (
      <div style={{ padding: '30px' }}>
        {this.renderTitle()}
        {this.renderButtons()}
      </div>
    );
  }
}

export default observer(Buttons);
