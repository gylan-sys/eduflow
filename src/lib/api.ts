
export async function fetchApi(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adiba_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(path, { ...options, headers });
  
  if (res.status === 401) {
    if (!window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('adiba_token');
      localStorage.removeItem('adiba_user');
      window.location.href = '/login';
      return new Promise(() => {}); // Return a never-resolving promise to stop further execution during redirect
    }
    throw new Error("Sesi berakhir, silakan login kembali.");
  }

  if (res.status === 403) {
    throw new Error("Anda tidak memiliki akses untuk melakukan tindakan ini.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}
