const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const {
  createUser,
  findUserByEmail,
  createCategory,
  getCategories,
  createComplaint,
  getComplaints,
  createNotification
} = require('../services/dataService');
const User = require('../models/User');
const Category = require('../models/Category');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const { isMongooseConnected, readCollection, writeCollection } = require('../services/storageService');

const initialCategories = [
  { name: 'Hostel & Accommodation', description: 'Room maintenance, hygiene, water, and electricity in hostels' },
  { name: 'Academic & Examination', description: 'Classes, timetable, grade cards, and faculty coordination' },
  { name: 'IT & Network Infrastructure', description: 'Wi-Fi, computer labs, portal access, and software licenses' },
  { name: 'Library & Learning Resources', description: 'Book lending, digital library access, and reading room' },
  { name: 'Canteen & Food Services', description: 'Cafeteria hygiene, food quality, and pricing' },
  { name: 'Transport & Parking', description: 'College buses, parking permits, and vehicle safety' },
  { name: 'Sports & Gymnasium', description: 'Sports equipment, grounds maintenance, and gym facility' },
  { name: 'Maintenance & Facilities', description: 'General electrical, plumbing, civil repairs, and elevators' }
];

const seedData = async () => {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Admin & Demo Users
    let admin = await findUserByEmail('admin@example.com');
    if (!admin) {
      admin = await createUser({
        name: 'System Administrator',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '+91 98765 43210',
        role: 'admin'
      });
      console.log('✅ Admin account created: admin@example.com / admin123');
    } else {
      console.log('ℹ️ Admin account already exists');
    }

    let user1 = await findUserByEmail('user@example.com');
    if (!user1) {
      user1 = await createUser({
        name: 'Priya Sharma',
        email: 'user@example.com',
        password: 'user123',
        phone: '+91 98111 22334',
        role: 'user'
      });
      console.log('✅ Demo User 1 created: user@example.com / user123');
    }

    let user2 = await findUserByEmail('rahul@example.com');
    if (!user2) {
      user2 = await createUser({
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        password: 'user123',
        phone: '+91 98222 33445',
        role: 'user'
      });
      console.log('✅ Demo User 2 created: rahul@example.com / user123');
    }

    // 2. Seed Categories
    const existingCats = await getCategories({});
    if (existingCats.length === 0) {
      for (const cat of initialCategories) {
        await createCategory(cat);
      }
      console.log(`✅ Seeded ${initialCategories.length} categories`);
    } else {
      console.log(`ℹ️ ${existingCats.length} categories already present`);
    }

    // 3. Seed Sample Complaints if empty
    const { total } = await getComplaints({ page: 1, limit: 1 });
    if (total === 0) {
      const u1Id = user1._id || user1.id;
      const u2Id = user2._id || user2.id;
      const adminId = admin._id || admin.id;

      // Complaint 1 - In Progress
      const c1 = await createComplaint({
        complaintId: 'CMP-20261011-8401',
        user: u1Id,
        userName: user1.name,
        userEmail: user1.email,
        title: 'Wi-Fi connection down in Block B 3rd Floor',
        description: 'The Wi-Fi router on 3rd floor hallway has had no internet throughput since yesterday morning. Multiple students are unable to submit lab assignments.',
        category: 'IT & Network Infrastructure',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Network Operations Team'
      });

      // Update c1 history and status
      if (isMongooseConnected()) {
        await Complaint.findByIdAndUpdate(c1._id, {
          status: 'In Progress',
          assignedTo: 'Network Operations Team',
          adminRemarks: 'Assigned to network engineer for fiber cable testing.',
          $push: {
            statusHistory: {
              status: 'In Progress',
              remarks: 'Assigned to network engineer for fiber cable testing.',
              changedByName: 'System Administrator',
              changedAt: new Date(Date.now() - 3600000 * 4)
            }
          }
        });
      } else {
        const comps = readCollection('complaints');
        const idx = comps.findIndex((x) => x.complaintId === 'CMP-20261011-8401');
        if (idx !== -1) {
          comps[idx].status = 'In Progress';
          comps[idx].assignedTo = 'Network Operations Team';
          comps[idx].adminRemarks = 'Assigned to network engineer for fiber cable testing.';
          comps[idx].statusHistory.push({
            status: 'In Progress',
            remarks: 'Assigned to network engineer for fiber cable testing.',
            changedByName: 'System Administrator',
            changedAt: new Date(Date.now() - 3600000 * 4).toISOString()
          });
          writeCollection('complaints', comps);
        }
      }

      // Complaint 2 - Resolved
      const c2 = await createComplaint({
        complaintId: 'CMP-20261011-8402',
        user: u1Id,
        userName: user1.name,
        userEmail: user1.email,
        title: 'Water cooler leaking in Computer Lab Corridor',
        description: 'Water has been pooling in front of Lab 4 entrance, creating a slip hazard for passing students and faculty.',
        category: 'Maintenance & Facilities',
        priority: 'Urgent',
        status: 'Resolved',
        assignedTo: 'Plumbing & Civil Works'
      });

      if (isMongooseConnected()) {
        await Complaint.findByIdAndUpdate(c2._id, {
          status: 'Resolved',
          assignedTo: 'Plumbing & Civil Works',
          adminRemarks: 'Plumbing valve replaced and leakage resolved successfully.',
          resolutionDate: new Date(Date.now() - 3600000 * 2),
          $push: {
            statusHistory: [
              {
                status: 'In Progress',
                remarks: 'Plumber dispatched to inspect valve pipe.',
                changedByName: 'System Administrator',
                changedAt: new Date(Date.now() - 3600000 * 8)
              },
              {
                status: 'Resolved',
                remarks: 'Plumbing valve replaced and leakage resolved successfully.',
                changedByName: 'System Administrator',
                changedAt: new Date(Date.now() - 3600000 * 2)
              }
            ]
          }
        });
      } else {
        const comps = readCollection('complaints');
        const idx = comps.findIndex((x) => x.complaintId === 'CMP-20261011-8402');
        if (idx !== -1) {
          comps[idx].status = 'Resolved';
          comps[idx].assignedTo = 'Plumbing & Civil Works';
          comps[idx].adminRemarks = 'Plumbing valve replaced and leakage resolved successfully.';
          comps[idx].resolutionDate = new Date(Date.now() - 3600000 * 2).toISOString();
          comps[idx].statusHistory.push({
            status: 'In Progress',
            remarks: 'Plumber dispatched to inspect valve pipe.',
            changedByName: 'System Administrator',
            changedAt: new Date(Date.now() - 3600000 * 8).toISOString()
          });
          comps[idx].statusHistory.push({
            status: 'Resolved',
            remarks: 'Plumbing valve replaced and leakage resolved successfully.',
            changedByName: 'System Administrator',
            changedAt: new Date(Date.now() - 3600000 * 2).toISOString()
          });
          writeCollection('complaints', comps);
        }
      }

      // Complaint 3 - Pending
      await createComplaint({
        complaintId: 'CMP-20261011-8403',
        user: u2Id,
        userName: user2.name,
        userEmail: user2.email,
        title: 'Projector display distorted in Seminar Hall 2',
        description: 'The projector keeps flickering green and loses HDMI signal intermittently during guest lectures and project presentations.',
        category: 'Academic & Examination',
        priority: 'Medium',
        status: 'Pending'
      });

      // Complaint 4 - Pending
      await createComplaint({
        complaintId: 'CMP-20261011-8404',
        user: u2Id,
        userName: user2.name,
        userEmail: user2.email,
        title: 'Online library catalog returning 504 gateway timeout',
        description: 'Searching for reference journals in the library portal freezes and gives a gateway timeout error.',
        category: 'Library & Learning Resources',
        priority: 'Low',
        status: 'Pending'
      });

      // Complaint 5 - Resolved
      await createComplaint({
        complaintId: 'CMP-20261011-8405',
        user: u1Id,
        userName: user1.name,
        userEmail: user1.email,
        title: 'Broken window latch in Hostel Room 204',
        description: 'The latch on the right window pane broke during heavy wind and cannot be closed securely at night.',
        category: 'Hostel & Accommodation',
        priority: 'Medium',
        status: 'Resolved'
      });

      // Sample Notifications for Priya
      await createNotification({
        user: u1Id,
        complaintId: 'CMP-20261011-8402',
        title: 'Complaint Resolved',
        message: 'Your complaint #CMP-20261011-8402 (Water cooler leaking) has been marked Resolved.'
      });

      await createNotification({
        user: u1Id,
        complaintId: 'CMP-20261011-8401',
        title: 'Complaint In Progress',
        message: 'Your complaint #CMP-20261011-8401 (Wi-Fi connection down) is now In Progress.'
      });

      console.log('✅ Seeded 5 sample complaints and notifications');
    } else {
      console.log(`ℹ️ ${total} complaints already exist`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  }
};

// If run directly: node utils/seed.js
if (require.main === module) {
  require('dotenv').config();
  connectDB().then(() => {
    seedData().then(() => {
      console.log('Seed process exiting.');
      process.exit(0);
    });
  });
}

module.exports = seedData;
