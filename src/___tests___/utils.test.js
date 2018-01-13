import {
  verifyPassword,
  // lockAndRead,
  // unlockFile,
  parseHTPasswd,
  // addUserToHTPasswd
} from '../utils';

describe('parseHTPasswd', () => {
  it('should parse the password for a single line', () => {
    const input = 'test:$6b9MlB3WUELU:autocreated 2017-11-06T18:17:21.957Z';
    const output = {test: '$6b9MlB3WUELU'};
    expect(parseHTPasswd(input)).toEqual(output);
  });

  it('should parse the password for two lines', () => {
    const input = `user1:$6b9MlB3WUELU:autocreated 2017-11-06T18:17:21.957Z
user2:$6FrCaT/v0dwE:autocreated 2017-12-14T13:30:20.838Z`;
    const output = {user1: '$6b9MlB3WUELU', user2: '$6FrCaT/v0dwE'};
    expect(parseHTPasswd(input)).toEqual(output);
  });

  it('should parse the password for multiple lines', () => {
    const input = `user1:$6b9MlB3WUELU:autocreated 2017-11-06T18:17:21.957Z
user2:$6FrCaT/v0dwE:autocreated 2017-12-14T13:30:20.838Z
user3:$6FrCdfd\v0dwE:autocreated 2017-12-14T13:30:20.838Z
user4:$6FrCasdvppdwE:autocreated 2017-12-14T13:30:20.838Z`;
    const output = {
      user1: '$6b9MlB3WUELU',
      user2: '$6FrCaT/v0dwE',
      user3: '$6FrCdfd\v0dwE',
      user4: '$6FrCasdvppdwE',
    };
    expect(parseHTPasswd(input)).toEqual(output);
  });
});


describe('verifyPassword', () => {
  it('should verify the MD5/Crypt3 password with true', () => {
    const input = ['test', '$apr1$sKXK9.lG$rZ4Iy63Vtn8jF9/USc4BV0'];
    expect(verifyPassword(...input)).toBeTruthy();
  });
  it('should verify the MD5/Crypt3 password with false', () => {
    const input = ['testpasswordchanged', '$apr1$sKXK9.lG$rZ4Iy63Vtn8jF9/USc4BV0'];
    expect(verifyPassword(...input)).toBeFalsy();
  });
  it('should verify the plain password with true', () => {
    const input = ['testpasswordchanged', '{PLAIN}testpasswordchanged'];
    expect(verifyPassword(...input)).toBeTruthy();
  });
  it('should verify the plain password with false', () => {
    const input = ['testpassword', '{PLAIN}testpasswordchanged'];
    expect(verifyPassword(...input)).toBeFalsy();
  });
  it('should verify the crypto SHA password with true', () => {
    const input = ['testpassword', '{SHA}i7YRj4/Wk1rQh2o740pxfTJwj/0='];
    expect(verifyPassword(...input)).toBeTruthy();
  });
  it('should verify the crypto SHA password with false', () => {
    const input = ['testpasswordchanged', '{SHA}i7YRj4/Wk1rQh2o740pxfTJwj/0='];
    expect(verifyPassword(...input)).toBeFalsy();
  });
});
