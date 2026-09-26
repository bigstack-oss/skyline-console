import { isEmptyPhoneNumber, phoneNumberValidate } from 'utils/validate';

describe('test utils validate.js', () => {
  it('isEmptyPhoneNumber', () => {
    expect(isEmptyPhoneNumber(undefined)).toBe(true);
    expect(isEmptyPhoneNumber('')).toBe(true);
    expect(isEmptyPhoneNumber('  ')).toBe(true);
    expect(isEmptyPhoneNumber('+886 ')).toBe(true);
    expect(isEmptyPhoneNumber('+1 ')).toBe(true);
    expect(isEmptyPhoneNumber('+886   ')).toBe(true);
    expect(isEmptyPhoneNumber('+886 912345678')).toBe(false);
    expect(isEmptyPhoneNumber('+886912345678')).toBe(false);
    expect(isEmptyPhoneNumber('+886 abc')).toBe(false);
  });

  it('phoneNumberValidate', async () => {
    await expect(phoneNumberValidate({}, '+886 ')).resolves.toBe(true);
    await expect(phoneNumberValidate({}, undefined)).resolves.toBe(true);
    await expect(phoneNumberValidate({}, '+886 912345678')).resolves.toBe(true);
    await expect(phoneNumberValidate({}, '+886 12')).rejects.toThrow();
    await expect(
      phoneNumberValidate({ required: true }, '+886 ')
    ).rejects.toThrow();
  });
});
