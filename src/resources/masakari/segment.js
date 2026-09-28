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

// CubeCOS registers every compute node the way its CLI does
// (`segment host create <host> COMPUTE SSH <segment>`), so the console
// fixes the same values instead of asking the operator to type them.
export const segmentServiceType = 'COMPUTE';
export const hostType = 'COMPUTE';
export const hostControlAttributes = 'SSH';

// Masakari's host-create schema is additionalProperties: false, so only the
// fields it knows may be sent; anything copied from a nova service row
// (disabled_reason, zone, ...) would make the whole request 400.
export const getHostCreateBody = ({ name, reserved, on_maintenance }) => ({
  host: {
    name,
    type: hostType,
    control_attributes: hostControlAttributes,
    reserved: !!reserved,
    on_maintenance: !!on_maintenance,
  },
});
