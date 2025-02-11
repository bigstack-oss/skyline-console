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

import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import './index.less';

const SkylineButton = ({
  children,
  className,
  type,
  size,
  isLoading,
  icon,
}) => {
  return (
    <Button
      type={type}
      className={`skyline-button ${className}`}
      loading={isLoading}
      size={size}
      icon={icon}
    >
      {children}
    </Button>
  );
};

SkylineButton.defaultProps = {
  className: '',
  type: 'primary',
  size: 'md',
  isLoading: false,
  icon: null,
};

SkylineButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  type: PropTypes.oneOf(['primary', 'secondary']),
  size: PropTypes.oneOf(['small', 'middle', 'large']),
  isLoading: PropTypes.bool,
  icon: PropTypes.node,
};

export default SkylineButton;
