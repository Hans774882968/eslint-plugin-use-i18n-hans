/* eslint-disable @hans774882968/use-i18n/no-console */
import chalk from 'chalk';
import figlet from 'figlet';
import fs from 'fs';
import pkg from '../package.json';
import process from 'process';
import spawn from 'cross-spawn';

function displayBanner () {
  let pkgName = pkg.name.toUpperCase();
  pkgName = pkgName.substring(pkgName.indexOf('/') + 1);
  console.log(chalk.blueBright(figlet.textSync(pkgName)));
}

function main () {
  displayBanner();
  let DIST_DIR = 'dist';
  let DIST_DIR_PATH = `./${DIST_DIR}`;
  let removeDistCmd = '';
  let buildCmd = '';
  if (process.platform === 'win32') {
    removeDistCmd = `rmdir /s /q "${DIST_DIR_PATH}"`;
    buildCmd = `mkdir ${DIST_DIR} && npx tsc`;
  }
  if (process.platform === 'darwin' || process.platform === 'linux') {
    removeDistCmd = `rm -Rf ${DIST_DIR_PATH}/`;
    buildCmd = `mkdir ${DIST_DIR_PATH} && npx tsc`;
  }
  if (fs.existsSync(DIST_DIR_PATH)) {
    console.log(chalk.greenBright(`Remove ${DIST_DIR} command:`, removeDistCmd));
    spawn.sync(removeDistCmd, [], { shell: true, stdio: 'inherit' });
  }
  console.log(chalk.greenBright('Build command:', buildCmd));
  const spawnReturn = spawn.sync(buildCmd, [], { shell: true, stdio: 'inherit' });
  if (spawnReturn.error) {
    console.error(chalk.redBright('Build failed with error'), spawnReturn.error);
    return;
  }
  console.log(chalk.greenBright('✨  Done~'));
}

main();
