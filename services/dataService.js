const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const { isMongooseConnected, readCollection, writeCollection } = require('./storageService');

// Helper to generate IDs for fallback mode
const generateId = () => new mongoose.Types.ObjectId().toString();

// ================= USER OPERATIONS =================
const findUserByEmail = async (email, includePassword = false) => {
  if (isMongooseConnected()) {
    const q = User.findOne({ email: email.toLowerCase() });
    if (includePassword) q.select('+password');
    return await q;
  }
  const users = readCollection('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  const clone = { ...user };
  if (!includePassword) delete clone.password;
  clone.matchPassword = async function (entered) {
    return await bcrypt.compare(entered, user.password);
  };
  return clone;
};

const findUserById = async (id, includePassword = false) => {
  if (isMongooseConnected()) {
    const q = User.findById(id);
    if (includePassword) q.select('+password');
    return await q;
  }
  const users = readCollection('users');
  const user = users.find((u) => (u._id && u._id.toString() === id.toString()) || u.id === id);
  if (!user) return null;
  const clone = { ...user };
  if (!includePassword) delete clone.password;
  clone.matchPassword = async function (entered) {
    return await bcrypt.compare(entered, user.password);
  };
  return clone;
};

const createUser = async (userData) => {
  if (isMongooseConnected()) {
    return await User.create(userData);
  }
  const users = readCollection('users');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  const newUser = {
    _id: generateId(),
    name: userData.name,
    email: userData.email.toLowerCase(),
    password: hashedPassword,
    phone: userData.phone || '',
    role: userData.role || 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.push(newUser);
  writeCollection('users', users);
  const result = { ...newUser };
  delete result.password;
  return result;
};

const updateUser = async (id, updateData) => {
  if (isMongooseConnected()) {
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    return await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  }
  const users = readCollection('users');
  const index = users.findIndex((u) => (u._id && u._id.toString() === id.toString()) || u.id === id);
  if (index === -1) return null;

  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(updateData.password, salt);
  }

  users[index] = {
    ...users[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  writeCollection('users', users);
  const result = { ...users[index] };
  delete result.password;
  return result;
};

// ================= CATEGORY OPERATIONS =================
const getCategories = async (filter = {}) => {
  if (isMongooseConnected()) {
    return await Category.find(filter).sort({ name: 1 });
  }
  let categories = readCollection('categories');
  if (filter.isActive !== undefined) {
    categories = categories.filter((c) => c.isActive === filter.isActive);
  }
  return categories.sort((a, b) => a.name.localeCompare(b.name));
};

const findCategoryById = async (id) => {
  if (isMongooseConnected()) {
    return await Category.findById(id);
  }
  const categories = readCollection('categories');
  return categories.find((c) => (c._id && c._id.toString() === id.toString()) || c.id === id) || null;
};

const findCategoryByName = async (name) => {
  if (isMongooseConnected()) {
    return await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  }
  const categories = readCollection('categories');
  return categories.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null;
};

const createCategory = async (data) => {
  if (isMongooseConnected()) {
    return await Category.create(data);
  }
  const categories = readCollection('categories');
  const newCat = {
    _id: generateId(),
    name: data.name,
    description: data.description || '',
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  categories.push(newCat);
  writeCollection('categories', categories);
  return newCat;
};

const updateCategory = async (id, data) => {
  if (isMongooseConnected()) {
    return await Category.findByIdAndUpdate(id, data, { new: true });
  }
  const categories = readCollection('categories');
  const index = categories.findIndex((c) => (c._id && c._id.toString() === id.toString()) || c.id === id);
  if (index === -1) return null;
  categories[index] = {
    ...categories[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  writeCollection('categories', categories);
  return categories[index];
};

const deleteCategory = async (id) => {
  if (isMongooseConnected()) {
    return await Category.findByIdAndDelete(id);
  }
  const categories = readCollection('categories');
  const filtered = categories.filter((c) => (c._id && c._id.toString() !== id.toString()) && c.id !== id);
  writeCollection('categories', filtered);
  return true;
};

// ================= COMPLAINT OPERATIONS =================
const generateComplaintId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${dateStr}-${randomSuffix}`;
};

const createComplaint = async (complaintData) => {
  const compId = complaintData.complaintId || generateComplaintId();
  const initialHistory = {
    status: 'Pending',
    remarks: 'Complaint submitted by user',
    changedByName: complaintData.userName || 'User',
    changedAt: new Date()
  };

  if (isMongooseConnected()) {
    return await Complaint.create({
      ...complaintData,
      complaintId: compId,
      statusHistory: [initialHistory]
    });
  }

  const complaints = readCollection('complaints');
  const newComplaint = {
    _id: generateId(),
    complaintId: compId,
    user: complaintData.user,
    userName: complaintData.userName || 'User',
    userEmail: complaintData.userEmail || '',
    title: complaintData.title,
    description: complaintData.description,
    category: complaintData.category,
    priority: complaintData.priority || 'Medium',
    imageUrl: complaintData.imageUrl || null,
    status: 'Pending',
    assignedTo: 'Unassigned',
    adminRemarks: '',
    resolutionDate: null,
    statusHistory: [
      {
        _id: generateId(),
        status: 'Pending',
        remarks: 'Complaint submitted by user',
        changedByName: complaintData.userName || 'User',
        changedAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  complaints.unshift(newComplaint);
  writeCollection('complaints', complaints);
  return newComplaint;
};

const getComplaints = async ({ filter = {}, search = '', page = 1, limit = 10, sort = { createdAt: -1 } }) => {
  const skip = (page - 1) * limit;

  if (isMongooseConnected()) {
    const mongoQuery = { ...filter };
    if (search) {
      mongoQuery.$or = [
        { complaintId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const [items, total] = await Promise.all([
      Complaint.find(mongoQuery)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(mongoQuery)
    ]);
    return { complaints: items, total, page, totalPages: Math.ceil(total / limit) };
  }

  let complaints = readCollection('complaints');
  const users = readCollection('users');

  // Match filter
  if (filter.user) {
    complaints = complaints.filter(
      (c) => (c.user && c.user.toString() === filter.user.toString()) || c.user === filter.user
    );
  }
  if (filter.status) {
    complaints = complaints.filter((c) => c.status === filter.status);
  }
  if (filter.category) {
    complaints = complaints.filter((c) => c.category === filter.category);
  }
  if (filter.priority) {
    complaints = complaints.filter((c) => c.priority === filter.priority);
  }

  // Search filter
  if (search) {
    const term = search.toLowerCase();
    complaints = complaints.filter(
      (c) =>
        (c.complaintId && c.complaintId.toLowerCase().includes(term)) ||
        (c.title && c.title.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term))
    );
  }

  // Sort
  complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = complaints.length;
  const paginated = complaints.slice(skip, skip + limit).map((c) => {
    const userDoc = users.find(
      (u) => (u._id && u._id.toString() === (c.user && c.user.toString())) || u.id === c.user
    );
    return {
      ...c,
      user: userDoc
        ? { _id: userDoc._id, name: userDoc.name, email: userDoc.email, phone: userDoc.phone }
        : { name: c.userName || 'User', email: c.userEmail || '' }
    };
  });

  return {
    complaints: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

const findComplaintById = async (id) => {
  if (isMongooseConnected()) {
    if (mongoose.Types.ObjectId.isValid(id)) {
      const byId = await Complaint.findById(id).populate('user', 'name email phone');
      if (byId) return byId;
    }
    return await Complaint.findOne({ complaintId: id.toUpperCase() }).populate('user', 'name email phone');
  }

  const complaints = readCollection('complaints');
  const users = readCollection('users');
  const match = complaints.find(
    (c) =>
      (c._id && c._id.toString() === id.toString()) ||
      c.id === id ||
      (c.complaintId && c.complaintId.toUpperCase() === id.toUpperCase())
  );
  if (!match) return null;

  const userDoc = users.find(
    (u) => (u._id && u._id.toString() === (match.user && match.user.toString())) || u.id === match.user
  );
  return {
    ...match,
    user: userDoc
      ? { _id: userDoc._id, name: userDoc.name, email: userDoc.email, phone: userDoc.phone }
      : { name: match.userName || 'User', email: match.userEmail || '' }
  };
};

const updateComplaintStatus = async (id, { status, remarks, adminName, adminId, assignedTo }) => {
  const historyEntry = {
    status,
    remarks: remarks || '',
    changedByName: adminName || 'Administrator',
    changedBy: adminId || null,
    changedAt: new Date()
  };

  const updateFields = {
    status,
    adminRemarks: remarks || '',
    $push: { statusHistory: historyEntry }
  };

  if (assignedTo !== undefined) {
    updateFields.assignedTo = assignedTo;
  }
  if (status === 'Resolved') {
    updateFields.resolutionDate = new Date();
  }

  if (isMongooseConnected()) {
    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjId ? { _id: id } : { complaintId: id.toUpperCase() };
    return await Complaint.findOneAndUpdate(query, updateFields, { new: true }).populate('user', 'name email phone');
  }

  const complaints = readCollection('complaints');
  const index = complaints.findIndex(
    (c) =>
      (c._id && c._id.toString() === id.toString()) ||
      c.id === id ||
      (c.complaintId && c.complaintId.toUpperCase() === id.toUpperCase())
  );
  if (index === -1) return null;

  const current = complaints[index];
  const historyItem = {
    _id: generateId(),
    status,
    remarks: remarks || '',
    changedByName: adminName || 'Administrator',
    changedAt: new Date().toISOString()
  };

  current.status = status;
  current.adminRemarks = remarks || current.adminRemarks;
  if (assignedTo !== undefined) current.assignedTo = assignedTo;
  if (status === 'Resolved') current.resolutionDate = new Date().toISOString();
  current.updatedAt = new Date().toISOString();
  if (!current.statusHistory) current.statusHistory = [];
  current.statusHistory.push(historyItem);

  complaints[index] = current;
  writeCollection('complaints', complaints);
  return current;
};

const deleteComplaint = async (id) => {
  if (isMongooseConnected()) {
    const isObjId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjId ? { _id: id } : { complaintId: id.toUpperCase() };
    return await Complaint.findOneAndDelete(query);
  }
  const complaints = readCollection('complaints');
  const filtered = complaints.filter(
    (c) =>
      (c._id && c._id.toString() !== id.toString()) &&
      c.id !== id &&
      c.complaintId.toUpperCase() !== id.toUpperCase()
  );
  writeCollection('complaints', filtered);
  return true;
};

const getComplaintStats = async () => {
  if (isMongooseConnected()) {
    const [total, pending, inProgress, resolved, rejected, byCategory] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Rejected' }),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    return {
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      byCategory: byCategory.map((c) => ({ category: c._id, count: c.count }))
    };
  }

  const complaints = readCollection('complaints');
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const rejected = complaints.filter((c) => c.status === 'Rejected').length;

  const categoryMap = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const byCategory = Object.keys(categoryMap).map((cat) => ({
    category: cat,
    count: categoryMap[cat]
  }));

  return { total, pending, inProgress, resolved, rejected, byCategory };
};

// ================= NOTIFICATION OPERATIONS =================
const createNotification = async (data) => {
  if (isMongooseConnected()) {
    return await Notification.create(data);
  }
  const notifications = readCollection('notifications');
  const item = {
    _id: generateId(),
    user: data.user,
    complaint: data.complaint || null,
    complaintId: data.complaintId || '',
    title: data.title || 'Complaint Update',
    message: data.message,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(item);
  writeCollection('notifications', notifications);
  return item;
};

const getUserNotifications = async (userId) => {
  if (isMongooseConnected()) {
    return await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(30);
  }
  const notifications = readCollection('notifications');
  return notifications
    .filter((n) => (n.user && n.user.toString() === userId.toString()) || n.user === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);
};

const markNotificationAsRead = async (id, userId) => {
  if (isMongooseConnected()) {
    return await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );
  }
  const notifications = readCollection('notifications');
  const index = notifications.findIndex(
    (n) =>
      ((n._id && n._id.toString() === id.toString()) || n.id === id) &&
      ((n.user && n.user.toString() === userId.toString()) || n.user === userId)
  );
  if (index === -1) return null;
  notifications[index].isRead = true;
  writeCollection('notifications', notifications);
  return notifications[index];
};

const markAllNotificationsAsRead = async (userId) => {
  if (isMongooseConnected()) {
    return await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }
  const notifications = readCollection('notifications');
  notifications.forEach((n) => {
    if ((n.user && n.user.toString() === userId.toString()) || n.user === userId) {
      n.isRead = true;
    }
  });
  writeCollection('notifications', notifications);
  return true;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  getCategories,
  findCategoryById,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  generateComplaintId,
  createComplaint,
  getComplaints,
  findComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  getComplaintStats,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
