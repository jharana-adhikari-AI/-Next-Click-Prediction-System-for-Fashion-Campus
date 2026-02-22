import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, predictNextClick, fetchSimilarProducts, fetchProduct } from '../api/client';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PredictPage() {
  const [searchParams] = useSearchParams();
  const [productIdInput, setProductIdInput] = useState(searchParams.get('product_id') || '');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [model, setModel] = useState('markov');
  const [predictions, setPredictions] = useState(null);
  const [similarProducts, setSimilarProducts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);

  // Auto-load product from URL params
  useEffect(() => {
    const pid = searchParams.get('product_id');
    if (pid) {
      setProductIdInput(pid);
      fetchProduct(pid)
        .then((p) => setSelectedProduct(p))
        .catch(() => {});
    }
  }, [searchParams]);

  const handleSearch = async (q) => {
    setSearchText(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const data = await fetchProducts({ search: q, perPage: 8 });
      setSearchResults(data.products);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setProductIdInput(String(product.id));
    setSearchResults([]);
    setSearchText('');
    setPredictions(null);
    setSimilarProducts(null);
  };

  const handlePredict = async () => {
    const pid = productIdInput.trim();
    if (!pid) { setError('Enter a product ID'); return; }

    setLoading(true);
    setError('');
    setPredictions(null);
    setSimilarProducts(null);

    try {
      const [predResult, simResult] = await Promise.all([
        predictNextClick(model, pid),
        fetchSimilarProducts(pid),
      ]);

      if (predResult.status === 'not_found') {
        setError(`Product ${pid} not found in ${model} model. Try a different product.`);
      } else {
        setPredictions(predResult);
      }

      if (simResult.status === 'success') {
        setSimilarProducts(simResult);
      }

      if (!selectedProduct) {
        fetchProduct(pid).then(setSelectedProduct).catch(() => {});
      }
    } catch (err) {
      setError('Failed to get predictions. Is the backend running?');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Next-Click Prediction</h1>
      <p className="text-slate-500 mb-8">Select a product and predict what a user will click next.</p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Input Panel */}
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Select Product</h2>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products by name..."
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-800">{p.productDisplayName || `Product #${p.id}`}</span>
                      <span className="text-slate-400 ml-2">ID: {p.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct ID input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={productIdInput}
                onChange={(e) => setProductIdInput(e.target.value)}
                placeholder="Or enter product ID directly"
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onKeyDown={(e) => e.key === 'Enter' && handlePredict()}
              />
            </div>

            {/* Model Toggle */}
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-500 block mb-2">Prediction Model</label>
              <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                {['markov', 'gru'].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setModel(m); setPredictions(null); }}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      model === m
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m === 'markov' ? '📊 Markov Chain' : '🧠 GRU Neural Net'}
                  </button>
                ))}
              </div>
            </div>

            {/* Predict Button */}
            <button
              onClick={handlePredict}
              disabled={loading || !productIdInput.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Predicting...' : 'Predict Next Click'}
            </button>

            {error && (
              <div className="mt-3 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}

            {/* Selected Product */}
            {selectedProduct && (
              <div className="mt-4">
                <label className="text-xs font-medium text-slate-500 block mb-2">Selected Product</label>
                <ProductCard product={selectedProduct} selected />
              </div>
            )}
          </div>
        </div>

        {/* Right: Results Panel */}
        <div>
          {loading ? (
            <LoadingSpinner message="Generating predictions..." />
          ) : predictions ? (
            <div className="space-y-6">
              {/* Predictions */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Predicted Next Clicks
                  </h2>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    predictions.model === 'markov' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {predictions.model === 'markov' ? 'Markov Chain' : 'GRU Network'}
                  </span>
                </div>

                {predictions.predictions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No predictions available for this product.</p>
                ) : (
                  <div className="space-y-3">
                    {predictions.predictions.map((pred, idx) => (
                      <div key={pred.product_id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-300 w-6 text-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <ProductCard
                            product={pred.product_info}
                            probability={pred.probability}
                            onSelect={() => selectProduct(pred.product_info)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Similar Products */}
              {similarProducts?.similar_products?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    Similar Products (Word2Vec)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {similarProducts.similar_products.map((sp) => (
                      <ProductCard
                        key={sp.product_id}
                        product={sp.product_info}
                        probability={sp.similarity}
                        onSelect={() => selectProduct(sp.product_info)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="text-5xl mb-4">🔮</div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to Predict</h3>
              <p className="text-sm text-slate-500">
                Select a product and click "Predict Next Click" to see what a user might browse next.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
