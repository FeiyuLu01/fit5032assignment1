// Cloud Functions (BR E.1) implementing email, booking, moderation logic.
import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import sgMail from '@sendgrid/mail'
import Busboy from 'busboy'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

initializeApp()
const firestore = getFirestore()
const adminAuth = getAuth()

const sendgridApiKey = defineSecret('SENDGRID_API_KEY')
const defaultSender = defineSecret('EMAIL_SENDER_DEFAULT')

async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers })
    const fields = {}
    const files = []

    busboy.on('field', (name, value) => {
      fields[name] = value
    })

    busboy.on('file', (name, stream, info) => {
      const { filename, mimeType } = info
      const chunks = []
      stream.on('data', (data) => chunks.push(data))
      stream.on('end', () => {
        files.push({
          name,
          filename,
          mimeType,
          buffer: Buffer.concat(chunks)
        })
      })
    })

    busboy.on('error', reject)
    busboy.on('finish', () => resolve({ fields, files }))
    busboy.end(req.rawBody)
  })
}

export const sendEmail = onRequest({ secrets: [sendgridApiKey, defaultSender], cors: true }, async (req, res) => {
  // Allow the Admin dashboard to broadcast messages and attachments via SendGrid (BR D.2 email requirement).
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
    return
  }

  const apiKey = sendgridApiKey.value()
  if (!apiKey) {
    res.status(500).json({ ok: false, error: 'SendGrid API key is not configured.' })
    return
  }

  sgMail.setApiKey(apiKey)

  try {
    let data = {}
    let uploads = []
    const contentType = req.headers['content-type'] || ''

    if (contentType.includes('multipart/form-data')) {
      const parsed = await parseMultipart(req)
      data = parsed.fields
      uploads = parsed.files
    } else {
      data = typeof req.body === 'object' && req.body !== null ? req.body : {}
    }

    const { to, subject, message, from } = data
    const fallbackSender = defaultSender.value()
    const sender = from || fallbackSender

    if (!to || !subject || !message || !sender) {
      res.status(400).json({
        ok: false,
        error: 'Missing required fields. Expecting to, subject, message and from (or EMAIL_SENDER_DEFAULT).'
      })
      return
    }

    const recipients = String(to)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (recipients.length === 0) {
      res.status(400).json({ ok: false, error: 'At least one recipient is required.' })
      return
    }

    const payload = {
      to: recipients.length === 1 ? recipients[0] : recipients,
      from: sender,
      subject,
      text: message,
      html: `<p>${String(message || '').replace(/\n/g, '<br/>')}</p>`
    }

    if (uploads.length > 0) {
      payload.attachments = uploads.map((file) => ({
        content: file.buffer.toString('base64'),
        filename: file.filename,
        type: file.mimeType,
        disposition: 'attachment'
      }))
    }

    await sgMail.send(payload)
    res.json({ ok: true })
  } catch (err) {
    console.error('[sendEmail] Failed:', err?.response?.body || err)
    res.status(502).json({
      ok: false,
      error: 'Failed to send email via SendGrid.',
      details: err?.response?.body || err?.message || err
    })
  }
})

function normalizeString(value, { max = 200 } = {}) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
  }
  return false
}

export const submitProgramApplication = onCall(async (request) => {
  // Standard program applications are still stored even if the user does not use the calendar.
  const ctx = request.auth
  if (!ctx) {
    throw new HttpsError('unauthenticated', 'You must be signed in to apply.')
  }

  const payload = request.data || {}
  const programId = normalizeString(payload.programId, { max: 100 })
  const form = payload.form || {}

  if (!programId) {
    throw new HttpsError('invalid-argument', 'Program ID is required.')
  }

  const name = normalizeString(form.name, { max: 120 })
  const email = normalizeString(form.email, { max: 160 })
  const notes = normalizeString(form.notes, { max: 400 })
  const phone = normalizeString(form.emergencyPhone, { max: 40 })
  const prefDate = normalizeString(form.prefDate, { max: 30 })
  const age = Number(form.age)

  if (!name || name.length < 2) {
    throw new HttpsError('invalid-argument', 'Applicant name is required.')
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.')
  }
  if (!Number.isFinite(age) || age < 6 || age > 30) {
    throw new HttpsError('invalid-argument', 'Age must be between 6 and 30.')
  }

  const programSnap = await firestore.collection('programs').doc(programId).get()
  if (!programSnap.exists) {
    throw new HttpsError('not-found', 'Program not found.')
  }
  const programData = programSnap.data() || {}

  const now = Timestamp.now()
  const application = {
    programId,
    programTitle: programData.title || '',
    applicantUid: ctx.uid,
    applicantName: name,
    applicantEmail: email,
    applicantAuthEmail: ctx.token?.email || null,
    age,
    prefDate: prefDate || null,
    notes,
    notifyParent: parseBoolean(form.notifyParent),
    emergencyPhone: phone,
    status: 'pending',
    submittedAt: now,
    lastUpdatedAt: now
  }

  const ref = await firestore.collection('programApplications').add(application)
  return { ok: true, applicationId: ref.id }
})

export const moderateProgramApplication = onCall(async (request) => {
  // Admins can approve / reject an application; approved sessions are copied into programBookings.
  const ctx = request.auth
  if (!ctx) {
    throw new HttpsError('unauthenticated', 'You must be signed in.')
  }

  const adminSnap = await firestore.collection('users').doc(ctx.uid).get()
  const adminData = adminSnap.data() || {}
  if (adminData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only administrators can moderate applications.')
  }

  const payload = request.data || {}
  const applicationId = normalizeString(payload.applicationId, { max: 200 })
  const action = normalizeString(payload.action, { max: 20 }).toLowerCase()
  const note = normalizeString(payload.note, { max: 400 })

  if (!applicationId) {
    throw new HttpsError('invalid-argument', 'Application ID is required.')
  }
  const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : ''
  if (!status) {
    throw new HttpsError('invalid-argument', 'Action must be approve or reject.')
  }

  const appRef = firestore.collection('programApplications').doc(applicationId)
  const appSnap = await appRef.get()
  if (!appSnap.exists) {
    throw new HttpsError('not-found', 'Application not found.')
  }

  await appRef.set(
    {
      status,
      decisionNote: note,
      processedBy: ctx.uid,
      processedByEmail: ctx.token?.email || null,
      processedAt: Timestamp.now(),
      lastUpdatedAt: Timestamp.now()
    },
    { merge: true }
  )

  if (status === 'approved') {
    const data = appSnap.data() || {}
    const bookingCol = firestore.collection('programBookings')
    const bookingDate = data.start || data.prefDate || null
    if (bookingDate) {
      try {
        const startDate = asDate(bookingDate)
        await bookingCol.add({
          programId: data.programId || null,
          programTitle: data.programTitle || '',
          applicantUid: data.applicantUid,
          applicantEmail: data.applicantEmail || data.applicantAuthEmail || null,
          start: Timestamp.fromDate(startDate),
          status: 'approved',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          note: data.notes || ''
        })
      } catch (err) {
        console.error('Failed to create booking automatically:', err)
      }
    }
  }

  return { ok: true }
})

function assertAuthed(ctx) {
  if (!ctx) throw new HttpsError('unauthenticated', 'Authentication required.')
}

function asDate(value) {
  if (value instanceof Date) return value
  if (value && typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new HttpsError('invalid-argument', 'Invalid date provided.')
  }
  return date
}

export const bookProgramSlot = onCall(async (request) => {
  // Calendar booking endpoint used by the ProgramCalendar view.
  const ctx = request.auth
  assertAuthed(ctx)

  const data = request.data || {}
  const programId = normalizeString(data.programId, { max: 100 })
  const slot = normalizeString(data.start, { max: 40 })
  const note = normalizeString(data.note, { max: 400 })

  if (!programId) throw new HttpsError('invalid-argument', 'Program ID is required.')
  if (!slot) throw new HttpsError('invalid-argument', 'Start time is required.')

  const startDate = asDate(slot)
  const startTimestamp = Timestamp.fromDate(startDate)
  const programRef = firestore.collection('programs').doc(programId)
  const programSnap = await programRef.get()
  if (!programSnap.exists) throw new HttpsError('not-found', 'Program not found.')

  const programData = programSnap.data() || {}
  const capacity = Number(programData.capacity) > 0 ? Number(programData.capacity) : 10

  const bookingCol = firestore.collection('programBookings')
  const slotSnap = await bookingCol
    .where('programId', '==', programId)
    .where('start', '==', startTimestamp)
    .where('status', '==', 'booked')
    .get()
  if (slotSnap.size >= capacity) {
    throw new HttpsError('resource-exhausted', 'This session is already fully booked.')
  }

  const conflictSnap = await bookingCol
    .where('applicantUid', '==', ctx.uid)
    .where('start', '==', startTimestamp)
    .get()
  if (!conflictSnap.empty) {
    throw new HttpsError('failed-precondition', 'You already have a booking for this timeslot.')
  }

  const now = Timestamp.now()
  const booking = {
    programId,
    programTitle: programData.title || '',
    applicantUid: ctx.uid,
    applicantEmail: ctx.token?.email || null,
    start: startTimestamp,
    note,
    status: 'booked',
    createdAt: now,
    updatedAt: now
  }

  const ref = await bookingCol.add(booking)
  return { ok: true, bookingId: ref.id }
})

export const listProgramBookings = onCall(async (request) => {
  // Provides bookings for the calendar (self scope) and analytics (admin scope).
  const ctx = request.auth
  assertAuthed(ctx)

  const payload = request.data || {}
  const filterProgram = normalizeString(payload.programId, { max: 100 })
  const scope = normalizeString(payload.scope, { max: 10 }) || 'self'

  const bookingCol = firestore.collection('programBookings')
  let query = bookingCol

  if (filterProgram) {
    query = query.where('programId', '==', filterProgram)
  }

  if (scope !== 'all') {
    query = query.where('applicantUid', '==', ctx.uid)
  } else {
    const adminSnap = await firestore.collection('users').doc(ctx.uid).get()
    if (!adminSnap.exists || (adminSnap.data().role || 'user') !== 'admin') {
      throw new HttpsError('permission-denied', 'Only administrators can view all bookings.')
    }
  }

  query = query.orderBy('start', 'asc').limit(200)

  const snap = await query.get()
  const bookings = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  return { ok: true, bookings }
})
