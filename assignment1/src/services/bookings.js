// Client helpers for the calendar booking features.
import { httpsCallable, getFunctions } from 'firebase/functions'

const functions = getFunctions()

export async function bookProgramSlot(payload) {
  const callable = httpsCallable(functions, 'bookProgramSlot')
  const { data } = await callable(payload)
  return data
}

export async function listProgramBookings(params = {}) {
  const callable = httpsCallable(functions, 'listProgramBookings')
  const { data } = await callable(params)
  return data
}
