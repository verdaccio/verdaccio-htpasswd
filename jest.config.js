/* eslint comma-dangle: 0 */

module.exports = {
  'name': 'htpasswd-auth-jest',
  'jest': {
    'verbose': true
  },
  'collectCoverage': true,
  'coveragePathIgnorePatterns': [
    'node_modules',
    '_storage',
    'fixtures'
  ]
};
