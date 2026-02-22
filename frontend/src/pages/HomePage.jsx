import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchModelInfo } from '../api/client';

export default function HomePage() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Next-Click Prediction System
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          Predict what product a customer will click next on Fashion Campus using
          Markov Chains and GRU Deep Learning models trained on clickstream data.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/predict"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium no-underline hover:bg-indigo-700 transition-colors"
          >
            Try Predictions
          </Link>
          <Link
            to="/catalog"
            className="bg-white text-slate-700 px-6 py-3 rounded-xl font-medium no-underline border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Markov Chain</h3>
          <p className="text-sm text-slate-600">
            Probabilistic model that predicts the next product based on transition probabilities
            learned from click sequences.
          </p>
          {modelInfo?.markov_accuracy && (
            <div className="mt-4 bg-green-50 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-green-700">
                Top-1: {(modelInfo.markov_accuracy.top1 * 100).toFixed(1)}% |
                Top-3: {(modelInfo.markov_accuracy.top3 * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="text-3xl mb-3">🧠</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">GRU Neural Network</h3>
          <p className="text-sm text-slate-600">
            Deep learning model using Gated Recurrent Units to capture complex sequential
            patterns in browsing behavior.
          </p>
          {modelInfo?.gru_accuracy && (
            <div className="mt-4 bg-blue-50 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-blue-700">
                Top-1: {(modelInfo.gru_accuracy.top1 * 100).toFixed(1)}% |
                Top-3: {(modelInfo.gru_accuracy.top3 * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="text-3xl mb-3">🔗</div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Word2Vec Similarity</h3>
          <p className="text-sm text-slate-600">
            Product embeddings trained on click sequences to find similar products using
            cosine similarity in vector space.
          </p>
          {modelInfo && (
            <div className="mt-4 bg-purple-50 rounded-lg px-3 py-2">
              <span className="text-sm font-semibold text-purple-700">
                {modelInfo.w2v_vector_size || 64}-dim embeddings
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {modelInfo && (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">System Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {modelInfo.num_products?.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {modelInfo.num_sessions?.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Click Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {modelInfo.markov_states?.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Markov States</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {modelInfo.num_training_samples?.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500 mt-1">Training Samples</div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Connecting to prediction server...</p>
        </div>
      )}
    </div>
  );
}
