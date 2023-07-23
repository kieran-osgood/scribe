# scribe

Standardise bootstrapping your files with [Mustache](https://github.com/mustache/mustache.github.com) templates.

<div align='center'>
  <img src="docs/usage.png" alt="scribe usage example" style='margin-bottom: 25px; margin-top: 20px; height: 450px;'>
</div>

<p align="center">


[//]: # (URL for usage example above)
[//]: # (https://ray.so/#code=JCBzY3JpYmUgLS10ZW1wbGF0ZT1zY3JlZW4gLS1uYW1lPUxvZ2luCgrinIUgU3VjY2Vzc2Z1bCBHZW5lcmF0aW9uCgpPdXRwdXQgZmlsZXM6IAotICJzcmMvc2NyZWVucy9sb2dpbi50cyIKLSAic3JjL3NjcmVlbnMvbG9naW4udGVzdC50cyIK&language=shell)

  <img src="https://github.com/kieran-osgood/scribe/actions/workflows/main.yml/badge.svg?branch=main" alt="npm downloads" height="20">

  <a href="https://www.npmjs.com/package/@kieran-osgood/scribe">
    <img src="https://img.shields.io/npm/dm/@kieran-osgood/scribe.svg" alt="npm downloads" height="20">
  </a>
</p>


[//]: # (Look into why this doesnt work)

[//]: # ([![npm version]&#40;https://badge.fury.io/js/@kieran-osgood/scribe.svg&#41;]&#40;//npmjs.com/package/kieran-osgood/scribe&#41;)

[//]: # (<a href="https://bundlephobia.com/package/@kieran-osgood/scribe@latest" target="\_parent">)

[//]: # (<img alt="" src="https://badgen.net/bundlephobia/minzip/@kieran-osgood/scribe" />)

[//]: # (</a>)

---

## Installation

```shell
npm i -D @kieran-osgood/scribe
pnpm i -D @kieran-osgood/scribe
yarn add -D @kieran-osgood/scribe
```
## Usage

A simple use-case is a single file to output, but you can bootstrap multiple files, e.g. test files, related components,
etc.

Given an appropriate config file, when running:

```sh
$ scribe --template screen --name Login
```

with an input template like the following:

```mustache
import * as React from 'react';

type {{Name}}Props = {}

function {{Name}}Screen() {
  return (
    <></>
  )
}
```

Would output:

```tsx
import * as React from 'react';

type LoginProps = {}

function LoginScreen() {
  return (
    <></>
  )
}
```