process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake_test';
process.env.JWT_SECRET = 'test_jwt_secret_32_chars_minimum_ok';
process.env.ADMIN_PASSWORD = 'test_admin_pass';
process.env.NODE_ENV = 'test';

const { authSchemas, memberSchemas, planSchemas, paymentSchemas } = require('../src/middleware/validation');

describe('Auth Validation', () => {
  describe('login schema', () => {
    it('accepts valid credentials', () => {
      const { error } = authSchemas.login.validate({ email: 'test@test.com', password: 'pass123' });
      expect(error).toBeUndefined();
    });
    it('rejects missing email', () => {
      const { error } = authSchemas.login.validate({ password: 'pass123' });
      expect(error).toBeDefined();
    });
    it('rejects invalid email format', () => {
      const { error } = authSchemas.login.validate({ email: 'notanemail', password: 'pass123' });
      expect(error).toBeDefined();
    });
    it('rejects missing password', () => {
      const { error } = authSchemas.login.validate({ email: 'test@test.com' });
      expect(error).toBeDefined();
    });
  });

  describe('register schema', () => {
    const valid = { email: 'a@b.com', password: 'pass123', full_name: 'Test User', phone: '9876543210', role: 'sales' };
    it('accepts valid registration', () => {
      const { error } = authSchemas.register.validate(valid);
      expect(error).toBeUndefined();
    });
    it('rejects short password', () => {
      const { error } = authSchemas.register.validate({ ...valid, password: '123' });
      expect(error).toBeDefined();
    });
    it('rejects invalid role', () => {
      const { error } = authSchemas.register.validate({ ...valid, role: 'superadmin' });
      expect(error).toBeDefined();
    });
  });
});

describe('Member Validation', () => {
  const valid = {
    name: 'John Doe', phone: '9876543210', branch_id: '00000000-0000-0000-0000-000000000001',
    plan_id: '00000000-0000-0000-0000-000000000002', joining_date: '2026-01-01',
    plan_start_date: '2026-01-01', plan_end_date: '2026-12-31',
    amount: 5000, payment_mode: 'cash'
  };
  it('accepts valid member', () => {
    const { error } = memberSchemas.create.validate(valid);
    expect(error).toBeUndefined();
  });
  it('rejects missing name', () => {
    const { error } = memberSchemas.create.validate({ ...valid, name: undefined });
    expect(error).toBeDefined();
  });
  it('rejects invalid phone (letters)', () => {
    const { error } = memberSchemas.create.validate({ ...valid, phone: 'abcdefghij' });
    expect(error).toBeDefined();
  });
  it('rejects invalid payment_mode', () => {
    const { error } = memberSchemas.create.validate({ ...valid, payment_mode: 'bitcoin' });
    expect(error).toBeDefined();
  });
});

describe('Plan Validation', () => {
  const valid = { name: 'Monthly', duration_months: 1, price: 999 };
  it('accepts valid plan', () => {
    const { error } = planSchemas.create.validate(valid);
    expect(error).toBeUndefined();
  });
  it('rejects zero duration', () => {
    const { error } = planSchemas.create.validate({ ...valid, duration_months: 0 });
    expect(error).toBeDefined();
  });
  it('rejects negative price', () => {
    const { error } = planSchemas.create.validate({ ...valid, price: -100 });
    expect(error).toBeDefined();
  });
});

describe('Payment Validation', () => {
  const valid = {
    member_id: '00000000-0000-0000-0000-000000000001',
    amount: 1000,
    payment_mode: 'upi',
    branch_id: '00000000-0000-0000-0000-000000000002',
  };
  it('accepts valid payment', () => {
    const { error } = paymentSchemas.create.validate(valid);
    expect(error).toBeUndefined();
  });
  it('rejects zero amount', () => {
    const { error } = paymentSchemas.create.validate({ ...valid, amount: 0 });
    expect(error).toBeDefined();
  });
  it('rejects invalid payment mode', () => {
    const { error } = paymentSchemas.create.validate({ ...valid, payment_mode: 'cheque' });
    expect(error).toBeDefined();
  });
});
