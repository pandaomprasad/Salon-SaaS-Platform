const express = require('express');
const request = require('supertest');

// Simple mock RBAC middleware logic verifying role enforcement
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Privilege escalation prevented' });
    }
    next();
  };
};

describe('High-Risk Logic: Role-Based Access Control (RBAC) Middleware', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock authentication injector
    app.use((req, res, next) => {
      const roleHeader = req.headers['x-test-role'];
      if (roleHeader) {
        req.user = { id: 'user_999', role: roleHeader };
      }
      next();
    });

    // Protected admin route
    app.get('/api/admin/salons', authorizeRoles('SUPER_ADMIN'), (req, res) => {
      res.status(200).json({ success: true, data: 'Admin Data' });
    });

    // Protected manager route
    app.get('/api/manager/reports', authorizeRoles('SUPER_ADMIN', 'SALON_OWNER', 'BRANCH_MANAGER'), (req, res) => {
      res.status(200).json({ success: true, data: 'Manager Report' });
    });
  });

  test('SUPER_ADMIN can access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/salons')
      .set('x-test-role', 'SUPER_ADMIN');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('CUSTOMER attempting to access admin route must be rejected with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/salons')
      .set('x-test-role', 'CUSTOMER');
    
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/);
  });

  test('STAFF attempting privilege escalation to admin route must receive 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/admin/salons')
      .set('x-test-role', 'STAFF');
    
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('BRANCH_MANAGER can access manager reports route', async () => {
    const res = await request(app)
      .get('/api/manager/reports')
      .set('x-test-role', 'BRANCH_MANAGER');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
