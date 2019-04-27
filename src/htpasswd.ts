import fs from 'fs';
import Path from 'path';
import {
  verifyPassword,
  lockAndRead,
  unlockFile,
  parseHTPasswd,
  addUserToHTPasswd,
  changePasswordToHTPasswd,
  sanityCheck
} from './utils';

import { Callback, AuthConf, Config, IPluginAuth } from '@verdaccio/types';

export interface VerdaccioConfigApp extends Config {
  file: string;
}

/**
 * HTPasswd - Verdaccio auth class
 */
export default class HTPasswd implements IPluginAuth<VerdaccioConfigApp> {
  /**
   *
   * @param {*} config htpasswd file
   * @param {object} stuff config.yaml in object from
   */
  // flow types
  users: {};
  stuff: {};
  config: {};
  verdaccioConfig: Config;
  maxUsers: number;
  path: string;
  logger: {};
  lastTime: any;
  // constructor
  constructor(config: AuthConf, stuff: VerdaccioConfigApp) {
    this.users = {};

    // config for this module
    this.config = config;
    this.stuff = stuff;

    // verdaccio logger
    this.logger = stuff.logger;

    // verdaccio main config object
    this.verdaccioConfig = stuff.config;

    // all this "verdaccio_config" stuff is for b/w compatibility only
    this.maxUsers = config.max_users ? config.max_users : Infinity;

    this.lastTime = null;

    const { file } = config;

    if (!file) {
      throw new Error('should specify "file" in config');
    }

    this.path = Path.resolve(
      Path.dirname(this.verdaccioConfig.self_path),
      file
    );
  }

  /**
   * authenticate - Authenticate user.
   * @param {string} user
   * @param {string} password
   * @param {function} cd
   * @returns {function}
   */
  authenticate(user: string, password: string, cb: Callback) {
    this.reload(err => {
      if (err) {
        return cb(err.code === 'ENOENT' ? null : err);
      }
      if (!this.users[user]) {
        return cb(null, false);
      }
      if (!verifyPassword(password, this.users[user])) {
        return cb(null, false);
      }

      // authentication succeeded!
      // return all usergroups this user has access to;
      // (this particular package has no concept of usergroups, so just return
      // user herself)
      return cb(null, [user]);
    });
  }

  /**
   * Add user
   * 1. lock file for writing (other processes can still read)
   * 2. reload .htpasswd
   * 3. write new data into .htpasswd.tmp
   * 4. move .htpasswd.tmp to .htpasswd
   * 5. reload .htpasswd
   * 6. unlock file
   *
   * @param {string} user
   * @param {string} password
   * @param {function} realCb
   * @returns {function}
   */
  adduser(user: string, password: string, realCb: Callback) {
    const pathPass = this.path;
    let sanity = sanityCheck(
      user,
      password,
      verifyPassword,
      this.users,
      this.maxUsers
    );

    // preliminary checks, just to ensure that file won't be reloaded if it's
    // not needed
    if (sanity) {
      return realCb(sanity, false);
    }

    lockAndRead(pathPass, (err, res) => {
      let locked = false;

      // callback that cleans up lock first
      const cb = err => {
        if (locked) {
          unlockFile(pathPass, () => {
            // ignore any error from the unlock
            realCb(err, !err);
          });
        } else {
          realCb(err, !err);
        }
      };

      if (!err) {
        locked = true;
      }

      // ignore ENOENT errors, we'll just create .htpasswd in that case
      if (err && err.code !== 'ENOENT') {
        return cb(err);
      }
      const body = (res || '').toString('utf8');
      this.users = parseHTPasswd(body);

      // real checks, to prevent race conditions
      // parsing users after reading file.
      sanity = sanityCheck(
        user,
        password,
        verifyPassword,
        this.users,
        this.maxUsers
      );

      if (sanity) {
        return cb(sanity);
      }

      try {
        this._writeFile(addUserToHTPasswd(body, user, password), cb);
      } catch (err) {
        return cb(err);
      }
    });
  }

  /**
   * Reload users
   * @param {function} callback
   */
  reload(callback: Callback) {
    fs.stat(this.path, (err, stats) => {
      if (err) {
        return callback(err);
      }
      if (this.lastTime === stats.mtime) {
        return callback();
      }

      this.lastTime = stats.mtime;

      fs.readFile(this.path, 'utf8', (err, buffer) => {
        if (err) {
          return callback(err);
        }

        Object.assign(this.users, parseHTPasswd(buffer));
        callback();
      });
    });
  }

  _stringToUt8(authentication: string): string {
    return (authentication || '').toString();
  }

  _writeFile(body: string, cb: Callback) {
    fs.writeFile(this.path, body, err => {
      if (err) {
        cb(err);
      } else {
        this.reload(() => {
          cb(null);
        });
      }
    });
  }

  /**
   * changePassword - change password for existing user.
   * @param {string} user
   * @param {string} password
   * @param {function} cd
   * @returns {function}
   */
  changePassword(
    user: string,
    password: string,
    newPassword: string,
    realCb: Callback
  ) {
    lockAndRead(this.path, (err, res) => {
      let locked = false;
      const pathPassFile = this.path;

      // callback that cleans up lock first
      const cb = err => {
        if (locked) {
          unlockFile(pathPassFile, () => {
            // ignore any error from the unlock
            realCb(err, !err);
          });
        } else {
          realCb(err, !err);
        }
      };

      if (!err) {
        locked = true;
      }

      if (err && err.code !== 'ENOENT') {
        return cb(err);
      }

      const body = this._stringToUt8(res);
      this.users = parseHTPasswd(body);

      if (!this.users[user]) {
        return cb(new Error('User not found'));
      }

      try {
        this._writeFile(
          changePasswordToHTPasswd(body, user, password, newPassword),
          cb
        );
      } catch (err) {
        return cb(err);
      }
    });
  }
}
