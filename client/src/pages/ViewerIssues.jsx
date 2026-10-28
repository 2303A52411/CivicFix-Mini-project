import { CalendarDays, Eye, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import api from '../lib/api';

const initialFilters = { search: '', category: '', priority: '', location: '', status: '' };
const categories = ['Electrical', 'Streetlight', 'Plumbing', 'Furniture', 'Waste', 'Road', 'Safety', 'Other'];
const priorities = ['Low', 'Medium', 'High', 'Urgent'];
const statuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const priorityStyles = { Urgent: 'text-rose-600', High: 'text-orange-600', Medium: 'text-amber-600', Low: 'text-emerald-600' };

export default function ViewerIssues() {
  const [filters, setFilters] = useState(initialFilters);
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/issues', { params: filters, signal: controller.signal });
        setIssues(data.issues);
        setTotal(data.pagination.total);
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') setError(requestError.response?.data?.message || 'Could not load community issues');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters]);

  const hasFilters = Object.values(filters).some(Boolean);

  return <>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-bold text-brand-600">VIEWER ACCESS</p><h1 className="mt-1 text-3xl font-extrabold">Community issue tracker</h1><p className="mt-2 text-slate-500">Browse public issue information and follow progress. Viewer access is read-only.</p></div>
      <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">{total} issue{total === 1 ? '' : 's'}</span>
    </div>

    <section className="card mt-7 p-4 sm:p-5" aria-label="Issue search and filters">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative xl:col-span-2"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input className="field pl-10" aria-label="Search by title or location" placeholder="Search title or location…" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} /></div>
        <input className="field" aria-label="Filter by location" placeholder="Filter location…" value={filters.location} onChange={event => setFilters({ ...filters, location: event.target.value })} />
        <select className="field" aria-label="Filter by category" value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select>
        <select className="field" aria-label="Filter by priority" value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option>{priorities.map(value => <option key={value}>{value}</option>)}</select>
        <select className="field" aria-label="Filter by status" value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select>
      </div>
      {hasFilters && <button className="mt-3 text-sm font-semibold text-brand-600" onClick={() => setFilters(initialFilters)}>Clear all filters</button>}
    </section>

    {loading ? <div className="py-24 text-center text-slate-400">Loading community issues…</div>
      : error ? <div className="card mt-6 py-16 text-center"><h2 className="font-bold text-rose-700">Unable to load issues</h2><p className="mt-1 text-sm text-slate-500">{error}</p></div>
      : issues.length === 0 ? <div className="card mt-6 py-20 text-center"><SlidersHorizontal className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold">No matching issues</h2><p className="mt-1 text-sm text-slate-500">Try changing or clearing your filters.</p></div>
      : <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{issues.map(issue => <article className="card flex flex-col p-5 transition hover:-translate-y-1 hover:shadow-xl" key={issue._id}>
        <div className="flex items-center justify-between gap-3"><StatusBadge status={issue.status} /><span className={`text-xs font-bold uppercase ${priorityStyles[issue.priority]}`}>{issue.priority}</span></div>
        <h2 className="mt-4 text-lg font-bold">{issue.title}</h2><p className="mt-1 text-sm font-medium text-slate-500">{issue.category}</p>
        <div className="mt-5 space-y-2 text-sm text-slate-500"><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-500" />{issue.locationText}</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Reported {new Date(issue.createdAt).toLocaleDateString()}</p></div>
        <Link className="btn-secondary mt-5 w-full" to={`/issues/${issue._id}`}><Eye className="h-4 w-4" />View details</Link>
      </article>)}</div>}
  </>;
}
