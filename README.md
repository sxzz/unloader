# unloader [![npm](https://img.shields.io/npm/v/unloader.svg)](https://npmjs.com/package/unloader)

[![Unit Test](https://github.com/sxzz/unloader/actions/workflows/unit-test.yml/badge.svg)](https://github.com/sxzz/unloader/actions/workflows/unit-test.yml)

Node.js loader with a Rollup-like interface.

## Overview

unloader is a Node.js loader framework. Similar to Rollup as a general bundler,
unloader provides customization capabilities through a subset of
[Rollup plugin API](https://rollupjs.org/plugin-development/#plugins-overview).

unloader is designed to be a general-purpose loader, which can be used to
develop various loaders, such as Oxc loader, TypeScript loader, etc.

## Install

### Pre-requisites

Node.js v18.19 or v20.6 and above is required for ESM support, and Node.js v22.15
and above is required for CommonJS support.

```bash
npm i unloader
```

## Usage

### CLI

```bash
node --import unloader/register ... # For ESM only, support both sync and async hooks
node --require unloader/register-sync ... # For both ESM and CJS, only support sync hooks
```

## Plugin Development

### Hooks

| Hook        | Description                       |
| ----------- | --------------------------------- |
| `options`   | Modify the options from userland. |
| `resolveId` | Resolve the module id.            |
| `load`      | Load the module.                  |
| `transform` | Transform the module.             |

### ESM and CJS

unloader supports both ESM and CJS, however, async hooks are only supported in
ESM. To support both ESM and CJS, please make sure all hooks are synchronous, or
use [quansync](https://github.com/quansync-dev/quansync).

Here is an example of using sync hooks and quansync:

<details>

<summary>Show code</summary>

```ts
import { readFileSync } from 'node:fs'
import { readFile } from '@quansync/fs'
import { quansync } from 'quansync'
import type { Plugin } from 'unloader'

// sync usage
const pluginSync: Plugin<true> = {
  name: 'my-plugin',
  resolveId(source, importer, options) {
    const result = this.resolve(`${source}.js`, importer, options)
    if (result) {
      console.log(result)
      return result
    }
  },
  load(id) {
    const contents = readFileSync(id, 'utf8')
    console.log(contents)
    return contents
  },
}

// quansync usage
const pluginQuansync: Plugin = {
  name: 'my-plugin',
  resolveId: quansync(function* (source, importer, options) {
    const result = yield this.resolve(`${source}.js`, importer, options)
    if (result) {
      console.log(result)
      return result
    }
  }),
  load: quansync(function* (id) {
    const contents = yield readFile(id, 'utf8')
    console.log(contents)
    return contents
  }),
}
```

</details>

### Example

<details>

<summary>demo.ts</summary>

```ts
let context: PluginContext

export function demoPlugin(): Plugin {
  return {
    name: 'demo-plugin',
    options(config) {
      config.sourcemap = true
    },
    buildStart(_context) {
      context = _context
      context.log('hello world')
    },
    async resolveId(source, importer, options) {
      if (source.startsWith('node:')) return

      // Feature: virtual module
      if (source === 'virtual-mod') {
        return '/virtual-mod'
      }

      // Feature: try resolve with different extensions
      const result = await this.resolve(`${source}.js`, importer, options)
      if (result) return result
    },

    load(id) {
      if (id === '/virtual-mod') {
        return { code: 'export const count = 42' }
      }
    },
    transform(code, id) {
      if (typeof code === 'string') {
        // Feature: source map
        const s = new MagicString(code)
        s.prepend('// header\n')
        const map = s.generateMap({
          file: id,
          hires: 'boundary',
          includeContent: true,
        })
        return {
          code: s.toString(),
          map,
        }
      }
    },
  }
}
```

</details>

See [demo plugin](./playground/demo.ts) and [unloader.config.ts](./unloader.config.ts) for more details.

### [unplugin](https://unplugin.unjs.io/)

unloader is supported as a framework in [unplugin](https://unplugin.unjs.io/).

```ts
// unloader.config.ts
import Oxc from 'unplugin-oxc/unloader'

export default {
  plugins: [
    Oxc({
      // options
    }),
  ],
}
```

## Credits

- Thanks to [tsx](https://github.com/privatenumber/tsx)!

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2025 [三咲智子 Kevin Deng](https://github.com/sxzz)
