import * as fs from 'fs/promises'
import * as path from 'path'

import { format } from 'date-fns'
import { join } from 'desm'
import got from 'got'

import { exists, writeJson } from './lib/fs.js'

const url = 'https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_county_condensed_data'

async function main () {
  try {
    const date = format(Date.now(), 'yyyy-MM-dd')
    const dataFilepath = join(import.meta.url, 'data', date)
    const sourceDataFilepath = path.join(dataFilepath, 'source', 'vaccines.json')
    const processedDataFilepath = path.join(dataFilepath, 'processed')
    const stateDataFilepath = path.join(processedDataFilepath, 'states')
    const states = {}

    const result = await got(url, { responseType: 'json' })
    const { body } = result
    const { vaccination_county_condensed_data } = body

    const resultDates = vaccination_county_condensed_data.reduce((set, item) => {
      set.add(item.Date)
      return set
    }, new Set())

    if (!resultDates.has(date)) {
      console.log('data not yet updated', resultDates.entries())
      return
    }

    await fs.mkdir(path.dirname(sourceDataFilepath), { recursive: true })
    await fs.mkdir(stateDataFilepath, { recursive: true })
    await writeJson(sourceDataFilepath, body)

    for (const item of vaccination_county_condensed_data) {
      if (!states[item.StateName]) {
        states[item.StateName] = {}
      }

      states[item.StateName][item.County] = item
    }

    for (const stateKey in states) {
      const state = states[stateKey]
      const stateFilepath = path.join(stateDataFilepath, `${stateKey}.json`)
      await writeJson(stateFilepath, state)
    }
  } catch (err) {
    console.error(err)
  }
}

main()
