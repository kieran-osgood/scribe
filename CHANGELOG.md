# @kieran-osgood/scribe

## 0.4.0

### Minor Changes

- dcad77b: Adds prompt to continue (dangerously) when git worktree is dirty

### Patch Changes

- dcad77b: fixes implicit coercion of exitCode on success
- dcad77b: Fixes error where CLI continues after selecting no for non-git workspaces
- dcad77b: Improve formatting of stdout to be more rich
- dcad77b: fix postinstall script failing installs for users

## 0.3.1

### Patch Changes

- b6f9b1a: Fix issues with ScribeConfig type being inaccessible
- b6f9b1a: Migrate to effect core package
  Includes new TS-eslint rules to raise strictness
  Bumps TS to 5.2.2
- b6f9b1a: (internal) Add definitions command

## 0.3.0

### Minor Changes

- 557b452: (NEW): Init Command - bootstraps a basic `scribe.config.ts` file in the cwd.

  Improves logging across all commands in error events.

## 0.2.0

### Minor Changes

- cbe2c34: Fixed potential miss-pathing errors - Replaced dependencies to reduce size, bulked up testing - Improved error logging and formatting of output to stdout/stderr

## 0.1.0

### Minor Changes

- cbe2c34: Allows passing of absolute paths to --config flag
- cbe2c34: Fixed potential miss-pathing errors - Replaced dependencies to reduce size, bulked up testing - Improved error logging and formatting of output to stdout/stderr
- cbe2c34: Scribe can now accept multiple output files per run.
  If writing to any file fails, cleans up after itself.

### Patch Changes

- cbe2c34: Initial working prototype

## 0.1.0

### Minor Changes

- 6749a02: Scribe can now accept multiple output files per run.
  If writing to any file fails, cleans up after itself.

### Patch Changes

- 6749a02: Initial working prototype

## 0.0.4

### Patch Changes

- 29e48e5: Another test release

## 0.0.3

### Patch Changes

- 2031d1a: Testing a patch release

## 0.0.2

### Patch Changes

- 5b4200c: Initial reading config setup
- 944fe7e: test release process script
