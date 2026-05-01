import User from '../models/User.js';

class UserService {
  async updateProfile(userId, data) {
    try {
      const allowedFields = ['phone', 'dob', 'gender', 'city', 'emergencyContact'];
      const updateData = {};

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }

      const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
      if (!user) {
        return { status: 404, body: { success: false, message: 'User not found.' } };
      }

      return { status: 200, body: { success: true, message: 'Profile updated.', user } };
    } catch (error) {
      console.error('UserService.updateProfile error:', error);
      return { status: 500, body: { success: false, message: 'Failed to update profile.' } };
    }
  }

  async updateHealthSummary(userId, data) {
    try {
      const allowedFields = ['bloodGroup', 'height', 'weight'];
      const updateData = {};

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }

      const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });
      if (!user) {
        return { status: 404, body: { success: false, message: 'User not found.' } };
      }

      return { status: 200, body: { success: true, message: 'Health summary updated.', user } };
    } catch (error) {
      console.error('UserService.updateHealthSummary error:', error);
      return { status: 500, body: { success: false, message: 'Failed to update health summary.' } };
    }
  }

  async deleteAccount(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return { status: 404, body: { success: false, message: 'User not found.' } };
      }
      return { status: 200, body: { success: true, message: 'Account deleted successfully.' } };
    } catch (error) {
      console.error('UserService.deleteAccount error:', error);
      return { status: 500, body: { success: false, message: 'Failed to delete account.' } };
    }
  }
}

export default new UserService();
