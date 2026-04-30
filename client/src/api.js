// Thin fetch wrapper. Cookies travel automatically thanks to credentials: 'include'.
async function request(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
    body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  requestOtp: (phone) => request('/api/auth/request-otp', { method: 'POST', body: { phone } }),
  verifyOtp: (phone, otp) => request('/api/auth/verify-otp', { method: 'POST', body: { phone, otp } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  // reference
  businessUnits: () => request('/api/business-units'),
  categories: () => request('/api/categories'),
  clients: () => request('/api/clients'),
  vendors: () => request('/api/vendors'),

  // banks
  banks: (unit) => request(`/api/banks${unit ? `?unit=${encodeURIComponent(unit)}` : ''}`),
  createBank: (data) => request('/api/banks', { method: 'POST', body: data }),
  updateBank: (id, data) => request(`/api/banks/${id}`, { method: 'PUT', body: data }),
  deleteBank: (id) => request(`/api/banks/${id}`, { method: 'DELETE' }),

  // inflows
  inflows: (unit) => request(`/api/inflows${unit ? `?unit=${encodeURIComponent(unit)}` : ''}`),
  createInflow: (data) => request('/api/inflows', { method: 'POST', body: data }),
  updateInflow: (id, data) => request(`/api/inflows/${id}`, { method: 'PUT', body: data }),
  deleteInflow: (id) => request(`/api/inflows/${id}`, { method: 'DELETE' }),

  // outflows
  outflows: (unit) => request(`/api/outflows${unit ? `?unit=${encodeURIComponent(unit)}` : ''}`),
  createOutflow: (data) => request('/api/outflows', { method: 'POST', body: data }),
  updateOutflow: (id, data) => request(`/api/outflows/${id}`, { method: 'PUT', body: data }),
  deleteOutflow: (id) => request(`/api/outflows/${id}`, { method: 'DELETE' }),
};
