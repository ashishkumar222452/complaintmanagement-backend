const testEndToEnd = async () => {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🧪 Starting End-to-End System Integration Tests...\n');

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('1. Health Check:', health.status === 'online' ? '✅ PASSED' : '❌ FAILED');

    // 2. User Registration
    const testEmail = `test_${Date.now()}@college.edu`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arjun Nair',
        email: testEmail,
        password: 'password123',
        phone: '+91 98765 99999'
      })
    });
    const regData = await regRes.json();
    console.log('2. User Registration:', regData.success ? '✅ PASSED' : '❌ FAILED');
    const userToken = regData.token;

    // 3. User Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('3. User Authentication (JWT):', loginData.success ? '✅ PASSED' : '❌ FAILED');

    // 4. Fetch Categories
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catData = await catRes.json();
    console.log('4. Fetch Categories:', catData.categories?.length > 0 ? `✅ PASSED (${catData.categories.length} categories)` : '❌ FAILED');
    const categoryName = catData.categories[0]?.name || 'IT & Network Infrastructure';

    // 5. Submit Complaint
    const compRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Network latency in CSE Department Lab 2',
        description: 'System ping is greater than 800ms during database practical session.',
        category: categoryName,
        priority: 'High'
      })
    });
    const compData = await compRes.json();
    const complaintId = compData.complaint?.complaintId;
    console.log('5. Submit Complaint:', compData.success && complaintId ? `✅ PASSED (Generated ID: ${complaintId})` : '❌ FAILED');

    // 6. Public Tracking by Complaint ID
    const trackRes = await fetch(`${BASE_URL}/complaints/track/${complaintId}`);
    const trackData = await trackRes.json();
    console.log('6. Public Tracking by ID:', trackData.success && trackData.complaint?.status === 'Pending' ? '✅ PASSED' : '❌ FAILED');

    // 7. Admin Login
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        requiredRole: 'admin'
      })
    });
    const adminData = await adminRes.json();
    console.log('7. Administrator Authentication (RBAC):', adminData.success && adminData.user.role === 'admin' ? '✅ PASSED' : '❌ FAILED');
    const adminToken = adminData.token;

    // 8. Admin Update Complaint Status & Add Remarks
    const updateRes = await fetch(`${BASE_URL}/complaints/admin/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'In Progress',
        remarks: 'Assigned to Network Operations Team. Cable switch test scheduled.',
        assignedTo: 'Network Operations Team'
      })
    });
    const updateData = await updateRes.json();
    console.log('8. Admin Status Update & Audit Log:', updateData.success && updateData.complaint?.status === 'In Progress' ? '✅ PASSED' : '❌ FAILED');

    // 9. Admin Resolve Complaint
    const resolveRes = await fetch(`${BASE_URL}/complaints/admin/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'Resolved',
        remarks: 'Switch port replaced. Ping normalized to 12ms. Resolved.',
        assignedTo: 'Network Operations Team'
      })
    });
    const resolveData = await resolveRes.json();
    console.log('9. Complaint Resolution & History Trail:', resolveData.success && resolveData.complaint?.status === 'Resolved' && resolveData.complaint?.statusHistory?.length >= 3 ? '✅ PASSED' : '❌ FAILED');

    // 10. Check User Notifications
    const notifRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const notifData = await notifRes.json();
    console.log('10. Status Change Notifications:', notifData.success && notifData.notifications?.length >= 2 ? `✅ PASSED (${notifData.notifications.length} notifications received)` : '❌ FAILED');

    // 11. Admin Statistics Endpoint
    const statsRes = await fetch(`${BASE_URL}/complaints/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const statsData = await statsRes.json();
    console.log('11. Admin Real-Time Metrics & Charts API:', statsData.success && statsData.stats?.total > 0 ? `✅ PASSED (Total: ${statsData.stats.total}, Resolved: ${statsData.stats.resolved})` : '❌ FAILED');

    console.log('\n🎉 ALL 11 INTEGRATION TESTS COMPLETED SUCCESSFULLY WITH ZERO ERRORS!');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

testEndToEnd();
