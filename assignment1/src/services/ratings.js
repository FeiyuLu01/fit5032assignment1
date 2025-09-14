import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    setDoc,
    serverTimestamp,
  } from 'firebase/firestore'
  import { auth, db } from '@/services/firebase'
  
  export function listenCourtRatings(courtId, cb) {
    const itemsCol = collection(db, 'ratings', String(courtId), 'items')
    const q = query(itemsCol)
    return onSnapshot(q, (snap) => {
      let sum = 0
      const byUser = new Map()
      snap.forEach((d) => {
        const v = Number(d.data()?.value || 0)
        if (v > 0) {
          sum += v
          byUser.set(d.id, v)
        }
      })
      const count = byUser.size
      const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0
      cb({ count, avg, byUser })
    })
  }
  

  export async function getMyRatingOnce(courtId) {
    const user = auth.currentUser
    if (!user) return null
    const ref = doc(db, 'ratings', String(courtId), 'items', user.uid)
    const snap = await getDoc(ref)
    return snap.exists() ? Number(snap.data()?.value || 0) : null
  }
  
 
  export async function setMyRating(courtId, value) {
    const user = auth.currentUser
    if (!user) throw new Error('Please sign in first.')
    const v = Number(value)
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      throw new Error('Rating must be an integer from 1 to 5.')
    }
    const ref = doc(db, 'ratings', String(courtId), 'items', user.uid)
    await setDoc(
      ref,
      { value: v, updatedAt: serverTimestamp(), uid: user.uid },
      { merge: true }
    )
  }