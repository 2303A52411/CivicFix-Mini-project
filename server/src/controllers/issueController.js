import Issue, { STATUSES } from '../models/Issue.js';
import IssueUpdate from '../models/IssueUpdate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { transitionIssue } from '../services/issueService.js';

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.create({ ...req.body, reporterId: req.user._id });
  await IssueUpdate.create({ issueId: issue._id, actorId: req.user._id, oldStatus: 'Submitted', newStatus: 'Submitted', note: 'Issue reported' });
  res.status(201).json({ issue: await issue.populate('reporterId', 'name') });
});

const buildFilter = query => {
  const filter = {};
  for (const key of ['category', 'priority', 'status']) if (query[key]) filter[key] = query[key];
  if (query.location) filter.locationText = { $regex: escapeRegExp(query.location), $options: 'i' };
  if (query.search) filter.$or = ['title', 'description', 'locationText'].map(key => ({ [key]: { $regex: escapeRegExp(query.search), $options: 'i' } }));
  return filter;
};

export const listIssues = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1), limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const filter = buildFilter(req.query);
  const issueQuery = Issue.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  if (req.user.role === 'viewer') issueQuery.select('title category locationText priority status createdAt');
  else issueQuery.populate('reporterId', 'name');
  const [issues, total] = await Promise.all([
    issueQuery, Issue.countDocuments(filter)
  ]);
  res.json({ issues, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const myIssues = asyncHandler(async (req, res) => {
  const filter = { ...buildFilter(req.query), reporterId: req.user._id };
  res.json({ issues: await Issue.find(filter).sort({ createdAt: -1 }) });
});

export const getIssue = asyncHandler(async (req, res) => {
  const viewer = req.user.role === 'viewer';
  const issueQuery = Issue.findById(req.params.id);
  if (viewer) issueQuery.select('-reporterId');
  else issueQuery.populate('reporterId', 'name');
  const issue = await issueQuery;
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  const updatesQuery = IssueUpdate.find({ issueId: issue._id }).sort({ createdAt: 1 });
  if (viewer) updatesQuery.select('oldStatus newStatus createdAt');
  else updatesQuery.populate('actorId', 'name role');
  const updates = await updatesQuery;
  res.json({ issue, updates });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  if (req.body.status === 'Resolved') return res.status(400).json({ message: 'Use the resolve endpoint and provide a resolution note' });
  await transitionIssue(issue, req.body.status, req.body.note, req.user._id);
  res.json({ issue });
});

export const addUpdate = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  const update = await IssueUpdate.create({ issueId: issue._id, actorId: req.user._id, oldStatus: issue.status, newStatus: issue.status, note: req.body.note });
  res.status(201).json({ update: await update.populate('actorId', 'name role') });
});

export const resolveIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  await transitionIssue(issue, 'Resolved', req.body.resolutionNote, req.user._id, { resolutionNote: req.body.resolutionNote, resolvedAt: new Date() });
  res.json({ issue });
});

export const summary = asyncHandler(async (req, res) => {
  const [statusRows, priorityRows, total] = await Promise.all([
    Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Issue.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]), Issue.countDocuments()
  ]);
  const byStatus = Object.fromEntries(STATUSES.map(s => [s, statusRows.find(r => r._id === s)?.count || 0]));
  res.json({ total, byStatus, byPriority: Object.fromEntries(priorityRows.map(r => [r._id, r.count])), open: total - byStatus.Resolved - byStatus.Rejected });
});
