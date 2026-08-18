#!/usr/bin/env node
'use strict';

import chalk from 'chalk';
import { execa } from 'execa';
import process from 'node:process';

import { ROOT_VERSIONS_COMMIT_SUBJECT } from '../common/constants.mjs';
import { CustomScriptError } from '../common/errors.mjs';
import { addFileToStage, commit } from '../common/git.mjs';
import { packageChangelogPath, packageJsonPath } from '../common/path.mjs';
import { workspacePackages } from '../common/utils.mjs';
import { increaseVersionForProd } from '../common/version.mjs';

import {
  PLAYGROUND_PACKAGE_NAME,
  WIDGET_APP_PACKAGE_NAME,
} from '../deploy/config.mjs';

const MENTIONED_PACKAGE_NAME = '@arthur2079/widget-embedded';

const CLIENT_PACKAGE_NAMES = [WIDGET_APP_PACKAGE_NAME, PLAYGROUND_PACKAGE_NAME];

/** @returns {'prod' | 'next' | 'experimental'} */
function detectChannelFromArgs() {
  const flags = {
    '--prod': 'prod',
    '--next': 'next',
    '--experimental': 'experimental',
  };

  const given = process.argv.slice(2).filter((arg) => arg in flags);

  if (given.length !== 1) {
    throw new CustomScriptError(
      `You should choose exactly one flow between '--prod', '--next' and '--experimental'. Got: ${
        given.join(', ') || 'none'
      }`
    );
  }

  return flags[given[0]];
}

async function bumpVersions() {
  const pkgs = await workspacePackages();

  await increaseVersionForProd();
  await addFileToStage(packageJsonPath());

  for (const name of CLIENT_PACKAGE_NAMES) {
    const pkg = pkgs.find((workspacePkg) => workspacePkg.name === name);

    if (!pkg) {
      throw new CustomScriptError(
        `Couldn't find ${name} in the workspace packages.`
      );
    }

    await increaseVersionForProd(pkg);
    await addFileToStage(packageJsonPath(pkg.location));
  }
}

async function generateRootChangelog() {
  await execa(
    'yarn',
    [
      'rangutopia',
      'changelog',
      'generate',
      '--root',
      `--mention=${MENTIONED_PACKAGE_NAME}`,
      '--save',
    ],
    { stdio: 'inherit' }
  ).catch((e) => {
    throw new CustomScriptError(
      `Generating the root changelog failed. \n ${e.stderr || e.message}`
    );
  });

  await addFileToStage(packageChangelogPath());
}

// What `rangutopia library version` leaves out. Runs after `version apply`:
// the changelog header and `--mention` read versions off the package.json files.
async function run() {
  const channel = detectChannelFromArgs();

  if (channel !== 'prod') {
    console.log(
      `Skipping root changelog and versioning on the "${channel}" channel.`
    );
    return;
  }

  console.log(chalk.green('[1/3]'), `Bump versions`);
  await bumpVersions();

  console.log(chalk.green('[2/3]'), `Generate root changelog`);
  await generateRootChangelog();

  console.log(chalk.green('[3/3]'), `Commit changes`);
  await commit([ROOT_VERSIONS_COMMIT_SUBJECT], {
    shouldSkipCI: true,
    shouldVerify: true,
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
