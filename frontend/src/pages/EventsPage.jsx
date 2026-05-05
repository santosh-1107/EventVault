import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import EventCard from '../components/events/EventCard';
import { Skeleton, EmptyState } from '../components/common';
import { Link } from 'react-router-dom';

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [searchInput, setSearchInput] = useState(search);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const res = await api.get(`/events?${params}`);
      setEvents(res.data?.events || []);
      setTotal(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    api.get('/events/categories').then((r) => setCategories(r.data || []));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('search', searchInput);
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl mb-2">
            {category ? `${category} Events` : search ? `Results for "${search}"` : 'All Events'}
          </h1>
          {!loading && (
            <p className="text-gray-500 text-sm">{total} event{total !== 1 ? 's' : ''} found</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="card p-4">
              <label className="label">Search</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Event, artist, venue..."
                  className="input-field py-2 text-sm"
                />
                <button type="submit" className="btn-primary py-2 px-3 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Categories */}
            <div className="card p-4">
              <label className="label">Category</label>
              <div className="space-y-1 mt-2">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !category ? 'bg-brand-500/15 text-brand-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.category_id}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat.slug
                        ? 'bg-brand-500/15 text-brand-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(search || category) && (
              <button
                onClick={() => { setSearchInput(''); setSearchParams({}); }}
                className="w-full btn-ghost text-sm text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl py-2"
              >
                Clear Filters
              </button>
            )}
          </aside>

          {/* Events Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array(9).fill(0).map((_, i) => (
                  <div key={i} className="card">
                    <Skeleton className="h-44 rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <EmptyState
                icon="🎪"
                title="No events found"
                description="Try adjusting your search or browse a different category"
                action={
                  <button onClick={() => { setSearchInput(''); setSearchParams({}); }} className="btn-secondary text-sm">
                    Clear Filters
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {events.map((event, i) => (
                    <EventCard key={event.event_id} event={event} index={i} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => updateParam('page', String(page - 1))}
                      disabled={page === 1}
                      className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = i + 1;
                        return (
                          <button
                            key={p}
                            onClick={() => updateParam('page', String(p))}
                            className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                              page === p ? 'bg-brand-500 text-white shadow-glow' : 'btn-ghost'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => updateParam('page', String(page + 1))}
                      disabled={page === totalPages}
                      className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
