# scribe
A CLI to bootstrap files with [Mustache](https://github.com/mustache/mustache.github.com) templates.


![CI](https://github.com/kieran-osgood/scribe/actions/workflows/main.yml/badge.svg?branch=main) 

[//]: # (Look into why this doesnt work)
[//]: # ([![npm version]&#40;https://badge.fury.io/js/@kieran-osgood/scribe.svg&#41;]&#40;//npmjs.com/package/kieran-osgood/scribe&#41;)
[//]: # (<a href="https://bundlephobia.com/package/@kieran-osgood/scribe@latest" target="\_parent">)
[//]: # (<img alt="" src="https://badgen.net/bundlephobia/minzip/@kieran-osgood/scribe" />)
[//]: # (</a>)


---

## Usage
A simple use-case is a single file to output, but you can bootstrap multiple files, e.g. test files, related components, etc.

Given an appropriate config file, when running:
```sh
$ scribe --template screen --name Login
```
with an input template like the following:

```ts
// ./login.scribe
import * as React from 'react';

type {{Name}}Props = {}

function {{Name}}Screen() {
    return (
      <>
      
      </>
    )
}
```


Would output: 

```ts
import * as React from 'react';

type LoginProps = {}

function LoginScreen() {
    return (
      <>
      
      </>
    )
}
```

---

## Arguments

---

## Syntax

---

## Roadmap

### Features
- Migrate from zod to schema
- Unify clipanion with yargs
- Add option to continue despite dirty git
- Barrel exports for TS
  - https://github.com/bencoveney/barrelsby

### DX tasks
- Add coverage reporting
- Add examples folder with template samples
- Add tests to:
  - config
  - args
  - git
- Setup serviceLayer