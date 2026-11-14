import {
  Calendar,
  LayoutGrid,
  List,
  MapPin,
  Package,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CAMPUS_LOCATIONS, ITEM_CATEGORIES, ItemReport } from '../types/findit';

interface BrowseItemsPageProps {
  reports: ItemReport[];
  loading: boolean;
}

const PAGE_SIZE = 9;

export function BrowseItemsPage({ reports, loading }: BrowseItemsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = reports.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (locationFilter !== 'all' && r.location !== locationFilter) return false;
      if (dateFilter && r.eventDate !== dateFilter) return false;
      if (q) {
        const hay = `${r.itemName} ${r.description} ${r.color} ${r.reportId} ${r.keywords.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortOrder === 'oldest') {
      return [...list].reverse();
    }
    return list;
  }, [reports, searchQuery, typeFilter, categoryFilter, locationFilter, dateFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setDateFilter('');
    setSortOrder('latest');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Browse Campus Items</h2>
          <p className="mt-1 text-sm text-slate-600">
            Real-time public discovery across campus reports. Sensitive contact details remain
            protected.
          </p>
        </div>

        {/* Grid / List View Switch */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-5">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by item name, colour, or report ID..."
              className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm focus:border-sky-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as 'all' | 'lost' | 'found');
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="lost">Lost Items</option>
              <option value="found">Found Items</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-600 focus:outline-none"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-600 focus:outline-none"
            >
              <option value="all">All Campus Locations</option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-sky-600 focus:outline-none"
            />

            {(searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all' || dateFilter) && (
              <button
                type="button"
                onClick={resetFilters}
                className="cursor-pointer text-xs font-semibold text-sky-700 hover:text-sky-800"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="tabular-nums text-xs text-slate-500">
            Showing {filtered.length} {filtered.length === 1 ? 'report' : 'reports'}
          </div>
        </div>
      </div>

      {/* Results State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="font-display mt-3 text-lg font-bold text-slate-900">
            No matching items found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing your search filters or report an item directly.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
            <Link
              to="/report-lost"
              className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Report Lost Item
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((item) => (
            <Link
              key={item.reportId}
              to={`/items/${item.reportId}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-sky-300"
            >
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                {item.photoURL ? (
                  <img
                    src={item.photoURL}
                    alt={item.itemName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 text-slate-400">
                    <Package className="h-9 w-9" />
                    <span className="mt-1.5 text-xs font-medium">{item.category}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      item.type === 'lost' ? 'text-amber-700' : 'text-teal-700'
                    }`}
                  >
                    {item.type === 'lost' ? 'Lost Item' : 'Found Item'}
                  </span>
                  <span className="font-mono-tech text-slate-400">{item.reportId}</span>
                </div>

                <h3 className="font-display mt-1.5 text-base font-bold text-slate-900 group-hover:text-sky-700">
                  {item.itemName}
                </h3>

                <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.description}</p>

                <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {item.location}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {item.eventDate}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {paginated.map((item) => (
            <Link
              key={item.reportId}
              to={`/items/${item.reportId}`}
              className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {item.photoURL ? (
                  <img
                    src={item.photoURL}
                    alt={item.itemName}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 shrink-0 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                    <Package className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-semibold uppercase tracking-wider ${
                        item.type === 'lost' ? 'text-amber-700' : 'text-teal-700'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{item.category}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono-tech text-slate-400">{item.reportId}</span>
                  </div>
                  <div className="font-display mt-0.5 truncate text-sm font-bold text-slate-900">
                    {item.itemName}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {item.location} · {item.eventDate} · {item.color}
                  </div>
                </div>
              </div>

              <span className="text-xs font-semibold text-sky-700 whitespace-nowrap">
                View Details →
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="tabular-nums text-xs text-slate-500">
            Page {safePage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
