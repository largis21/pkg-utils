import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import treeify from 'treeify'
import {PkgExport, BuildContext} from './core'
import {getFilesize} from './getFilesize'

export function fileExists(file: string): boolean {
  try {
    fs.accessSync(file)

    return true
  } catch (_) {
    return false
  }
}

function getFileInfo(cwd: string, filePath: string) {
  const p = path.resolve(cwd, filePath)
  const exists = fileExists(p)
  const size = exists ? getFilesize(p) : undefined

  return {exists, size}
}

export function printPackageTree(ctx: BuildContext): void {
  const {cwd, exports, logger, pkg} = ctx

  if (!exports) return

  logger.log(`${chalk.blue(pkg.name)}@${chalk.green(pkg.version)}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tree: Record<string, any> = {}

  if (pkg.bin) {
    tree.bin = pkg.bin
  }

  function fileInfo(file: string) {
    const info = getFileInfo(cwd, file)

    if (!info.size) {
      return `${chalk.gray(file)} ${chalk.red('does not exist')}`
    }

    return `${file} ${chalk.gray(info.size)}`
  }

  tree.exports = Object.fromEntries(
    Object.entries(exports)
      .filter(([, entry]) => entry._exported)
      .map(([exportPath, entry]) => {
        const exp: Omit<PkgExport, '_exported'> = {
          source: entry.source,
          types: undefined,
          browser: undefined,
          node: undefined,
          import: undefined,
          require: undefined,
          default: entry.default,
        }

        if (entry.types) {
          exp.types = fileInfo(entry.types)
        } else {
          delete exp.types
        }

        if (entry.browser) {
          exp.browser = {source: entry.browser.source}

          if (entry.browser.import) exp.browser.import = fileInfo(entry.browser.import)
          if (entry.browser.require) exp.browser.require = fileInfo(entry.browser.require)
        } else {
          delete exp.browser
        }

        if (entry.node) {
          exp.node = {source: entry.node.source}

          if (entry.node.import) exp.node.import = fileInfo(entry.node.import)
          if (entry.node.require) exp.node.require = fileInfo(entry.node.require)
        } else {
          delete exp.node
        }

        if (entry.import) {
          exp.import = fileInfo(entry.import)
        } else {
          delete exp.import
        }

        if (entry.require) {
          exp.require = fileInfo(entry.require)
        } else {
          delete exp.require
        }

        exp.default = fileInfo(entry.default)

        return [chalk.green(path.join(pkg.name, exportPath)), exp]
      })
  )

  logger.log(treeify.asTree(tree, true, true))
}