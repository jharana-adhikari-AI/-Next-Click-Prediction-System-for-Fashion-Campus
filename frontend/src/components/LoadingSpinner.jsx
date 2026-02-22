export default function LoadingSpinner({ message = 'Loading...', serverWaking = false }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-500">{message}</p>
      {serverWaking && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
          Server is waking up, this may take 30-60 seconds...
        </p>
      )}
    </div>
  );
}
