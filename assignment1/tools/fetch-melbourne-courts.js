#!/usr/bin/env node
/**
 * Fetches basketball courts around Melbourne using Google Places Text Search API.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=your-key node tools/fetch-melbourne-courts.js
 *
 * The script writes the first 12 results to data/melbourne-courts.json
 * with fields compatible with the `courts` collection in Firestore.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY

if (!API_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY environment variable.')
  process.exit(1)
}

const MAX_RESULTS = 12
const OUTPUT_FILE = path.resolve(__dirname, '../data/melbourne-courts.json')

const baseURL = 'https://maps.googleapis.com/maps/api/place/textsearch/json'

function buildUrl(params) {
  const url = new URL(baseURL)
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) url.searchParams.set(key, value)
  })
  return url
}

async function fetchPage({ query, pagetoken }) {
  const params = {
    key: API_KEY,
    query,
    type: 'point_of_interest',
    region: 'au',
    pagetoken
  }
  const url = buildUrl(params)
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Google Places request failed: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places error: ${json.status} – ${json.error_message || 'no detail'}`)
  }
  return json
}

function mapResult(place) {
  const loc = place.geometry?.location || {}
  return {
    place_id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    lat: loc.lat,
    lng: loc.lng,
    rating: place.rating || null,
    user_ratings_total: place.user_ratings_total || 0,
    types: place.types || []
  }
}

async function main() {
  const query = 'basketball court in Melbourne VIC'
  const collected = []
  let pagetoken = undefined
  let pageCount = 0

  while (collected.length < MAX_RESULTS && pageCount < 5) {
    if (pagetoken) {
      // Google requires a short delay before requesting the next page.
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    const data = await fetchPage({ query, pagetoken })
    pageCount += 1

    const newItems = (data.results || [])
      .map(mapResult)
      .filter((item) => typeof item.lat === 'number' && typeof item.lng === 'number')

    for (const item of newItems) {
      if (collected.find((existing) => existing.place_id === item.place_id)) continue
      collected.push(item)
      if (collected.length >= MAX_RESULTS) break
    }

    if (!data.next_page_token) break
    pagetoken = data.next_page_token
  }

  if (collected.length === 0) {
    console.warn('No basketball courts found for Melbourne query.')
  } else {
    console.log(`Fetched ${collected.length} basketball courts.`)
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(collected, null, 2), 'utf-8')
  console.log(`Results written to ${OUTPUT_FILE}`)
}

main().catch((err) => {
  console.error('Failed to fetch courts:', err)
  process.exit(1)
})
