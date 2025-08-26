import { reactive } from 'vue'

const LS_KEY = 'cb_app_v1'

function loadFromLS() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { faves: [], registrations: [] }
    const obj = JSON.parse(raw)
    return {
      faves: Array.isArray(obj.faves) ? obj.faves : [],
      registrations: Array.isArray(obj.registrations) ? obj.registrations : []
    }
  } catch (e) {
    return { faves: [], registrations: [] }
  }
}
function saveToLS(state) {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify({ faves: state.faves, registrations: state.registrations })
  )
}


const state = reactive(loadFromLS())


export function useAppState() {
  function init() {
    
    const s = loadFromLS()
    state.faves = s.faves
    state.registrations = s.registrations
  }
  function toggleFave(courtId) {
    const i = state.faves.indexOf(courtId)
    if (i >= 0) state.faves.splice(i, 1)
    else state.faves.push(courtId)
    saveToLS(state)
  }
  function isFaved(courtId) {
    return state.faves.includes(courtId)
  }
  function addRegistration(rec) {
    state.registrations.unshift({ ...rec, ts: Date.now() })
    if (state.registrations.length > 100) state.registrations.pop()
    saveToLS(state)
  }

  return {
    state,       
    init,
    toggleFave,
    isFaved,
    addRegistration
  }
}