import express from 'express';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireDoctor } from '../middleware/rbacMiddleware.js';

const router = express.Router();

router.use(authMiddleware, requireDoctor);

router.get('/profile', async (req, res) => {
  try {
    if (!req.auth.doctorProfileId) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    let doctor = await Doctor.findById(req.auth.doctorProfileId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    if (!req.auth.doctorProfileId) return res.status(403).json({ success: false, message: 'Unauthorized profile access' });
    const { name, specialization, experience, availabilitySlots } = req.body;
    let doctor = await Doctor.findById(req.auth.doctorProfileId);
    
    if (doctor) {
      doctor.name = name || doctor.name;
      doctor.specialization = specialization || doctor.specialization;
      if (experience !== undefined) doctor.experience = experience;
      if (availabilitySlots) doctor.availabilitySlots = availabilitySlots;
      await doctor.save();
    } else {
      return res.status(404).json({ success: false, message: 'Doctor profile linking failed or not found' });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    if (!req.auth.doctorProfileId) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    const doctor = await Doctor.findById(req.auth.doctorProfileId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'name email phone age gender')
      .sort({ date: 1, time: 1 });
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('patientId', 'name email phone age gender');
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.patch('/appointments/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { notes }, { new: true })
      .populate('patientId', 'name email phone age gender');
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/patients/:id', async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('name email phone age gender');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
