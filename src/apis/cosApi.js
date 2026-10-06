import axios from 'axios';
import { getValidKeystoneToken } from 'utils/keystone-token';

// Old builds cached a cube-cos-api token here. Drop it so it cannot be reused.
['accessToken', 'expires'].forEach((key) => localStorage.removeItem(key));

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

cosApiClientV1.interceptors.request.use(async (config) => {
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
    if (error?.response?.status === 401) {
      goToLoginPage();
    }
    return Promise.reject(error);
  }
);
