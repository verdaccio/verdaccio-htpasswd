import fs from 'fs';
import HTPasswd from '../htpasswd';
import Logger from './__mocks__/Logger';
import Config from './__mocks__/Config';

const stuff = {
  logger: new Logger(),
  config: new Config()
};

const config = {
  file: './htpasswd',
  max_users: 1000
};

describe('HTPasswd', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = new HTPasswd(config, stuff);
  });

  it('reload - it should read the file and set the users', done => {
    const output = { test: '$6FrCaT/v0dwE', username: '$66to3JK5RgZM' };
    const callback = () => {
      expect(wrapper.users).toEqual(output);
      done();
    };
    wrapper.reload(callback);
  });

  it('authenticate - it should authenticate user with given credentials', done => {
    const callbackTest = (a, b) => {
      expect(a).toBeNull();
      expect(b).toContain('test');
      done();
    };
    const callbackUsername = (a, b) => {
      expect(a).toBeNull();
      expect(b).toContain('username');
      done();
    };
    wrapper.authenticate('test', 'test', callbackTest);
    wrapper.authenticate('username', 'password', callbackUsername);
  });

  it('authenticate - it should not authenticate user with given credentials', done => {
    const callback = (a, b) => {
      expect(a).toBeNull();
      expect(b).toBeFalsy();
      done();
    };
    wrapper.authenticate('test', 'somerandompassword', callback);
  });

  it('addUser - it should not pass sanity check', done => {
    const callback = (a, b) => {
      expect(a.message).toEqual('unauthorized access');
      done();
    };
    wrapper.adduser('test', 'somerandompassword', callback);
  });

  it('addUser - it should not try to read and lock htpasswd file if first sanity check fails', done => {
    fs.readFile = jest.fn((path, body, callback) => callback(null, ''));
    const callback = a => {
      expect(a.message).toEqual('username and password is required');
      expect(fs.readFile).not.toHaveBeenCalled();
      done();
    };
    wrapper.adduser(undefined, undefined, callback);
  });

  it('addUser - it should add the user', done => {
    fs.writeFile = jest.fn((path, body, callback) => callback(null));
    const callback = () => {
      expect(fs.writeFile).toHaveBeenCalled();
      done();
    };
    wrapper.adduser('usernotpresent', 'somerandompassword', callback);
  });
});
