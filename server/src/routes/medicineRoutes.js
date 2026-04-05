import express from 'express';
import Medicine from '../models/Medicine.js';
import { connectMongo } from '../utils/mongo.js';

const router = express.Router();

/* ── helpers ─────────────────────────────────────────── */
function todayStr() { return new Date().toISOString().split('T')[0]; }
function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/**
 * The JWT payload produced by signToken() uses the key `userId`
 * (see utils/jwt.js → jwt.sign({ userId: String(user._id) })).
 * So req.auth.userId is the correct field — NOT req.auth.id.
 */
function uid(req) {
  const id = req.auth?.userId;
  if (!id) throw new Error('Missing userId in JWT payload');
  return id;
}

/* ── POST /api/medicines ────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    await connectMongo();
    console.log('[Medicine POST] body:', req.body, 'uid:', req.auth?.userId);

    const { name, dosage, times, reminderType, days, startDate, endDate, notes } = req.body;

    if (!name?.trim())  return res.status(400).json({ success: false, message: 'Medicine name is required.' });
    if (!dosage?.trim())return res.status(400).json({ success: false, message: 'Dosage is required.' });
    if (!times?.length) return res.status(400).json({ success: false, message: 'At least one time is required.' });
    if (reminderType === 'days' && (!days || days.length === 0))
      return res.status(400).json({ success: false, message: 'Select at least one day.' });
    if (reminderType === 'range' && !startDate)
      return res.status(400).json({ success: false, message: 'Start date is required for date range type.' });

    const med = await Medicine.create({
      userId:       uid(req),
      name:         name.trim(),
      dosage:       dosage.trim(),
      times:        [...times].sort(),
      reminderType: reminderType || 'daily',
      days:         days || [],
      startDate:    startDate || null,
      endDate:      endDate || null,
      notes:        notes?.trim() || '',
    });

    console.log('[Medicine POST] saved:', med._id, 'userId:', med.userId);
    res.status(201).json({ success: true, medicine: med });
  } catch (err) {
    console.error('[Medicine POST] error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
});

/* ── GET /api/medicines ─────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    await connectMongo();
    const userId = uid(req);
    console.log('[Medicine GET] querying userId:', userId);

    const medicines = await Medicine.find({ userId }).sort({ createdAt: -1 });
    console.log('[Medicine GET] found:', medicines.length, 'medicines');

    const today = todayStr();
    const now   = nowTimeStr();

    const enriched = medicines.map(m => {
      const doc = m.toObject();
      const upcoming   = (m.times || []).filter(t => t >= now).sort();
      doc.nextDose     = upcoming[0] || null;
      const todayLogs  = m.statusLogs.filter(l => l.date === today);
      const takenTimes = todayLogs.filter(l => l.status === 'taken').map(l => l.time);
      const missedLogs = todayLogs.filter(l => l.status === 'missed').map(l => l.time);
      const autoMissed = (m.times || []).filter(t => t < now && !takenTimes.includes(t) && !missedLogs.includes(t));
      doc.todayStatus  = {
        taken:    takenTimes,
        missed:   [...missedLogs, ...autoMissed],
        upcoming: (m.times || []).filter(t => t >= now),
      };
      doc.isCompleted = m.reminderType === 'range' && m.endDate && today > m.endDate;
      return doc;
    });

    res.json({ success: true, medicines: enriched });
  } catch (err) {
    console.error('[Medicine GET] error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
});

/* ── PUT /api/medicines/:id ─────────────────────────── */
router.put('/:id', async (req, res) => {
  try {
    await connectMongo();
    const med = await Medicine.findOne({ _id: req.params.id, userId: uid(req) });
    if (!med) return res.status(404).json({ success: false, message: 'Not found or not yours.' });

    const fields = ['name', 'dosage', 'times', 'reminderType', 'days', 'startDate', 'endDate', 'notes', 'isActive'];
    fields.forEach(k => { if (req.body[k] !== undefined) med[k] = req.body[k]; });
    if (req.body.times) med.times = [...req.body.times].sort();
    await med.save();
    res.json({ success: true, medicine: med });
  } catch (err) {
    console.error('[Medicine PUT]', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
});

/* ── DELETE /api/medicines/:id ──────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    await connectMongo();
    const result = await Medicine.deleteOne({ _id: req.params.id, userId: uid(req) });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error('[Medicine DELETE]', err.message);
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
});

/* ── POST /api/medicines/:id/taken ──────────────────── */
router.post('/:id/taken', async (req, res) => {
  try {
    await connectMongo();
    const med = await Medicine.findOne({ _id: req.params.id, userId: uid(req) });
    if (!med) return res.status(404).json({ success: false, message: 'Not found.' });
    const time = req.body.time || nowTimeStr();
    const date = todayStr();
    med.statusLogs = med.statusLogs.filter(l => !(l.date === date && l.time === time));
    med.statusLogs.push({ date, time, status: 'taken' });
    await med.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
});

/* ── POST /api/medicines/:id/missed ─────────────────── */
router.post('/:id/missed', async (req, res) => {
  try {
    await connectMongo();
    const med = await Medicine.findOne({ _id: req.params.id, userId: uid(req) });
    if (!med) return res.status(404).json({ success: false, message: 'Not found.' });
    const time = req.body.time || nowTimeStr();
    const date = todayStr();
    med.statusLogs = med.statusLogs.filter(l => !(l.date === date && l.time === time));
    med.statusLogs.push({ date, time, status: 'missed' });
    await med.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
});

export default router;
