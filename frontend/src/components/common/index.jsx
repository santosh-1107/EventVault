// Spinner
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${sizes[size]} ${className} animate-spin`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );
}

// Loading skeleton
export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-dark-600 rounded-xl animate-pulse shimmer ${className}`} />
  );
}

// Empty state
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4 text-3xl">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-xl mb-2">{title}</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}

// Status badge
export function StatusBadge({ status }) {
  const config = {
    confirmed: { label: 'Confirmed', class: 'bg-green-500/15 text-green-400 border-green-500/30' },
    pending: { label: 'Pending', class: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    cancelled: { label: 'Cancelled', class: 'bg-red-500/15 text-red-400 border-red-500/30' },
    success: { label: 'Paid', class: 'bg-green-500/15 text-green-400 border-green-500/30' },
    failed: { label: 'Failed', class: 'bg-red-500/15 text-red-400 border-red-500/30' },
    draft: { label: 'Draft', class: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
    published: { label: 'Published', class: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  };
  const c = config[status] || { label: status, class: 'bg-gray-500/15 text-gray-400 border-gray-500/30' };
  return (
    <span className={`badge border ${c.class}`}>{c.label}</span>
  );
}

// Section heading
export function SectionHeading({ title, subtitle, action }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h2 className="font-display font-bold text-2xl md:text-3xl">{title}</h2>
        {subtitle && <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
