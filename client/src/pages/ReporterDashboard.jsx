import { ArrowRight, CheckCircle2, Clock3, FilePlus2, ListChecks } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import IssueCard from '../components/IssueCard';

export default function ReporterDashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/me/issues').then(({ data }) => setIssues(data.issues)).catch(e => setError(e.response?.data?.message || 'Could not load your reports')).finally(() => setLoading(false)); }, []);
  const stats = useMemo(() => ({ total: issues.length, active: issues.filter(i => !['Resolved', 'Rejected'].includes(i.status)).length, resolved: issues.filter(i => i.status === 'Resolved').length }), [issues]);
  if (loading) return <div className="py-24 text-center text-slate-400">Loading your dashboard…</div>;
  if (error) return <div className="card py-20 text-center text-rose-700">{error}</div>;
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-brand-600">REPORTER DASHBOARD</p><h1 className="mt-1 text-3xl font-extrabold">Your community activity</h1><p className="mt-2 text-slate-500">Report problems and follow every step toward resolution.</p></div><Link to="/report" className="btn-primary"><FilePlus2 className="h-4 w-4"/>Report an issue</Link></div>
  <div className="mt-7 grid gap-4 sm:grid-cols-3">{[[ListChecks,'Total reports',stats.total,'bg-blue-50 text-blue-700'],[Clock3,'Active',stats.active,'bg-amber-50 text-amber-700'],[CheckCircle2,'Resolved',stats.resolved,'bg-emerald-50 text-emerald-700']].map(([Icon,label,value,color])=><div className="card flex items-center gap-4 p-5" key={label}><span className={`grid h-12 w-12 place-items-center rounded-2xl ${color}`}><Icon/></span><div><p className="text-sm text-slate-500">{label}</p><b className="text-2xl">{value}</b></div></div>)}</div>
  <div className="mt-8 flex items-center justify-between"><h2 className="text-xl font-bold">Recent reports</h2><Link to="/my-reports" className="flex items-center gap-1 text-sm font-bold text-brand-600">View all <ArrowRight className="h-4 w-4"/></Link></div>
  {issues.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{issues.slice(0,3).map(i=><IssueCard key={i._id} issue={i}/>)}</div> : <div className="card mt-4 py-16 text-center"><h3 className="font-bold">No reports yet</h3><p className="mt-1 text-sm text-slate-500">Submit your first community issue to begin tracking it.</p><Link to="/report" className="btn-primary mt-5">Create first report</Link></div>}</>;
}
