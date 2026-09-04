/**
 * Conventional Commits.
 *
 * Commit subjects must look like `feat: add X` or `fix(ci): stop Y`.
 * Merge and revert commits are ignored by commitlint's own defaults.
 *
 * @type {import("@commitlint/types").UserConfig}
 */
export default {
  extends: ["@commitlint/config-conventional"],
};
