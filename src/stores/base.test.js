import BaseStore, { filterRowsByUuid, findInListById } from './base';

const A = { id: 'id-a' };
const B = { id: 'id-b' };
const C = { id: 'id-c' };

describe('filterRowsByUuid', () => {
  it('keeps only the rows a single uuid asked for', () => {
    expect(filterRowsByUuid([B, A, C], A.id)).toEqual([A]);
  });

  it('keeps only the rows a uuid list asked for', () => {
    expect(filterRowsByUuid([B, A, C], [A.id, C.id])).toEqual([A, C]);
  });

  it('leaves the rows alone when no uuid was asked for', () => {
    const rows = [B, A];
    expect(filterRowsByUuid(rows, undefined)).toBe(rows);
  });
});

describe('findInListById', () => {
  it('finds the row by id, not the first row', () => {
    expect(findInListById([B, A], A.id)).toBe(A);
  });

  it('returns undefined when the row is missing or there is no list', () => {
    expect(findInListById([B], A.id)).toBeUndefined();
    expect(findInListById(undefined, A.id)).toBeUndefined();
  });
});

describe('BaseStore list requests with a uuid filter the API ignored', () => {
  class Store extends BaseStore {
    get listResponseKey() {
      return 'items';
    }

    listFetchByClient() {
      // The whole project, as nova returns it to a member.
      return Promise.resolve({ items: [B, A, C] });
    }
  }

  it('fetchList returns only the requested row', async () => {
    const result = await new Store().fetchList({ uuid: A.id });
    expect(result).toEqual([A]);
  });

  it('requestListAllByLimit returns only the requested rows', async () => {
    const result = await new Store().requestListAllByLimit(
      { uuid: [A.id] },
      100
    );
    expect(result).toEqual([A]);
  });

  it('fetchList without a uuid still returns every row', async () => {
    const result = await new Store().fetchList({});
    expect(result).toEqual([B, A, C]);
  });
});
