(function () {
  'use strict';
  async function request(path, options) {
    const response = await fetch('/api' + path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json',...(options && options.headers) },...options });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error && result.error.message || 'Request failed');
    return result;
  }
  window.UNILINK_API = {
    get: path => request(path),
    post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: path => request(path, { method: 'DELETE' })
  };
}());
