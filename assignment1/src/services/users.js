import { collection, getDocs, getFirestore } from 'firebase/firestore'

const db = getFirestore()

export async function fetchAllUsers() {
  const col = collection(db, 'users')
  const snapshot = await getDocs(col)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    email: doc.data().email || '',
    displayName: doc.data().displayName || '',
    role: doc.data().role || 'user'
  }))
}
