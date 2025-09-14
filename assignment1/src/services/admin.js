// Firestore Admin service (full version, with rejected flow restored)
import {
    getFirestore,
    collection, doc, getDoc, getDocs,
    addDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, startAfter,
    serverTimestamp, getCountFromServer
  } from 'firebase/firestore'
  import { getAuth } from 'firebase/auth'
  
  const db = getFirestore()
  
  // Collections
  const colCourts = collection(db, 'courts')
  const colAnnouncements = collection(db, 'announcements')
  const colUsers = collection(db, 'users')
  
  // ---------- Profiles ----------
  export async function fetchAdminProfile() {
    const uid = getAuth().currentUser?.uid
    if (!uid) return null
    const snap = await getDoc(doc(colUsers, uid))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  }
  
  // ---------- Courts (approved / pending / rejected) ----------
  /**
   * Common pager for courts by status.
   */
  async function listCourtsByStatus(status, { pageSize = 20, last } = {}) {
    const constraints = [where('status', '==', status), orderBy('updatedAt', 'desc'), limit(pageSize)]
    if (last) constraints.splice(2, 0, startAfter(last.updatedAt || last))
  
    const snaps = await getDocs(query(colCourts, ...constraints))
    const items = []
    snaps.forEach(s => items.push({ id: s.id, ...s.data() }))
    return { items, cursor: items.at(-1) || null }
  }
  
  // === Courts: approved list with stable cursor ===
export async function listApprovedCourts({ pageSize = 20, last } = {}) {
    const constraints = [orderBy('updatedAt', 'desc'), limit(pageSize)];
    if (last) constraints.push(startAfter(last)); // 'last' is a QueryDocumentSnapshot
  
    const snaps = await getDocs(query(colCourts, ...constraints));
  
    const items = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
    const cursor = snaps.docs.at(-1) || null;
  
    return { items, cursor };
  }
  
  export async function listPendingCourts(opts = {}) {
    return listCourtsByStatus('pending', opts)
  }
  
  /**
   * NOTE: This export existed in你原来的Dashboard用法里，所以这里恢复导出。
   */
  export async function listRejectedCourts(opts = {}) {
    return listCourtsByStatus('rejected', opts)
  }
  
  export async function createCourt(data) {
    const keywords = (data.name + ' ' + data.address + ' ' + (data.tags || []).join(' '))
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
  
    const payload = {
      name: data.name,
      address: data.address,
      hoops: Number(data.hoops) || 0,
      lighting: !!data.lighting,
      tags: data.tags || [],
      keywords,
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authorId: getAuth().currentUser?.uid || null
    }
    return await addDoc(colCourts, payload)
  }
  
  export async function updateCourt(id, patch) {
    return updateDoc(doc(colCourts, id), { ...patch, updatedAt: serverTimestamp() })
  }
  
  export async function deleteCourtById(id) {
    return deleteDoc(doc(colCourts, id))
  }
  
  // Approval flow used by你的旧Dashboard按钮
  export async function approveCourt(id) {
    return updateDoc(doc(colCourts, id), { status: 'approved', updatedAt: serverTimestamp() })
  }
  
  export async function rejectCourt(id) {
    return updateDoc(doc(colCourts, id), { status: 'rejected', updatedAt: serverTimestamp() })
  }
  
  export async function restoreCourt(id) {
    return updateDoc(doc(colCourts, id), { status: 'pending', updatedAt: serverTimestamp() })
  }
  
  // ---------- Announcements ----------
  export async function listAnnouncements() {
    const snaps = await getDocs(query(colAnnouncements, orderBy('createdAt', 'desc'), limit(50)))
    const items = []
    snaps.forEach(s => items.push({ id: s.id, ...s.data() }))
    return items
  }
  
  export async function createAnnouncement({ title, content }) {
    return addDoc(colAnnouncements, {
      title,
      content,
      createdAt: serverTimestamp(),
      authorId: getAuth().currentUser?.uid || null
    })
  }
  
  export async function listAnnouncementsPublic(limitSize = 10) {
    const snaps = await getDocs(query(colAnnouncements, orderBy('createdAt', 'desc'), limit(limitSize)))
    const items = []
    snaps.forEach(s => items.push({ id: s.id, ...s.data() }))
    return items
  }
  
  // ---------- KPIs ----------
  export async function countCourtsAll() {
    const snap = await getCountFromServer(colCourts)
    return snap.data().count || 0
  }
  
  export async function countUsersByRole(role) {
    const q = query(colUsers, where('role', '==', role))
    const snap = await getCountFromServer(q)
    return snap.data().count || 0
  }
  
  export async function countAnnouncementsAll() {
    const snap = await getCountFromServer(colAnnouncements)
    return snap.data().count || 0
  }