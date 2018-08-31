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

  it('addUser - it should add the user', done => {
    let dataToWrite;
    fs.writeFile = jest.fn((name, data, callback) => {
      dataToWrite = data;
      callback();
    });
    const callback = (a, b) => {
      expect(a).toBeNull();
      expect(b).toBeTruthy();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(dataToWrite.indexOf('usernotpresent')).not.toEqual(-1);
      done();
    };
    wrapper.adduser('usernotpresent', 'somerandompassword', callback);
  });

  it('changePassword - it should throw an error for user not found', done => {
    const callback = (error, isSuccess) => {
      expect(error).not.toBeNull();
      expect(error.message).toBe('User not found');
      expect(isSuccess).toBeFalsy();
      done();
    };
    wrapper.changePassword(
      'usernotpresent',
      'oldPassword',
      'newPassword',
      callback
    );
  });

  it('changePassword - it should throw an error for wrong password', done => {
    const callback = (error, isSuccess) => {
      expect(error).not.toBeNull();
      expect(error.message).toBe('Invalid old Password');
      expect(isSuccess).toBeFalsy();
      done();
    };
    wrapper.changePassword(
      'username',
      'wrongPassword',
      'newPassword',
      callback
    );
  });

  it('changePassword - it should change password', done => {
    let dataToWrite;
    fs.writeFile = jest.fn((name, data, callback) => {
      dataToWrite = data;
      callback();
    });
    const callback = (error, isSuccess) => {
      expect(error).toBeNull();
      expect(isSuccess).toBeTruthy();
      expect(fs.writeFile).toHaveBeenCalled();
      expect(dataToWrite.indexOf('username')).not.toEqual(-1);
      done();
    };
    wrapper.changePassword('username', 'password', 'newPassword', callback);
  });
});
