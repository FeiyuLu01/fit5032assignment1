import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function requireCredentials() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
    return
  }
  console.error(
    '\n[seedFirestore] Missing credentials – set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.\n'
  )
  process.exit(1)
}

requireCredentials()
initializeApp({ credential: applicationDefault() })

const db = getFirestore()

const programSeeds = [
  {
    id: 'p1',
    title: 'U14 Fundamentals Lab',
    level: 'Beginner',
    price: 15,
    date: '2025-02-03',
    location: 'Footscray Community Gym',
    desc: 'Ball-handling, footwork and layups for new players. 90 mins.'
  },
  {
    id: 'p2',
    title: 'Elite Shooting Workshop',
    level: 'Advanced',
    price: 45,
    date: '2025-02-10',
    location: 'Melbourne Sports Centre',
    desc: 'Form shooting analytics with video feedback from coaches.'
  },
  {
    id: 'p3',
    title: 'Holiday 3x3 Tournament',
    level: 'Open',
    price: 0,
    date: '2025-02-22',
    location: 'Brunswick Court 2',
    desc: 'Friendly 3x3 with referees supplied. Register teams of 3–5.'
  },
  {
    id: 'p4',
    title: 'Girls’ Saturday Morning',
    level: 'Beginner',
    price: 5,
    date: '2025-03-01',
    location: 'Coburg Youth Centre',
    desc: 'Inclusive entry program focused on fun and confidence.'
  },
  {
    id: 'p5',
    title: 'Youth Leadership Camp',
    level: 'Intermediate',
    price: 120,
    date: '2025-03-08',
    location: 'Phillip Island Retreat',
    desc: 'Weekend leadership, nutrition, goal-setting and team building.'
  },
  {
    id: 'p6',
    title: 'Defensive Masterclass',
    level: 'Intermediate–Advanced',
    price: 30,
    date: '2025-03-16',
    location: 'Moonee Ponds High',
    desc: 'Close-outs, help rotations and on-ball pressure strategies.'
  },
  {
    id: 'p7',
    title: 'Mini Hoopers Playgroup',
    level: 'Under 10',
    price: 8,
    date: '2025-03-23',
    location: 'Sunshine Leisure Centre',
    desc: 'Parent-assisted playgroup introducing basketball through games.'
  },
  {
    id: 'p8',
    title: 'Strength & Conditioning Basics',
    level: 'All Levels',
    price: 20,
    date: '2025-03-30',
    location: 'Community High Performance Gym',
    desc: 'Body-weight circuits and mobility tailored for junior athletes.'
  },
  {
    id: 'p9',
    title: 'Community Scrimmage Night',
    level: 'Open',
    price: 2,
    date: '2025-04-05',
    location: 'Maribyrnong College Courts',
    desc: 'Casual games supervised by club coaches. Bring reversible singlet.'
  },
  {
    id: 'p10',
    title: 'Coaches Chalk Talk',
    level: 'Coaches',
    price: 25,
    date: '2025-04-12',
    location: 'North Melbourne Boardroom',
    desc: 'Offensive sets, practice planning and data tracking discussion.'
  },
  {
    id: 'p11',
    title: 'Post-Season Recovery Clinic',
    level: 'Intermediate',
    price: 18,
    date: '2025-04-19',
    location: 'Carlton Wellness Studio',
    desc: 'Mobility, stretching and recovery protocols for junior squads.'
  },
  {
    id: 'p12',
    title: 'Parent-Child Skills Day',
    level: 'Family',
    price: 12,
    date: '2025-04-26',
    location: 'Essendon District Gym',
    desc: 'Fun joint drills to help parents support skill development at home.'
  }
]

const courtSeeds = [
  {
    id: 'c1',
    name: 'Footscray Riverside Courts',
    address: 'Footscray Riverside',
    suburb: 'Footscray',
    hoops: 4,
    lights: true,
    indoor: false,
    cost: 'Free',
    hours: '6am–10pm',
    surfaces: ['Asphalt'],
    lat: -37.799,
    lng: 144.899,
    tags: ['outdoor', 'riverfront']
  },
  {
    id: 'c2',
    name: 'Brunswick Court 2',
    address: '123 Sydney Rd',
    suburb: 'Brunswick',
    hoops: 6,
    lights: true,
    indoor: true,
    cost: '$8/hr',
    hours: '8am–9pm',
    surfaces: ['Timber'],
    lat: -37.764,
    lng: 144.961,
    tags: ['indoor', 'competition']
  },
  {
    id: 'c3',
    name: 'Coburg Youth Centre',
    address: 'Coburg Youth Centre',
    suburb: 'Coburg',
    hoops: 4,
    lights: false,
    indoor: true,
    cost: '$5/hr',
    hours: '9am–6pm',
    surfaces: ['Rubber'],
    lat: -37.745,
    lng: 144.966,
    tags: ['youth', 'community']
  },
  {
    id: 'c4',
    name: 'Kensington Recreation Hall',
    address: 'Kensington Recreation Hall',
    suburb: 'Kensington',
    hoops: 6,
    lights: true,
    indoor: true,
    cost: '$12/hr',
    hours: '7am–10pm',
    surfaces: ['Timber'],
    lat: -37.795,
    lng: 144.931,
    tags: ['indoor', 'multi-court']
  },
  {
    id: 'c5',
    name: 'Albert Park Outdoor 1',
    address: 'Lakeside Dr',
    suburb: 'Albert Park',
    hoops: 4,
    lights: false,
    indoor: false,
    cost: 'Free',
    hours: '6am–9pm',
    surfaces: ['Concrete'],
    lat: -37.847,
    lng: 144.968,
    tags: ['outdoor', 'lakeside']
  },
  {
    id: 'c6',
    name: 'Moonee Valley Courts',
    address: 'Moonee Valley',
    suburb: 'Moonee Ponds',
    hoops: 6,
    lights: true,
    indoor: false,
    cost: '$4/hr',
    hours: '7am–11pm',
    surfaces: ['Asphalt'],
    lat: -37.765,
    lng: 144.919,
    tags: ['community']
  },
  {
    id: 'c7',
    name: 'Westgate Sports Hub',
    address: 'Westgate Sports Hub',
    suburb: 'Spotswood',
    hoops: 8,
    lights: true,
    indoor: true,
    cost: '$15/hr',
    hours: '6am–11pm',
    surfaces: ['High-grade Timber'],
    lat: -37.829,
    lng: 144.882,
    tags: ['premium', 'high-performance']
  },
  {
    id: 'c8',
    name: 'North Melbourne Pavilion',
    address: 'North Melbourne Pavilion',
    suburb: 'North Melbourne',
    hoops: 6,
    lights: true,
    indoor: true,
    cost: '$10/hr',
    hours: '8am–10pm',
    surfaces: ['Hybrid'],
    lat: -37.8,
    lng: 144.948,
    tags: ['indoor']
  },
  {
    id: 'c9',
    name: 'Flemington Community Court',
    address: 'Flemington Community Centre',
    suburb: 'Flemington',
    hoops: 2,
    lights: false,
    indoor: false,
    cost: 'Free',
    hours: '6am–8pm',
    surfaces: ['Rubberised'],
    lat: -37.786,
    lng: 144.925,
    tags: ['outdoor', 'family']
  },
  {
    id: 'c10',
    name: 'Port Melbourne Bayside',
    address: 'Port Melbourne Foreshore',
    suburb: 'Port Melbourne',
    hoops: 4,
    lights: true,
    indoor: false,
    cost: '$6/hr',
    hours: '6am–10pm',
    surfaces: ['Synthetic'],
    lat: -37.838,
    lng: 144.943,
    tags: ['outdoor', 'bayside']
  },
  {
    id: 'c11',
    name: 'Docklands Harbour Deck',
    address: 'Harbour Esplanade',
    suburb: 'Docklands',
    hoops: 6,
    lights: true,
    indoor: false,
    cost: '$7/hr',
    hours: '7am–9pm',
    surfaces: ['Timber'],
    lat: -37.815,
    lng: 144.946,
    tags: ['harbour', 'outdoor']
  },
  {
    id: 'c12',
    name: 'Royal Park Sports Hall',
    address: 'Royal Park Sports Hall',
    suburb: 'Parkville',
    hoops: 8,
    lights: true,
    indoor: true,
    cost: '$14/hr',
    hours: '6am–10pm',
    surfaces: ['Timber'],
    lat: -37.784,
    lng: 144.951,
    tags: ['indoor', 'club']
  }
]

function buildKeywords({ name = '', address = '', suburb = '', tags = [] }) {
  return (
    name +
    ' ' +
    address +
    ' ' +
    suburb +
    ' ' +
    (Array.isArray(tags) ? tags.join(' ') : '')
  )
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

async function seedPrograms() {
  const col = db.collection('programs')
  for (const item of programSeeds) {
    const { id, ...rest } = item
    const ref = col.doc(id)
    const dateValue = rest.date ? new Date(rest.date) : null
    const existing = await ref.get()
    const timeNow = new Date()

    await ref.set(
      {
        ...rest,
        date: dateValue || null,
        updatedAt: timeNow,
        ...(existing.exists ? {} : { createdAt: timeNow })
      },
      { merge: true }
    )
    console.log(`✓ Program seeded: ${id}`)
  }
}

async function seedCourts() {
  const col = db.collection('courts')
  for (const item of courtSeeds) {
    const { id, lights, ...rest } = item
    const ref = col.doc(id)
    const existing = await ref.get()
    const timeNow = new Date()
    const tags = Array.isArray(rest.tags) ? rest.tags : []

    await ref.set(
      {
        ...rest,
        lighting: lights,
        lights,
        tags,
        keywords: buildKeywords(rest),
        status: 'approved',
        updatedAt: timeNow,
        ...(existing.exists ? {} : { createdAt: timeNow })
      },
      { merge: true }
    )
    console.log(`✓ Court seeded: ${id}`)
  }
}

await seedPrograms()
await seedCourts()

console.log('\nSeeding complete.')
process.exit(0)
