const COLOR_MAP = {
  'Navy Blue': '#001f5b', Blue: '#2563eb', Black: '#1e293b', Grey: '#6b7280',
  White: '#f8fafc', Red: '#ef4444', Green: '#22c55e', Yellow: '#eab308',
  Pink: '#ec4899', Purple: '#a855f7', Orange: '#f97316', Brown: '#92400e',
  Silver: '#94a3b8', Gold: '#d97706', Beige: '#d2b48c', Maroon: '#7f1d1d',
  Cream: '#fffdd0', Olive: '#65a30d', Teal: '#14b8a6', Lavender: '#a78bfa',
  Magenta: '#d946ef', Peach: '#fdba74', Turquoise: '#2dd4bf', Coral: '#f87171',
  Multi: 'linear-gradient(135deg, #ef4444, #eab308, #22c55e, #3b82f6)',
};

const CATEGORY_COLORS = {
  Apparel: 'bg-blue-100 text-blue-800',
  Accessories: 'bg-purple-100 text-purple-800',
  Footwear: 'bg-amber-100 text-amber-800',
  'Personal Care': 'bg-green-100 text-green-800',
  'Free Items': 'bg-gray-100 text-gray-800',
  'Sporting Goods': 'bg-red-100 text-red-800',
  Home: 'bg-teal-100 text-teal-800',
};

export default function ProductCard({ product, onSelect, selected, probability }) {
  if (!product) return null;

  const colorStyle = COLOR_MAP[product.baseColour] || '#cbd5e1';
  const isGradient = typeof colorStyle === 'string' && colorStyle.startsWith('linear');
  const catClass = CATEGORY_COLORS[product.masterCategory] || 'bg-slate-100 text-slate-800';

  return (
    <div
      onClick={() => onSelect?.(product)}
      className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${catClass}`}>
          {product.masterCategory}
        </span>
        <div
          className="w-6 h-6 rounded-full border border-slate-300 shrink-0"
          style={{ background: isGradient ? colorStyle : colorStyle }}
          title={product.baseColour}
        />
      </div>

      <h3 className="text-sm font-semibold text-slate-800 leading-tight mb-1 line-clamp-2">
        {product.productDisplayName || `Product #${product.id}`}
      </h3>
      <p className="text-xs text-slate-500 mb-3">{product.articleType}</p>

      <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
        {product.gender && (
          <span className="bg-slate-50 px-2 py-0.5 rounded">{product.gender}</span>
        )}
        {product.season && (
          <span className="bg-slate-50 px-2 py-0.5 rounded">{product.season}</span>
        )}
        {product.usage && (
          <span className="bg-slate-50 px-2 py-0.5 rounded">{product.usage}</span>
        )}
      </div>

      {probability !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">Confidence</span>
            <span className="text-xs font-semibold text-indigo-600">
              {(probability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min(probability * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 mt-2">ID: {product.id}</p>
    </div>
  );
}
