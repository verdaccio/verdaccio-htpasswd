import fs from 'fs';
import Path from 'path';
import {
  verifyPassword,
  lockAndRead,
  unlockFile,
  parseHTPasswd,
  addUserToHTPasswd,
  sanityCheck,
} from './utils';

export default class HTPasswd {
  constructor(config, stuff) {
    this.users = {};

    // config for this module
    this.config = config;
    this.stuff = stuff;

    // verdaccio logger
    this.logger = stuff.logger;

    // verdaccio main config object
    this.verdaccioConfig = stuff.config;

    // all this "verdaccio_config" stuff is for b/w compatibility only
    this.maxUsers = this.config.max_users ? this.config.max_users : Infinity;

    this.lastTime = null;

    let {file} = config;

    if (!file) file = this.verdaccioConfig.users_file;

    if (!file) throw new Error('should specify "file" in config');

    this.path = Path.resolve(
      Path.dirname(this.verdaccioConfig.self_path),
      file
    );
  }

  /**
   * authenticate
   * @params {user}
   * @params {string}
   * @params {function}
   */
  authenticate(user, password, cb) {
    this.reload((err) => {
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
      // (this particular package has no concept of usergroups, so just return user herself)
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
   * @param {function} real_cb
   */
  adduser(user, password, realCb) {

    const sanity = sanityCheck(user, this.users, this.maxUsers);

    // preliminary checks, just to ensure that file won't be reloaded if it's
    // not needed
    if (sanity()) {
      return realCb(sanity(), false);
    }

    lockAndRead(this.path, (err, res) => {
      let locked = false;

      // callback that cleans up lock first
      const cb = (err) => {
        if (locked) {
          unlockFile(this.path, () => {
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
      if (err && err.code !== 'ENOENT') return cb(err);

      let body = (res || '').toString('utf8');
      this.users = parseHTPasswd(body);

      // real checks, to prevent race conditions
      if (sanity()) return cb(sanity());

      try {
        body = addUserToHTPasswd(body, user, password);
      } catch (err) {
        return cb(err);
      }
      fs.writeFile(this.path, body, (err) => {
        if (err) {
          return cb(err);
        }
        this.reload(function() {
          cb(null, true);
        });
      });
    });
  }

  /**
   * Reload users
   * @params {function} callback
   */
  reload(callback) {
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
}
