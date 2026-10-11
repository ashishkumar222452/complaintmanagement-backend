const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    },
    complaintId: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: 'Complaint Update'
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
