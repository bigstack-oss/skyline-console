import { CreateForm } from './Create';

// The real FormAction pulls in a webpack-only loader; the visibility default
// does not need the form base.
jest.mock('containers/Action', () => ({ FormAction: class {} }));

const createForm = (imageMaterials = {}) => {
  const form = new CreateForm({});
  form.store = {
    imageMaterials,
    fetchImageMaterials: jest.fn(() => Promise.resolve()),
  };
  form.setState = jest.fn();
  form.updateFormValue = jest.fn();
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
    expect(form.updateFormValue).toHaveBeenCalledWith('visibility', 'private');
  });

  it('fills visibility in once the materials load', async () => {
    const form = createForm({});
    form.store.fetchImageMaterials.mockImplementation(() => {
      form.store.imageMaterials = { visibilities: ['private'] };
      return Promise.resolve();
    });
    await form.getImageMaterials();
    expect(form.updateFormValue).toHaveBeenCalledWith('visibility', 'private');
  });
});
