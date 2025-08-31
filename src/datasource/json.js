
import fs from 'node:fs'

export function loadJSON(path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'))
}
