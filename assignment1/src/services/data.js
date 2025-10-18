import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where
} from 'firebase/firestore'

const db = getFirestore()

const fallbackPrograms = [
  { id: 'p1', title: 'U14 Fundamentals Lab', level: 'Beginner', price: 15,
    date: '2025-02-03', location: 'Footscray Community Gym',
    desc: 'Ball-handling, footwork and layups for new players. 90 mins.' },
  { id: 'p2', title: 'Elite Shooting Workshop', level: 'Advanced', price: 45,
    date: '2025-02-10', location: 'Melbourne Sports Centre',
    desc: 'Form shooting analytics with video feedback from coaches.' },
  { id: 'p3', title: 'Holiday 3x3 Tournament', level: 'Open', price: 0,
    date: '2025-02-22', location: 'Brunswick Court 2',
    desc: 'Friendly 3x3 with referees supplied. Register teams of 3–5.' },
  { id: 'p4', title: 'Girls’ Saturday Morning', level: 'Beginner', price: 5,
    date: '2025-03-01', location: 'Coburg Youth Centre',
    desc: 'Inclusive entry program focused on fun and confidence.' },
  { id: 'p5', title: 'Youth Leadership Camp', level: 'Intermediate', price: 120,
    date: '2025-03-08', location: 'Phillip Island Retreat',
    desc: 'Weekend leadership, nutrition, goal-setting and team building.' },
  { id: 'p6', title: 'Defensive Masterclass', level: 'Intermediate–Advanced', price: 30,
    date: '2025-03-16', location: 'Moonee Ponds High',
    desc: 'Close-outs, help rotations and on-ball pressure strategies.' },
  { id: 'p7', title: 'Mini Hoopers Playgroup', level: 'Under 10', price: 8,
    date: '2025-03-23', location: 'Sunshine Leisure Centre',
    desc: 'Parent-assisted playgroup introducing basketball through games.' },
  { id: 'p8', title: 'Strength & Conditioning Basics', level: 'All Levels', price: 20,
    date: '2025-03-30', location: 'Community High Performance Gym',
    desc: 'Body-weight circuits and mobility tailored for junior athletes.' },
  { id: 'p9', title: 'Community Scrimmage Night', level: 'Open', price: 2,
    date: '2025-04-05', location: 'Maribyrnong College Courts',
    desc: 'Casual games supervised by club coaches. Bring reversible singlet.' },
  { id: 'p10', title: 'Coaches Chalk Talk', level: 'Coaches', price: 25,
    date: '2025-04-12', location: 'North Melbourne Boardroom',
    desc: 'Offensive sets, practice planning and data tracking discussion.' },
  { id: 'p11', title: 'Post-Season Recovery Clinic', level: 'Intermediate', price: 18,
    date: '2025-04-19', location: 'Carlton Wellness Studio',
    desc: 'Mobility, stretching and recovery protocols for junior squads.' },
  { id: 'p12', title: 'Parent-Child Skills Day', level: 'Family', price: 12,
    date: '2025-04-26', location: 'Essendon District Gym',
    desc: 'Fun joint drills to help parents support skill development at home.' }
]

const fallbackCourts = [
  { id: 'c1', name: 'Footscray Riverside Courts', suburb: 'Footscray', lights: true, indoor: false,
    lat: -37.799, lng: 144.899, cost: 'Free', surfaces: ['Asphalt'], hours: '6am–10pm', address: 'Footscray Riverside' },
  { id: 'c2', name: 'Brunswick Court 2', suburb: 'Brunswick', lights: true, indoor: true,
    lat: -37.764, lng: 144.961, cost: '$8/hr', surfaces: ['Timber'], hours: '8am–9pm', address: '123 Sydney Rd, Brunswick' },
  { id: 'c3', name: 'Coburg Youth Centre', suburb: 'Coburg', lights: false, indoor: true,
    lat: -37.745, lng: 144.966, cost: '$5/hr', surfaces: ['Rubber'], hours: '9am–6pm', address: 'Coburg Youth Centre' },
  { id: 'c4', name: 'Kensington Recreation Hall', suburb: 'Kensington', lights: true, indoor: true,
    lat: -37.795, lng: 144.931, cost: '$12/hr', surfaces: ['Timber'], hours: '7am–10pm', address: 'Kensington Recreation Hall' },
  { id: 'c5', name: 'Albert Park Outdoor 1', suburb: 'Albert Park', lights: false, indoor: false,
    lat: -37.847, lng: 144.968, cost: 'Free', surfaces: ['Concrete'], hours: '6am–9pm', address: 'Lakeside Dr, Albert Park' },
  { id: 'c6', name: 'Moonee Valley Courts', suburb: 'Moonee Ponds', lights: true, indoor: false,
    lat: -37.765, lng: 144.919, cost: '$4/hr', surfaces: ['Asphalt'], hours: '7am–11pm', address: 'Moonee Valley' },
  { id: 'c7', name: 'Westgate Sports Hub', suburb: 'Spotswood', lights: true, indoor: true,
    lat: -37.829, lng: 144.882, cost: '$15/hr', surfaces: ['High-grade Timber'], hours: '6am–11pm', address: 'Westgate Sports Hub' },
  { id: 'c8', name: 'North Melbourne Pavilion', suburb: 'North Melbourne', lights: true, indoor: true,
    lat: -37.8, lng: 144.948, cost: '$10/hr', surfaces: ['Hybrid'], hours: '8am–10pm', address: 'North Melbourne Pavilion' },
  { id: 'c9', name: 'Flemington Community Court', suburb: 'Flemington', lights: false, indoor: false,
    lat: -37.786, lng: 144.925, cost: 'Free', surfaces: ['Rubberised'], hours: '6am–8pm', address: 'Flemington Community Centre' },
  { id: 'c10', name: 'Port Melbourne Bayside', suburb: 'Port Melbourne', lights: true, indoor: false,
    lat: -37.838, lng: 144.943, cost: '$6/hr', surfaces: ['Synthetic'], hours: '6am–10pm', address: 'Port Melbourne' },
  { id: 'c11', name: 'Docklands Harbour Deck', suburb: 'Docklands', lights: true, indoor: false,
    lat: -37.815, lng: 144.946, cost: '$7/hr', surfaces: ['Timber'], hours: '7am–9pm', address: 'Docklands Harbour Deck' },
  { id: 'c12', name: 'Royal Park Sports Hall', suburb: 'Parkville', lights: true, indoor: true,
    lat: -37.784, lng: 144.951, cost: '$14/hr', surfaces: ['Timber'], hours: '6am–10pm', address: 'Royal Park Sports Hall' }
]

function mapProgramDoc(docSnap) {
  const data = docSnap.data() || {}
  let dateValue = data.date || ''
  if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    try {
      const iso = dateValue.toDate().toISOString()
      dateValue = iso.slice(0, 10)
    } catch {
      dateValue = ''
    }
  }
  return {
    id: docSnap.id,
    title: data.title || 'Untitled Program',
    level: data.level || 'Open',
    price: typeof data.price === 'number' ? data.price : Number(data.price ?? 0),
    date: dateValue,
    location: data.location || '',
    desc: data.desc || data.description || '',
    timeSlots: Array.isArray(data.timeSlots) && data.timeSlots.length > 0 ? data.timeSlots : ['10:00', '14:00']
  }
}

function mapCourtDoc(docSnap) {
  const data = docSnap.data() || {}
  const location = data.location || {}
  const latValue = Number(data.lat ?? location.lat)
  const lngValue = Number(data.lng ?? location.lng)

  return {
    id: docSnap.id,
    name: data.name || 'Unnamed Court',
    address: data.address || '',
    suburb: data.suburb || '',
    lights: typeof data.lights === 'boolean' ? data.lights : !!data.lighting,
    indoor: typeof data.indoor === 'boolean' ? data.indoor : !!data.indoorOnly,
    cost: data.cost || '',
    hours: data.hours || '',
    surfaces: Array.isArray(data.surfaces) ? data.surfaces : (data.surface ? [data.surface] : []),
    hoops: typeof data.hoops === 'number' ? data.hoops : Number(data.hoops ?? 0),
    lat: Number.isFinite(latValue) ? latValue : null,
    lng: Number.isFinite(lngValue) ? lngValue : null,
    status: data.status || 'pending',
    tags: Array.isArray(data.tags) ? data.tags : []
  }
}

export async function fetchPrograms() {
  try {
    const col = collection(db, 'programs')
    const q = query(col, orderBy('date', 'asc'))
    const snap = await getDocs(q)
    if (snap.empty) return fallbackPrograms
    return snap.docs.map(mapProgramDoc)
  } catch (err) {
    console.warn('[data] fetchPrograms failed, using fallback', err)
    return fallbackPrograms
  }
}

export async function fetchCourts() {
  try {
    const col = collection(db, 'courts')
    const q = query(col, where('status', '==', 'approved'))
    const snap = await getDocs(q)
    if (snap.empty) return fallbackCourts
    return snap.docs.map(mapCourtDoc).sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    console.warn('[data] fetchCourts failed, using fallback', err)
    return fallbackCourts
  }
}

export async function fetchCourtById(id) {
  if (!id) return null
  try {
    const docRef = doc(db, 'courts', id)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return mapCourtDoc(snap)
    }
  } catch (err) {
    console.warn('[data] fetchCourtById failed, falling back', err)
  }
  const list = await fetchCourts()
  return list.find((c) => c.id === id) || null
}
