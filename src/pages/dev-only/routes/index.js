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

import BaseLayout from 'layouts/Basic';
import E404 from 'pages/base/containers/404';
import Overview from '../containers/Overview';
import Buttons from '../containers/Buttons';
import Icons from '../containers/Icons';

const PATH = '/dev-only';
export default [
  {
    path: PATH,
    component: BaseLayout,
    routes: [
      { path: `${PATH}/`, component: Overview, exact: true },
      { path: `${PATH}/buttons`, component: Buttons, exact: true },
      { path: `${PATH}/icons`, component: Icons, exact: true },
      { path: '*', component: E404 },
    ],
  },
];
