'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import JobCard from '@/components/JobCard';
import JobFilters from '@/components/JobFilters';
import { formatIndianNumber } from '@/lib/constants';

interface Filters {
  category: string;
  state: string;
  education: string;
  ageRange: string;
  reservation: string;
  feeType: string;
  vacancyMin: string;
  sortBy: string;
}

interface Job {
  _id?: string;
  title: string;
  slug: string;
  organization: string;
  category: string;
  subCategory: string;
  totalVacancies: number;
  eligibility: {
    education: string;
    age: { min: number; max: number };
  };
  salary: {
    minSalary: number;
    maxSalary: number;
    inHandEstimate: number;
  };
  importantDates: {
    applicationEnd: string;
    applicationStart: string;
  };
  location: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const DEFAULT_FILTERS: Filters = {
  category: '',
  state: '',
  education: '',
  ageRange: '',
  reservation: '',
  feeType: '',
  vacancyMin: '',
  sortBy: 'latest',
};

const ITEMS_PER_PAGE = 12;

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-xl bg-gray-100" />
        </div>
      }
    >
      <JobsPageContent />
    </Suspense>
  );
}

function JobsPageContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlState = searchParams.get('state') || '';

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    category: urlCategory,
    state: urlState,
  });
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync URL params when they change (e.g., from SearchBar navigation)
  useEffect(() => {
    const newSearch = searchParams.get('search') || '';
    const newCategory = searchParams.get('category') || '';
    const newState = searchParams.get('state') || '';
    if (newSearch !== searchQuery) setSearchQuery(newSearch);
    if (newCategory !== filters.category || newState !== filters.state) {
      setFilters((prev) => ({ ...prev, category: newCategory, state: newState }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch jobs whenever filters/search/page changes
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.category) params.set('category', filters.category);
        if (filters.state) params.set('state', filters.state);
        if (filters.education) params.set('education', filters.education);
        if (filters.vacancyMin) params.set('vacancyMin', filters.vacancyMin);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        if (searchQuery) params.set('search', searchQuery);
        params.set('page', String(page));
        params.set('limit', String(ITEMS_PER_PAGE));

        const res = await fetch(`/api/jobs?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        console.error('Fetch error:', err);
        setJobs([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [filters, searchQuery, page]);

  function handleFilterChange(newFilters: Filters) {
    setFilters(newFilters);
    setPage(1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    // triggers the useEffect above
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="section-title">Government Jobs</h1>
        <p className="mt-1 text-gray-600">
          Browse {total > 0 ? formatIndianNumber(total) : ''} active government job openings across India
        </p>
      </div>

      {/* Inline Search Bar */}
      <form onSubmit={handleSearch} className="mb-8 max-w-2xl">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs by title, organization, exam name..."
            className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-28 text-sm text-gray-900 caret-gray-900 placeholder:text-gray-400 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Main Layout */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="sticky top-24">
            <JobFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>
        </aside>

        {/* Job Listings */}
        <main className="min-w-0 flex-1">
          {/* Results Count */}
          <div className="mb-4">
            {!loading && (
              <p className="text-sm text-gray-600">
                Showing{' '}
                <span className="font-semibold text-gray-900">
                  {total > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(page * ITEMS_PER_PAGE, total)}
                </span>{' '}
                of <span className="font-semibold text-gray-900">{formatIndianNumber(total)}</span> jobs
                {searchQuery && (
                  <span>
                    {' '}for &quot;<span className="font-semibold">{searchQuery}</span>&quot;
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200" />
                    <div className="min-w-0 flex-1">
                      <div className="h-5 w-3/4 rounded bg-gray-200" />
                      <div className="mt-2 h-4 w-1/3 rounded bg-gray-200" />
                      <div className="mt-3 flex gap-2">
                        <div className="h-5 w-20 rounded-full bg-gray-200" />
                        <div className="h-5 w-24 rounded-full bg-gray-200" />
                      </div>
                      <div className="mt-4 h-8 w-full rounded bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && jobs.length === 0 && (
            <div className="card flex flex-col items-center py-16 text-center">
              <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No jobs found</h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Try adjusting your search or clearing filters.
              </p>
              <button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setSearchQuery('');
                  setPage(1);
                }}
                className="btn-primary mt-6"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Job Cards */}
          {!loading && jobs.length > 0 && (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.slug || job._id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`h-10 w-10 rounded-lg text-sm font-medium ${
                    p === page ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
