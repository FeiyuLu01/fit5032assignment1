// src/services/announcements.js
import {
    getFirestore,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    getDocs,
    deleteDoc,
    doc
  } from 'firebase/firestore'
  
  // Import createAnnouncement from admin.js (write logic stays in admin.js)
  import { createAnnouncement } from './admin'
  
  // Convert Firestore doc to plain object
  function toAnnouncement(docSnap) {
    const data = docSnap.data() || {}
    return {
      id: docSnap.id,
      title: data.title || '(Untitled)',
      content: data.content || '',
      bodyHtml: data.bodyHtml || '',
      createdAt: data.createdAt || null,
    }
  }
  
  /**
   * Realtime listener for announcements
   */
  export function listenAnnouncements(callback, { top = 20 } = {}) {
    const db = getFirestore()
    const col = collection(db, 'announcements')
    const q = query(col, orderBy('createdAt', 'desc'), limit(top))
  
    return onSnapshot(
      q,
      (snap) => callback(snap.docs.map(toAnnouncement)),
      (err) => {
        console.warn('[announcements] onSnapshot error:', err)
        callback([])
      }
    )
  }
  
  /**
   * Fetch announcements once
   */
  export async function fetchAnnouncementsOnce({ top = 20 } = {}) {
    const db = getFirestore()
    const col = collection(db, 'announcements')
    const q = query(col, orderBy('createdAt', 'desc'), limit(top))
    const snap = await getDocs(q)
    return snap.docs.map(toAnnouncement)
  }
  
  /**
   * Create announcement (re-exported from admin.js)
   */
  export { createAnnouncement }
  
  /**
   * Delete announcement by id
   */
  export async function removeAnnouncement(id) {
    if (!id) return
    const db = getFirestore()
    await deleteDoc(doc(db, 'announcements', id))
  }