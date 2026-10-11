const {
  createComplaint,
  getComplaints,
  findComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStats,
  createNotification
} = require('../services/dataService');

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private (User)
const submitComplaint = async (req, res, next) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and category'
      });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const userId = req.user._id || req.user.id;
    const complaint = await createComplaint({
      user: userId,
      userName: req.user.name,
      userEmail: req.user.email,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      priority: priority || 'Medium',
      imageUrl
    });

    // Create an initial confirmation notification
    await createNotification({
      user: userId,
      complaint: complaint._id || complaint.id,
      complaintId: complaint.complaintId,
      title: 'Complaint Submitted',
      message: `Your complaint #${complaint.complaintId} has been successfully registered.`
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints for current logged-in user
// @route   GET /api/complaints/my
// @access  Private (User)
const getMyComplaints = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { status, category, priority, search, page = 1, limit = 10 } = req.query;

    const filter = { user: userId };
    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (priority && priority !== 'All') filter.priority = priority;

    const result = await getComplaints({
      filter,
      search: search || '',
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complaint details by ID or Complaint ID
// @route   GET /api/complaints/:id
// @access  Private (User or Admin)
const getComplaintDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await findComplaintById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Authorization: User can only view their own complaint, admin can view all
    const complaintUserId = complaint.user?._id || complaint.user?.id || complaint.user;
    const currentUserId = req.user._id || req.user.id;

    if (
      req.user.role !== 'admin' &&
      complaintUserId &&
      complaintUserId.toString() !== currentUserId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only view your own complaints'
      });
    }

    res.status(200).json({
      success: true,
      complaint
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track complaint by ID (Public)
// @route   GET /api/complaints/track/:complaintId
// @access  Public
const trackComplaintPublic = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const complaint = await findComplaintById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `No complaint found with ID '${complaintId}'`
      });
    }

    // Mask sensitive details for public tracking
    const sanitized = {
      complaintId: complaint.complaintId,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      assignedTo: complaint.assignedTo,
      adminRemarks: complaint.adminRemarks,
      createdAt: complaint.createdAt,
      resolutionDate: complaint.resolutionDate,
      statusHistory: complaint.statusHistory || []
    };

    res.status(200).json({
      success: true,
      complaint: sanitized
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all complaints (Admin)
// @route   GET /api/complaints/admin/all
// @access  Private (Admin)
const getAllComplaintsAdmin = async (req, res, next) => {
  try {
    const { status, category, priority, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (priority && priority !== 'All') filter.priority = priority;

    const result = await getComplaints({
      filter,
      search: search || '',
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update complaint status & remarks (Admin)
// @route   PUT /api/complaints/admin/:id/status
// @access  Private (Admin)
const updateComplaintStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks, assignedTo } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const existing = await findComplaintById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const updated = await updateComplaintStatus(id, {
      status,
      remarks,
      assignedTo,
      adminName: req.user.name,
      adminId: req.user._id || req.user.id
    });

    // Notify user of status update
    const targetUserId = existing.user?._id || existing.user?.id || existing.user;
    if (targetUserId) {
      await createNotification({
        user: targetUserId,
        complaint: existing._id || existing.id,
        complaintId: existing.complaintId,
        title: `Complaint Status Updated: ${status}`,
        message: `Your complaint #${existing.complaintId} has been updated to "${status}". ${
          remarks ? `Remarks: "${remarks}"` : ''
        }`
      });
    }

    res.status(200).json({
      success: true,
      message: `Complaint #${existing.complaintId} status updated to ${status}`,
      complaint: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete complaint (Admin)
// @route   DELETE /api/complaints/admin/:id
// @access  Private (Admin)
const deleteComplaintAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await findComplaintById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await deleteComplaint(id);

    res.status(200).json({
      success: true,
      message: `Complaint #${existing.complaintId} has been successfully deleted`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics & statistics (Admin)
// @route   GET /api/complaints/admin/stats
// @access  Private (Admin)
const getStatsAdmin = async (req, res, next) => {
  try {
    const stats = await getComplaintStats();
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitComplaint,
  getMyComplaints,
  getComplaintDetails,
  trackComplaintPublic,
  getAllComplaintsAdmin,
  updateComplaintStatusAdmin,
  deleteComplaintAdmin,
  getStatsAdmin
};
