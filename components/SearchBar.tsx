'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/jobs?search=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative">
        <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
  );
}
