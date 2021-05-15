const { promises: Fs } = require('fs')

async function fileExists(path) {
  try {
    await Fs.access(path)
    return true
  } catch {
    return false
  }
}

module.exports = fileExists
