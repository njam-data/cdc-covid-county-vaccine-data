import * as fs from 'fs/promises'

/**
 * check if file or folder exists
 * @param {string} filepath
 * @returns {Promise<boolean>}
 */
export async function exists (filepath) {
  try {
    await fs.access(filepath)
    return true
  } catch (e) {
    return false
  }
}

/**
 * read a json file
 * @param {string} filepath
 * @returns {Promise<object>} returns parsed json data
 */
export async function readJson (filepath) {
  const data = await fs.readFile(filepath, 'utf-8')
  return JSON.parse(data)
}

/**
 * write a json file
 * @param {string} filepath
 * @param {object} data - data that can be stringified with JSON.stringify
 */
export async function writeJson (filepath, data) {
  if (!data) {
    throw new Error(`data argument required but found ${data} when writing to ${filepath}`)
  }

  let str
  try {
    str = JSON.stringify(data, null, 2)
  } catch (err) {
    throw new Error(`JSON.stringify error: \n${err}`)
  }

  try {
    fs.writeFile(filepath, str)
  } catch (err) {
    throw new Error(`Error writing json file: \n${err}`)
  }
}
