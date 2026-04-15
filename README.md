# unloader

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Unit Test][unit-test-src]][unit-test-href]

Node.js loader with a Rollup-like interface.

## Overview

unloader is a Node.js loader framework. Similar to Rollup as a general bundler,
unloader provides customization capabilities through a subset of
[Rollup plugin API](https://rollupjs.org/plugin-development/#plugins-overview).

unloader is designed to be a general-purpose loader, which can be used to
develop various loaders, such as Oxc loader, TypeScript loader, etc.

## Install

### Pre-requisites

Node.js v22.18 and above

```bash
npm i unloader
```

## Usage

### CLI

```bash
node --import unloader/register ...
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

unloader supports both ESM and CJS. All hooks are synchronous.

```ts
import { readFileSync } from 'node:fs'
import type { Plugin } from 'unloader'

const plugin: Plugin = {
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
```

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
    resolveId(source, importer, options) {
      if (source.startsWith('node:')) return

      // Feature: virtual module
      if (source === 'virtual-mod') {
        return '/virtual-mod'
      }

      // Feature: try resolve with different extensions
      const result = this.resolve(`${source}.js`, importer, options)
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

[MIT](./LICENSE) License © 2025-PRESENT [Kevin Deng](https://github.com/sxzz)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/unloader.svg
[npm-version-href]: https://npmjs.com/package/unloader
[npm-downloads-src]: https://img.shields.io/npm/dm/unloader
[npm-downloads-href]: https://www.npmcharts.com/compare/unloader?interval=30
[unit-test-src]: https://github.com/sxzz/unloader/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/sxzz/unloader/actions/workflows/unit-test.yml
