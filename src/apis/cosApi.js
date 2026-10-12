import axios from 'axios';
import { getValidKeystoneToken } from 'utils/keystone-token';

// Old builds cached a cube-cos-api token in `accessToken` + `expires`.
// Drop both so the old token cannot be reused. `expires` is a generic key,
// so remove it only next to `accessToken`.
try {
  if (localStorage.getItem('accessToken') !== null) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('expires');
  }
} catch (e) {}

export const cosApiClientV1 = axios.create({
  baseURL: '/cos-api/v1',
});

const goToLoginPage = () => {
  const currentPath = window.location.pathname;
  if (currentPath.indexOf('login') < 0) {
    const globalRootStore = require('stores/root').default;
    globalRootStore.goToLoginPage(currentPath);
  }
};

cosApiClientV1.interceptors.request.use((config) => {
  if (config.url.endsWith('/datacenters')) {
    return config;
  }
  // cube-cos-api validates the user's own Keystone token.
  const keystoneToken = getValidKeystoneToken();
  if (!keystoneToken) {
    goToLoginPage();
    throw new Error('Keystone session expired');
  }
  config.headers['X-Auth-Token'] = keystoneToken;
  return config;
});

cosApiClientV1.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 with a valid Keystone session means cube-cos-api rejected the
    // token for another reason. Going to the login page would loop, so let
    // the caller show its error.
    if (error?.response?.status === 401 && !getValidKeystoneToken()) {
      goToLoginPage();
    }
    return Promise.reject(error);
  }
);
