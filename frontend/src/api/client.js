const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

export async function fetchProducts({ page = 1, perPage = 20, category, gender, search } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (category) params.append('category', category);
  if (gender) params.append('gender', gender);
  if (search) params.append('search', search);
  return fetchWithRetry(`${API_BASE}/products?${params}`);
}

export async function fetchProduct(productId) {
  return fetchWithRetry(`${API_BASE}/products/${productId}`);
}

export async function fetchCategories() {
  return fetchWithRetry(`${API_BASE}/categories`);
}

export async function predictNextClick(model, productId, sequence = null, topK = 5) {
  const body = { product_id: productId, top_k: topK };
  if (sequence) body.sequence = sequence;
  return fetchWithRetry(`${API_BASE}/predict/${model}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchSimilarProducts(productId, topK = 5) {
  return fetchWithRetry(`${API_BASE}/similar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, top_k: topK }),
  });
}

export async function fetchModelInfo() {
  return fetchWithRetry(`${API_BASE}/model-info`);
}

export async function healthCheck() {
  return fetchWithRetry(`${API_BASE}/health`);
}
