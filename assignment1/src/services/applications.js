import { getFunctions, httpsCallable } from 'firebase/functions'
import { collection, getFirestore, query, where, orderBy, getDocs } from 'firebase/firestore'
const functions = getFunctions()
const db = getFirestore()

function mapApplicationDoc(docSnap) {
  const data = docSnap.data() || {}
  const submittedAt = data.submittedAt?.toDate?.() || null
  const processedAt = data.processedAt?.toDate?.() || null

  return {
    id: docSnap.id,
    programId: data.programId || '',
    programTitle: data.programTitle || '',
    applicantUid: data.applicantUid || '',
    applicantName: data.applicantName || '',
    applicantEmail: data.applicantEmail || '',
    applicantAuthEmail: data.applicantAuthEmail || '',
    age: data.age || null,
    prefDate: data.prefDate || '',
    notes: data.notes || '',
    notifyParent: !!data.notifyParent,
    emergencyPhone: data.emergencyPhone || '',
    status: data.status || 'pending',
    decisionNote: data.decisionNote || '',
    processedBy: data.processedBy || '',
    processedByEmail: data.processedByEmail || '',
    submittedAt,
    processedAt,
    lastUpdatedAt: data.lastUpdatedAt?.toDate?.() || submittedAt
  }
}

export async function applyForProgram(programId, form) {
  const callable = httpsCallable(functions, 'submitProgramApplication')
  const { data } = await callable({ programId, form })
  return data
}

export async function fetchMyApplications(uid) {
  if (!uid) return []
  const col = collection(db, 'programApplications')
  const q = query(col, where('applicantUid', '==', uid), orderBy('submittedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(mapApplicationDoc)
}

export async function fetchProgramApplications(status = 'pending') {
  const col = collection(db, 'programApplications')
  const q = query(col, orderBy('submittedAt', 'desc'))
  const snap = await getDocs(q)
  const list = snap.docs.map(mapApplicationDoc)
  if (!status || status === 'all') return list
  return list.filter((item) => item.status === status)
}

export async function moderateApplication(applicationId, action, note = '') {
  const callable = httpsCallable(functions, 'moderateProgramApplication')
  const { data } = await callable({ applicationId, action, note })
  return data
}
