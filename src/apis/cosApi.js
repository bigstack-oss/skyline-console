import axios from 'axios';
import { dataCenterStore } from 'src/stores/datacenters/DataCenterStore';

export const cosApiClientV1 = axios.create({
  baseURL: '/cos-api/v1',
});

let tokenData;
let expiresAt;

cosApiClientV1.interceptors.request.use(async (config) => {
  if (config.url.endsWith('/datacenters') || config.url.endsWith('/tokens')) {
    return config;
  }

  if (!tokenData || (expiresAt && expiresAt <= new Date())) {
    const { dataCenter } = dataCenterStore;

    const { data } = (
      await cosApiClientV1.post(`/datacenters/${dataCenter.name}/tokens`, {
        name: 'admin',
        password: 'admin',
      })
    ).data;

    tokenData = data;

    const expiresSeconds = tokenData.expires.access ?? 0;
    expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresSeconds);
  }

  config.headers.Authorization = `Bearer ${tokenData.token}`;

  return config;
});
