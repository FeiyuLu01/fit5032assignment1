#!/usr/bin/env node
/**
 * Imports court documents into Firestore from data/melbourne-courts.json.
 * Requires GOOGLE_APPLICATION_CREDENTIALS pointing to a service account JSON.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set. Please provide a service account JSON path.')
  process.exit(1)
}

initializeApp({
  credential: applicationDefault()
})

const db = getFirestore()
const collection = db.collection('courts')
const dataFile = path.resolve(__dirname, '../data/melbourne-courts.json')

function toKeywords(record) {
  const tags = Array.isArray(record.types) ? record.types : []
  return (
    `${record.name} ${record.address || ''} ${tags.join(' ')}`
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  )
}

function inferIndoor(record) {
  const name = record.name?.toLowerCase() || ''
  return /indoor|centre|center|hoop city|stadium/.test(name)
}

function inferSurfaces(indoor) {
  return indoor ? ['Timber'] : ['Asphalt']
}

function inferHoops(indoor) {
  return indoor ? 6 : 2
}

function inferCost(record) {
  const name = record.name?.toLowerCase() || ''
  if (name.includes('hoop city') || name.includes('centre') || name.includes('stadium')) {
    return '$10/hr'
  }
  return 'Free'
}

function normalize(record) {
  const indoor = inferIndoor(record)
  return {
    name: record.name,
    address: record.address || '',
    suburb: extractSuburb(record.address),
    lat: record.lat,
    lng: record.lng,
    cost: inferCost(record),
    hours: '6am–10pm',
    lights: true,
    lighting: true,
    indoor,
    surfaces: inferSurfaces(indoor),
    hoops: inferHoops(indoor),
    rating: record.rating || null,
    placeId: record.place_id,
    tags: record.types || [],
    keywords: toKeywords(record),
    status: 'approved',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }
}

function extractSuburb(address = '') {
  if (!address) return ''
  const parts = address.split(',')
  if (parts.length >= 2) {
    return parts[1].trim()
  }
  return address
}

async function main() {
  const raw = await fs.readFile(dataFile, 'utf-8')
  const records = JSON.parse(raw)
  if (!Array.isArray(records) || records.length === 0) {
    console.error('No records found in melbourne-courts.json.')
    process.exit(1)
  }

  console.log(`Importing ${records.length} courts...`)

  const batchSize = 400
  let processed = 0
  let batch = db.batch()
  let opsInBatch = 0

  for (const record of records) {
    const docRef = collection.doc(record.place_id || undefined)
    batch.set(docRef, normalize(record), { merge: true })
    processed += 1
    opsInBatch += 1
    if (opsInBatch >= batchSize) {
      await batch.commit()
      batch = db.batch()
      opsInBatch = 0
    }
  }

  if (opsInBatch > 0) {
    await batch.commit()
  }

  console.log(`Imported ${processed} courts into Firestore.`)
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
