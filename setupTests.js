/*
 TODO workaround for https://github.com/facebook/jest/issues/2441
  https://github.com/facebook/jest/issues/3853#issuecomment-317117151
 */

/*
 * Force chalk to use colors, so we always have them in logs
 * https://github.com/chalk/chalk#chalksupportscolor
 */

process.env['FORCE_COLOR'] = '1';
