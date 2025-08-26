export function formatDateISOToDMY(iso) {
    if (!iso) return '';
    if (iso instanceof Date) {
      const y = iso.getFullYear();
      const m = String(iso.getMonth() + 1).padStart(2, '0');
      const d = String(iso.getDate()).padStart(2, '0');
      return `${d}/${m}/${y}`;
    }
    if (typeof iso === 'number') {
      return formatDateISOToDMY(new Date(iso));
    }
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
  }
  
export function formatDateTimeDMY(value) {
    const dt = value instanceof Date ? value : new Date(value);
    if (isNaN(dt.getTime())) return '';
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  }

export function maskEmail(email) {
    if (!email) return ''
    const [user, domain] = email.split('@')
    if (!domain) return email
  
    let maskedDomain = domain
    if (domain.endsWith('.com')) {
      const main = domain.slice(0, -4)
      maskedDomain = '*'.repeat(main.length) + '.com'
    } else {
      maskedDomain = '*'.repeat(domain.length)
    }
  
    return '*'.repeat(user.length) + '@' + maskedDomain
  }
  
export function maskPhone(phone) {
    if (!phone) return ''
    const len = phone.length
    if (len <= 3) return phone
    const visible = phone.slice(-3)
    return '*'.repeat(len - 3) + visible
  }