import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { StatusBadge } from '../common';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80',
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80',
];

export default function EventCard({ event, index = 0 }) {
  const image = event.poster_url || PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
  const date = new Date(event.start_datetime);
  const categories = event.categories ? event.categories.split(',') : [];
  const isAvailable = (event.available_seats || 0) > 0;

  return (
    <Link
      to={`/events/${event.event_id}`}
      className="card card-hover group block"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = PLACEHOLDER_IMAGES[0]; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
        
        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-brand-500 text-white rounded-xl px-3 py-1.5 text-center shadow-glow">
          <div className="text-xs font-medium uppercase tracking-wide leading-none">{format(date, 'MMM')}</div>
          <div className="text-lg font-bold font-display leading-tight">{format(date, 'dd')}</div>
        </div>

        {/* Availability */}
        <div className="absolute top-3 right-3">
          {!isAvailable ? (
            <span className="badge bg-red-500/90 text-white text-xs px-2 py-1">Sold Out</span>
          ) : event.available_seats < 20 ? (
            <span className="badge bg-orange-500/90 text-white text-xs px-2 py-1">
              {event.available_seats} left
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {categories.slice(0, 2).map((cat) => (
              <span key={cat} className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs">
                {cat}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-display font-semibold text-base leading-tight line-clamp-2 group-hover:text-brand-400 transition-colors mb-2">
          {event.title}
        </h3>

        {/* Venue */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.venue_name}{event.city ? `, ${event.city}` : ''}</span>
        </div>

        {/* Price + Time */}
        <div className="flex items-center justify-between">
          <div>
            {event.min_price ? (
              <span className="text-sm font-semibold text-white">
                ₹{Number(event.min_price).toLocaleString()}
                {event.max_price && event.max_price !== event.min_price && (
                  <span className="text-gray-500 font-normal"> – ₹{Number(event.max_price).toLocaleString()}</span>
                )}
              </span>
            ) : (
              <span className="text-sm text-gray-500">Free</span>
            )}
          </div>
          <span className="text-xs text-gray-500 font-mono">{format(date, 'h:mm a')}</span>
        </div>
      </div>
    </Link>
  );
}
