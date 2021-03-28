import * as fs from 'fs/promises'
import * as path from 'path'

import { format } from 'date-fns'
import { join } from 'desm'
import got from 'got'

import { writeJson } from './lib/fs.js'

const url = 'https://covid.cdc.gov/covid-data-tracker/COVIDData/getAjaxData?id=vaccination_county_condensed_data'

async function main () {
  try {
    const date = format(Date.now(), 'yyyy-MM-dd')
    const dataFilepath = join(import.meta.url, 'data', date)
    const sourceDataFilepath = path.join(dataFilepath, 'source', 'vaccinations.json')
    const processedDataFilepath = path.join(dataFilepath, 'processed')
    const stateDataFilepath = path.join(processedDataFilepath, 'states')
    const states = {}

    const result = await got(url, { responseType: 'json' })
    const { body } = result

    const { vaccination_county_condensed_data: vaccineData } = body

    const resultDates = vaccineData.reduce((set, item) => {
      set.add(item.Date)
      return set
    }, new Set())

    const existingDataDates = await fs.readdir(join(import.meta.url, 'data'))

    if (resultDates.has(date) && existingDataDates.includes(date)) {
      console.log('data not yet updated', resultDates)
      return
    }

    await fs.mkdir(path.dirname(sourceDataFilepath), { recursive: true })
    await fs.mkdir(stateDataFilepath, { recursive: true })
    await writeJson(sourceDataFilepath, body)

    for (const item of vaccineData) {
      if (!states[item.StateName]) {
        states[item.StateName] = {}
      }

      states[item.StateName][item.County] = item
    }

    for (const stateKey in states) {
      const state = states[stateKey]
      const stateName = stateKey.toLowerCase().replace(/\s/g, '_')
      const stateFilepath = path.join(stateDataFilepath, `${stateName}.json`)
      await writeJson(stateFilepath, state)
    }
  } catch (err) {
    console.error(err)
  }
}

main()
