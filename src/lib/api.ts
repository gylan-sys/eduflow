
export async function fetchApi(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adiba_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(path, { ...options, headers });
  
  if (res.status === 401) {
    // If not on login page, redirect
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
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
