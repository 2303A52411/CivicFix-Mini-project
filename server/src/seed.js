import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Issue from './models/Issue.js';
import IssueUpdate from './models/IssueUpdate.js';
const passwordHash = await bcrypt.hash('CivicFix123', 12);
await connectDB();
await Promise.all([User.deleteMany({}), Issue.deleteMany({}), IssueUpdate.deleteMany({})]);
const [reporter, coordinator, viewer] = await User.create([
  { name: 'Aarav Mehta', email: 'reporter@civicfix.test', passwordHash, role: 'reporter' },
  { name: 'Priya Sharma', email: 'coordinator@civicfix.test', passwordHash, role: 'coordinator' },
  { name: 'Community Viewer', email: 'viewer@civicfix.test', passwordHash, role: 'viewer' }
]);
const samples = [
  ['Streetlight not working', 'Streetlight', 'The streetlight near the east gate has been dark for three nights.', 'East Gate, Block A', 'High', 'Under Review'],
  ['Overflowing recycling bin', 'Waste', 'The recycling bin beside the community hall is overflowing onto the path.', 'Community Hall', 'Medium', 'Submitted'],
  ['Leaking washroom tap', 'Plumbing', 'A tap in the ground floor washroom is leaking continuously.', 'Library, Ground Floor', 'Urgent', 'In Progress'],
  ['Broken park bench', 'Furniture', 'The wooden bench has a cracked seat and exposed sharp edge.', 'Central Park', 'Low', 'Resolved']
];
for (const [title, category, description, locationText, priority, status] of samples) {
  const issue = await Issue.create({ reporterId: reporter._id, title, category, description, locationText, priority, status, ...(status === 'Resolved' && { resolutionNote: 'Bench slats replaced and inspected.', resolvedAt: new Date() }) });
  await IssueUpdate.create({ issueId: issue._id, actorId: reporter._id, oldStatus: 'Submitted', newStatus: 'Submitted', note: 'Issue reported' });
  if (status !== 'Submitted') await IssueUpdate.create({ issueId: issue._id, actorId: coordinator._id, oldStatus: 'Submitted', newStatus: status, note: status === 'Resolved' ? issue.resolutionNote : `Moved to ${status}` });
}
console.log('Seeded users and issues. Password for all demo users: CivicFix123');
process.exit(0);
