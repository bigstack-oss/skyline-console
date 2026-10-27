import { CreateForm } from './Create';

// The real FormAction pulls in a webpack-only loader; the visibility default
// does not need the form base.
jest.mock('containers/Action', () => ({ FormAction: class {} }));

const createForm = (imageMaterials = {}, fieldValues = {}) => {
  const form = new CreateForm({});
  form.store = {
    imageMaterials,
    fetchImageMaterials: jest.fn(() => Promise.resolve()),
  };
  form.setState = jest.fn();
  form.values = { ...fieldValues };
  form.formRef = { current: { getFieldValue: (key) => form.values[key] } };
  form.updateFormValue = jest.fn((key, value) => {
    form.values[key] = value;
  });
  form.loadMaterials = (loaded) => {
    form.store.fetchImageMaterials.mockImplementation(() => {
      form.store.imageMaterials = loaded;
      return Promise.resolve();
    });
    return form.getImageMaterials();
  };
  return form;
};

describe('CreateForm visibility default', () => {
  it('defaults to private when the backend offers only private', () => {
    const form = createForm({ visibilities: ['private'] });
    expect(form.defaultValue.visibility).toBe('private');
  });

  it('keeps public first when the backend offers both', () => {
    const form = createForm({ visibilities: ['public', 'private'] });
    expect(form.defaultValue.visibility).toBe('public');
  });

  it('leaves visibility unset before the materials load', () => {
    const form = createForm({});
    expect(form.defaultValue.visibility).toBeUndefined();
  });

  it('leaves visibility unset for an image from another hypervisor', () => {
    const form = createForm({ visibilities: ['private'] });
    form.state.sourceFromAnotherHypervisor = true;
    expect(form.defaultValue.visibility).toBeUndefined();
  });

  it('resets visibility to the first offered value', () => {
    const form = createForm({ visibilities: ['private'] });
    form.resetFormValue();
    expect(form.values.visibility).toBe('private');
  });

  it('fills visibility in once the materials load', async () => {
    const form = createForm({});
    await form.loadMaterials({ visibilities: ['private'] });
    expect(form.values.visibility).toBe('private');
  });

  it('keeps a visibility set while the materials load', async () => {
    const offered = { visibilities: ['public', 'private'] };
    const form = createForm(offered, { visibility: 'private' });
    await form.loadMaterials(offered);
    expect(form.values.visibility).toBe('private');
  });

  it('replaces a visibility the reloaded materials no longer offer', async () => {
    const form = createForm(
      { visibilities: ['public', 'private'] },
      { visibility: 'public' }
    );
    await form.loadMaterials({ visibilities: ['private'] });
    expect(form.values.visibility).toBe('private');
  });

  it('leaves visibility unset for an image from another hypervisor once the materials load', async () => {
    const form = createForm({});
    form.state.sourceFromAnotherHypervisor = true;
    await form.loadMaterials({ visibilities: ['private'] });
    expect(form.values.visibility).toBeUndefined();
  });
});
