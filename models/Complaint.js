const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected']
    },
    remarks: {
      type: String,
      default: ''
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedByName: {
      type: String,
      default: 'System Administrator'
    },
    changedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide complaint title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide complaint description'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    imageUrl: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
      index: true
    },
    assignedTo: {
      type: String,
      default: 'Unassigned'
    },
    adminRemarks: {
      type: String,
      default: ''
    },
    resolutionDate: {
      type: Date,
      default: null
    },
    statusHistory: [statusHistorySchema]
  },
  {
    timestamps: true
  }
);

// Compound index for quick status + date filtering
complaintSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
