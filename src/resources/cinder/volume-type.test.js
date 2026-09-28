import { filterVolumeTypes, getPreferredVolumeType } from './volume-type';

// volume.jsx drags in stores and UI globals the helpers don't need.
jest.mock('./volume', () => ({ multiTip: '' }));

const types = [
  { id: 'manila', name: 'CubeStorage-Manila' },
  { id: 'placeholder', name: '__DEFAULT__' },
  { id: 'cube', name: 'CubeStorage' },
  { id: 'ext', name: 'CubeStorage-smarthealth' },
];

describe('volume type pickers', () => {
  it('hides __DEFAULT__', () => {
    expect(filterVolumeTypes(types).map((it) => it.id)).toEqual([
      'manila',
      'cube',
      'ext',
    ]);
    expect(filterVolumeTypes(undefined)).toEqual([]);
    expect(filterVolumeTypes(null)).toEqual([]);
  });

  it('prefers the cluster default type', () => {
    expect(getPreferredVolumeType(types, { id: 'ext' }).id).toBe('ext');
    expect(
      getPreferredVolumeType(types, { name: 'CubeStorage-smarthealth' }).id
    ).toBe('ext');
  });

  it('falls back to CubeStorage, case-insensitively', () => {
    expect(getPreferredVolumeType(types, null).id).toBe('cube');
    expect(getPreferredVolumeType(types, { id: 'gone' }).id).toBe('cube');
    expect(
      getPreferredVolumeType([{ id: 'lc', name: 'cubestorage' }], null).id
    ).toBe('lc');
  });

  it('never picks a hidden type, even as the cluster default', () => {
    expect(getPreferredVolumeType(types, { id: 'placeholder' }).id).toBe('cube');
  });

  it('falls back to the first visible type', () => {
    const others = [types[1], types[3], types[0]];
    expect(getPreferredVolumeType(others, null).id).toBe('ext');
    expect(getPreferredVolumeType([types[1]], null)).toBeUndefined();
    expect(getPreferredVolumeType([], null)).toBeUndefined();
  });
});
