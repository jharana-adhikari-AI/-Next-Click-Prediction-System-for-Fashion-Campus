import { useState, useEffect } from 'react';
import { fetchProducts, predictNextClick, fetchModelInfo } from '../api/client';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ComparePage() {
  const [productIdInput, setProductIdInput] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [markovPreds, setMarkovPreds] = useState(null);
  const [gruPreds, setGruPreds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    fetchModelInfo().then(setModelInfo).catch(() => {});
  }, []);

  const handleSearch = async (q) => {
    setSearchText(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const data = await fetchProducts({ search: q, perPage: 6 });
      setSearchResults(data.products);
    } catch { setSearchResults([]); }
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setProductIdInput(String(product.id));
    setSearchResults([]);
    setSearchText('');
  };

  const handleCompare = async () => {
    const pid = productIdInput.trim();
    if (!pid) return;

    setLoading(true);
    setError('');
    setMarkovPreds(null);
    setGruPreds(null);

    try {
      const [markov, gru] = await Promise.all([
        predictNextClick('markov', pid, null, 5),
        predictNextClick('gru', pid, null, 5),
      ]);

      if (markov.status === 'not_found' && gru.status === 'not_found') {
        setError('Product not found in either model.');
      } else {
        setMarkovPreds(markov);
        setGruPreds(gru);
      }
    } catch {
      setError('Failed to get predictions. Is the backend running?');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Model Comparison</h1>
      <p className="text-slate-500 mb-8">Compare Markov Chain vs GRU predictions side-by-side.</p>

      {/* Accuracy Table */}
      {modelInfo && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Model Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Model</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Top-1 Accuracy</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Top-3 Accuracy</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">📊 Markov Chain</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold text-xs">
                      {(modelInfo.markov_accuracy?.top1 * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold text-xs">
                      {(modelInfo.markov_accuracy?.top3 * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-slate-500 text-xs">
                    {modelInfo.markov_states} states
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-800">🧠 GRU Network</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-semibold text-xs">
                      {(modelInfo.gru_accuracy?.top1 * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold text-xs">
                      {(modelInfo.gru_accuracy?.top3 * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-slate-500 text-xs">
                    {modelInfo.gru_units} GRU units, {modelInfo.num_training_samples?.toLocaleString()} samples
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search & Compare */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Side-by-Side Prediction</h2>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchText || productIdInput}
              onChange={(e) => {
                setProductIdInput(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search product or enter ID..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-sm border-b border-slate-100 last:border-0"
                  >
                    <span className="font-medium">{p.productDisplayName || `Product #${p.id}`}</span>
                    <span className="text-slate-400 ml-2">ID: {p.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || !productIdInput.trim()}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Comparing...' : 'Compare Models'}
          </button>
        </div>
        {selectedProduct && (
          <div className="mt-3">
            <ProductCard product={selectedProduct} selected />
          </div>
        )}
        {error && (
          <div className="mt-3 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}
      </div>

      {/* Side-by-side Results */}
      {loading ? (
        <LoadingSpinner message="Comparing models..." />
      ) : (markovPreds || gruPreds) ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Markov Results */}
          <div className="bg-white rounded-xl border-2 border-green-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📊</span>
              <h3 className="text-lg font-semibold text-slate-800">Markov Chain</h3>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                {markovPreds?.predictions?.length || 0} predictions
              </span>
            </div>
            {markovPreds?.predictions?.length > 0 ? (
              <div className="space-y-3">
                {markovPreds.predictions.map((pred, idx) => (
                  <div key={pred.product_id} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-300 w-5">{idx + 1}</span>
                    <div className="flex-1">
                      <ProductCard product={pred.product_info} probability={pred.probability} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No Markov predictions for this product.</p>
            )}
          </div>

          {/* GRU Results */}
          <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🧠</span>
              <h3 className="text-lg font-semibold text-slate-800">GRU Network</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-auto">
                {gruPreds?.predictions?.length || 0} predictions
              </span>
            </div>
            {gruPreds?.predictions?.length > 0 ? (
              <div className="space-y-3">
                {gruPreds.predictions.map((pred, idx) => (
                  <div key={pred.product_id} className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-300 w-5">{idx + 1}</span>
                    <div className="flex-1">
                      <ProductCard product={pred.product_info} probability={pred.probability} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No GRU predictions for this product.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
