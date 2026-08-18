import { execa } from 'execa';
import { IncreaseVersionFailedError } from './errors.mjs';
import { Bumper } from 'conventional-recommended-bump';
import { TAG_PACKAGE_PREFIX } from './changelog.mjs';
import { ROOT_PACKAGE_NAME } from '../deploy/config.mjs';

/**
 * Increases the version of a given package (using Yarn versioning).
 *
 * - If a `pkg` is provided, it bumps the version for that workspace package.
 * - If no package is provided, it bumps the version of the root package.
 *
 * The bump type (patch/minor/major) is determined automatically
 * by `recommendBump`.
 *
 * @param {import('./typedefs.mjs').Package} - The workspace package to bump. If omitted, the root package is used.
 * @returns {Promise<import('./typedefs.mjs').Package>} A promise resolving to the package with its new version.
 * @throws {IncreaseVersionFailedError} If the version bump fails or Yarn output cannot be parsed.
 */
export async function increaseVersionForProd(pkg) {
  const recommendation = await recommendBump(
    pkg ? pkg : { name: ROOT_PACKAGE_NAME }
  );
  const releaseType = recommendation.releaseType;
  const packageArgs = pkg ? ['workspace', pkg.name] : [];

  /** @type {import('./typedefs.mjs').IncreaseVersionResult} */
  const versions = await execa('yarn', [
    ...packageArgs,
    'version',
    `--${releaseType}`,
    '--no-git-tag-version',
    '--json',
  ])
    .then((result) => result.stdout)
    .then((output) => {
      const versions = parseYarnVersionResult(output);

      if (!versions.current && !versions.next) {
        throw new IncreaseVersionFailedError(
          `Couldn't extract versions from logs \n ${output}`
        );
      }
      return versions;
    })
    .catch((err) => {
      if (err instanceof IncreaseVersionFailedError) throw err;

      throw new IncreaseVersionFailedError(err.stderr);
    });

  return {
    ...pkg,
    version: versions.next,
  };
}

/**
 *
 * Recommend next version based on Angular conventional commits
 *
 * @param {import('./typedefs.mjs').Package} pkg package
 * @return {Promise<{level: number,reason: string, releaseType: 'patch' | 'minor' | 'major',}>}
 */
async function recommendBump(pkg) {
  const bumper = new Bumper().loadPreset('angular');
  bumper.tag({
    prefix: TAG_PACKAGE_PREFIX(pkg),
  });
  const recommendation = await bumper.bump();

  return recommendation;
}

// `--json` only reaches the command it is passed to, so `yarn workspace <pkg>
// version --json` can still print a plain text banner around the JSON.
function parseYarnVersionResult(output) {
  const logs = output
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((log) => typeof log?.data === 'string');

  return logs.reduce(
    (prev, log) => {
      if (log.data.startsWith('Current version:')) {
        return {
          ...prev,
          current: log.data.replace('Current version: ', ''),
        };
      }
      if (log.data.startsWith('New version:')) {
        return {
          ...prev,
          next: log.data.replace('New version: ', ''),
        };
      }
      return prev;
    },
    { current: null, next: null }
  );
}
