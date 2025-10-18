const DEFAULT_ENDPOINT =
  import.meta.env.VITE_EMAIL_API_URL ||
  'https://us-central1-basketballhub-5b97d.cloudfunctions.net/sendEmail'

/**
 * Send an email request to backend email microservice.
 * @param {FormData} formData - form data must include `to`, `subject`, `message`, optional `from` and `attachment`.
 */
export async function sendEmail(formData) {
  if (!(formData instanceof FormData)) {
    throw new Error('sendEmail expects a FormData payload.')
  }

  const resp = await fetch(DEFAULT_ENDPOINT, {
    method: 'POST',
    body: formData
  })

  const json = await resp.json().catch(() => ({}))
  if (!resp.ok || json?.ok === false) {
    const error = json?.error || resp.statusText || 'Failed to send email.'
    throw new Error(error)
  }
  return json
}
