import * as locker from '@verdaccio/file-locking';

import {
  verifyPassword,
  lockAndRead,
  unlockFile,
  parseHTPasswd,
  addUserToHTPasswd,
  sanityCheck,
  changePasswordToHTPasswd,
  getCryptoPassword
} from '../src/utils';

describe('parseHTPasswd', () => {
  it('should parse the password for a single line', () => {
    const input = 'test:$6b9MlB3WUELU:autocreated 2017-11-06T18:17:21.957Z';
    const output = { test: '$6b9MlB3WUELU' };
    expect(parseHTPasswd(input)).toEqual(output);
  });

  it('should parse the password for two lines', () => {
    const input = `user1:$6b9MlB3WUELU:autocreated 2017-11-06T18:17:21.957Z
user2:$6FrCaT/v0dwE:autocreated 2017-12-14T13:30:20.838Z`;
    const output = { user1: '$6b9MlB3WUELU', user2: '$6FrCaT/v0dwE' };
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
      user4: '$6FrCasdvppdwE'
    };
    expect(parseHTPasswd(input)).toEqual(output);
  });
});

describe('verifyPassword', () => {
  it('should verify the MD5/Crypt3 password with true', () => {
    const input = ['test', '$apr1$sKXK9.lG$rZ4Iy63Vtn8jF9/USc4BV0'];
    expect(verifyPassword(input[0], input[1])).toBeTruthy();
  });
  it('should verify the MD5/Crypt3 password with false', () => {
    const input = [
      'testpasswordchanged',
      '$apr1$sKXK9.lG$rZ4Iy63Vtn8jF9/USc4BV0'
    ];
    expect(verifyPassword(input[0], input[1])).toBeFalsy();
  });
  it('should verify the plain password with true', () => {
    const input = ['testpasswordchanged', '{PLAIN}testpasswordchanged'];
    expect(verifyPassword(input[0], input[1])).toBeTruthy();
  });
  it('should verify the plain password with false', () => {
    const input = ['testpassword', '{PLAIN}testpasswordchanged'];
    expect(verifyPassword(input[0], input[1])).toBeFalsy();
  });
  it('should verify the crypto SHA password with true', () => {
    const input = ['testpassword', '{SHA}i7YRj4/Wk1rQh2o740pxfTJwj/0='];
    expect(verifyPassword(input[0], input[1])).toBeTruthy();
  });
  it('should verify the crypto SHA password with false', () => {
    const input = ['testpasswordchanged', '{SHA}i7YRj4/Wk1rQh2o740pxfTJwj/0='];
    expect(verifyPassword(input[0], input[1])).toBeFalsy();
  });
  it('should verify the bcrypt password with true', () => {
    const input = [
      'testpassword',
      '$2y$04$Wqed4yN0OktGbiUdxSTwtOva1xfESfkNIZfcS9/vmHLsn3.lkFxJO'
    ];
    expect(verifyPassword(input[0], input[1])).toBeTruthy();
  });
  it('should verify the bcrypt password with false', () => {
    const input = [
      'testpasswordchanged',
      '$2y$04$Wqed4yN0OktGbiUdxSTwtOva1xfESfkNIZfcS9/vmHLsn3.lkFxJO'
    ];
    expect(verifyPassword(input[0], input[1])).toBeFalsy();
  });
});

describe('addUserToHTPasswd - crypt3', () => {
  beforeAll(() => {
    // @ts-ignore
    global.Date = jest.fn(() => {
      return {
        parse: jest.fn(),
        toJSON: () => '2018-01-14T11:17:40.712Z'
      };
    });
  });

  it('should add new htpasswd to the end', () => {
    const input = ['', 'username', 'password'];
    expect(addUserToHTPasswd(input[0], input[1], input[2])).toMatchSnapshot();
  });

  it('should add new htpasswd to the end in multiline input', () => {
    const body = `test1:$6b9MlB3WUELU:autocreated 2017-11-06T18:17:21.957Z
    test2:$6FrCaT/v0dwE:autocreated 2017-12-14T13:30:20.838Z`;
    const input = [body, 'username', 'password'];
    expect(addUserToHTPasswd(input[0], input[1], input[2])).toMatchSnapshot();
  });

  it('should throw an error for incorrect username with space', () => {
    const [a, b, c] = ['', 'firstname lastname', 'password'];
    expect(() => addUserToHTPasswd(a, b, c)).toThrowErrorMatchingSnapshot();
  });
});

// ToDo: mock crypt3 with false
describe('addUserToHTPasswd - crypto', () => {
  it('should create password with crypto', () => {
    jest.resetModules();
    jest.doMock('../src/crypt3.ts', () => false);
    const input = ['', 'username', 'password'];
    const utils = require('../src/utils.ts');
    expect(utils.addUserToHTPasswd(input[0], input[1], input[2])).toEqual(
      'username:{SHA}W6ph5Mm5Pz8GgiULbPgzG37mj9g=:autocreated 2018-01-14T11:17:40.712Z\n'
    );
  });
});

describe('lockAndRead', () => {
  beforeAll(() => {
    locker.readFile = jest.fn();
  });

  it('should call the readFile method', () => {
    const cb = () => {};
    lockAndRead('.htpasswd', cb);
    expect(locker.readFile).toHaveBeenCalled();
  });
});

describe('unlockFile', () => {
  beforeAll(() => {
    locker.unlockFile = jest.fn();
  });

  it('should call the unlock method', () => {
    const cb = () => {};
    unlockFile('htpasswd', cb);
    expect(locker.readFile).toHaveBeenCalled();
  });
});

describe('sanityCheck', () => {
  let users;

  beforeEach(() => {
    users = { test: '$6FrCaT/v0dwE' };
  });

  test('should throw error for user already exists', () => {
    const verifyFn = jest.fn();
    const input = sanityCheck('test', users.test, verifyFn, users, Infinity);
    expect(input.status).toEqual(401);
    expect(input.message).toEqual('unauthorized access');
    expect(verifyFn).toHaveBeenCalled();
  });

  test('should throw error for registration disabled of users', () => {
    const verifyFn = () => {};
    const input = sanityCheck('username', users.test, verifyFn, users, -1);
    expect(input.status).toEqual(409);
    expect(input.message).toEqual('user registration disabled');
  });

  test('should throw error max number of users', () => {
    const verifyFn = () => {};
    const input = sanityCheck('username', users.test, verifyFn, users, 1);
    expect(input.status).toEqual(403);
    expect(input.message).toEqual('maximum amount of users reached');
  });

  test('should not throw anything and sanity check', () => {
    const verifyFn = () => {};
    const input = sanityCheck('username', users.test, verifyFn, users, 2);
    expect(input).toBeNull();
  });

  test('should throw error for required username field', () => {
    const verifyFn = () => {};
    const input = sanityCheck(undefined, users.test, verifyFn, users, 2);
    expect(input.message).toEqual('username and password is required');
    expect(input.status).toEqual(400);
  });

  test('should throw error for required password field', () => {
    const verifyFn = () => {};
    const input = sanityCheck('username', undefined, verifyFn, users, 2);
    expect(input.message).toEqual('username and password is required');
    expect(input.status).toEqual(400);
  });

  test('should throw error for required username & password fields', () => {
    const verifyFn = () => {};
    const input = sanityCheck(undefined, undefined, verifyFn, users, 2);
    expect(input.message).toEqual('username and password is required');
    expect(input.status).toEqual(400);
  });

  test('should throw error for existing username and password', () => {
    const verifyFn = jest.fn(() => true);
    const input = sanityCheck('test', users.test, verifyFn, users, 2);
    expect(input.status).toEqual(409);
    expect(input.message).toEqual('username is already registered');
    expect(verifyFn).toHaveBeenCalledTimes(1);
  });

  test('should throw error for existing username and password with max number of users reached', () => {
    const verifyFn = jest.fn(() => true);
    const input = sanityCheck('test', users.test, verifyFn, users, 1);
    expect(input.status).toEqual(409);
    expect(input.message).toEqual('username is already registered');
    expect(verifyFn).toHaveBeenCalledTimes(1);
  });
});

describe('changePasswordToHTPasswd', () => {
  test('should throw error for wrong password', () => {
    const body = 'test:$6b9MlB3WUELU:autocreated 2017-11-06T18:17:21.957Z';

    try {
      changePasswordToHTPasswd(
        body,
        'test',
        'somerandompassword',
        'newPassword'
      );
    } catch (error) {
      expect(error.message).toEqual('Invalid old Password');
    }
  });

  test('should change the password', () => {
    const body = 'root:$6qLTHoPfGLy2:autocreated 2018-08-20T13:38:12.164Z';

    expect(
      changePasswordToHTPasswd(body, 'root', 'demo123', 'newPassword')
    ).toMatchSnapshot();
  });

  test('should change the password when crypt3 is not available', () => {
    jest.resetModules();
    jest.doMock('../src/crypt3.ts', () => false);
    const utils = require('../src/utils.ts');
    const body =
      'username:{SHA}W6ph5Mm5Pz8GgiULbPgzG37mj9g=:autocreated 2018-01-14T11:17:40.712Z';
    expect(
      utils.changePasswordToHTPasswd(
        body,
        'username',
        'password',
        'newPassword'
      )
    ).toEqual(
      'username:{SHA}KD1HqTOO0RALX+Klr/LR98eZv9A=:autocreated 2018-01-14T11:17:40.712Z'
    );
  });
});

describe('getCryptoPassword', () => {
  test('should return the password hash', () => {
    const passwordHash = `{SHA}y9vkk2zovmMYTZ8uE/wkkjQ3G5o=`;

    expect(getCryptoPassword('demo123')).toBe(passwordHash);
  });
});
