import Base from 'stores/base';
import client from 'client';
import { action } from 'mobx';
import { HostStore } from './hosts';

export class NotificationStore extends Base {
  get client() {
    return client.masakari.notifications;
  }

  async listDidFetch(items) {
    if (!items.length) {
      return items;
    }
    // Notifications only carry the masakari host uuid; resolve it to the
    // host name operators know, falling back to the uuid for hosts that
    // have since been removed from their segment.
    const { hosts = [] } = await new HostStore().listFetchByClient({});
    const hostNames = Object.fromEntries(hosts.map((it) => [it.uuid, it.name]));
    return items.map((it) => ({
      ...it,
      source_host_name: hostNames[it.source_host_uuid] || it.source_host_uuid,
    }));
  }

  @action
  async create(newbody) {
    return this.client.create(newbody);
  }

  @action
  async delete({ params }, newbody) {
    return this.client.delete(params, newbody);
  }
}

const globalNotificationStore = new NotificationStore();
export default globalNotificationStore;
