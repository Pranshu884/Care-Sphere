import express from 'express';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({ approvalStatus: 'approved' }).select('name specialization category city qualification hospital address experience availabilitySlots');
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/doctors/:doctorId/booked-slots', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'Missing doctorId or date' });
    }

    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['pending', 'accepted'] }
    }).select('time');

    const bookedSlots = appointments.map(app => app.time);
    res.json({ success: true, bookedSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.auth.userId })
      .populate('doctorId', 'name specialization category city hospital address')
      .sort({ date: 1, time: 1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { doctorId, date, time, symptoms } = req.body;
    
    if (!doctorId || !date || !time || !symptoms) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check for double booking
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingAppointment) {
      return res.status(400).json({ success: false, message: 'This time slot is already booked.' });
    }

    console.log("Saving booking for user:", req.auth.userId);
    
    const appointment = await Appointment.create({
      patientId: req.auth.userId,
      doctorId,
      date,
      time,
      symptoms,
      status: 'pending'
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, patientId: req.auth.userId });
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
