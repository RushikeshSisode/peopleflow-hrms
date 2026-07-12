const User = require('../models/User');
const Employee = require('../models/Employee');
const EmploymentType = require('../models/EmploymentType');
const Holiday = require('../models/Holiday');
const LeavePolicy = require('../models/LeavePolicy');
const ROLES = require('../constants/roles');
const env = require('../config/env');
const { hashValue } = require('../utils/password');
const { initializeLeaveBalanceForEmployee } = require('./leave.service');

const defaultEmploymentTypes = [
  {
    name: 'Full Time',
    code: 'full_time',
    description: 'Permanent employees with full leave benefits.',
    isActive: true,
    leaveRules: [
      { leaveType: 'Casual Leave', annualDays: 12, isUnlimited: false },
      { leaveType: 'Sick Leave', annualDays: 12, isUnlimited: false },
      { leaveType: 'Paid Leave', annualDays: 18, isUnlimited: false },
      { leaveType: 'Unpaid Leave', annualDays: 0, isUnlimited: false },
    ],
  },
  {
    name: 'Intern',
    code: 'intern',
    description: 'Internship employees with reduced leave allowance.',
    isActive: true,
    leaveRules: [
      { leaveType: 'Casual Leave', annualDays: 4, isUnlimited: false },
      { leaveType: 'Sick Leave', annualDays: 6, isUnlimited: false },
      { leaveType: 'Paid Leave', annualDays: 0, isUnlimited: false },
      { leaveType: 'Unpaid Leave', annualDays: 0, isUnlimited: false },
    ],
  },
  {
    name: 'Contractual',
    code: 'contractual',
    description: 'Contract workers with limited paid leave.',
    isActive: true,
    leaveRules: [
      { leaveType: 'Casual Leave', annualDays: 2, isUnlimited: false },
      { leaveType: 'Sick Leave', annualDays: 4, isUnlimited: false },
      { leaveType: 'Paid Leave', annualDays: 6, isUnlimited: false },
      { leaveType: 'Unpaid Leave', annualDays: 0, isUnlimited: false },
    ],
  },
];

const defaultHolidays = [
  {
    name: 'Republic Day',
    date: new Date('2026-01-26'),
    description: 'National holiday celebrating the Constitution of India.',
  },
  {
    name: 'Independence Day',
    date: new Date('2026-08-15'),
    description: 'National holiday commemorating Indian independence.',
  },
  {
    name: 'Diwali',
    date: new Date('2026-11-08'),
    description: 'Festival of lights holiday.',
  },
  {
    name: 'Christmas',
    date: new Date('2026-12-25'),
    description: 'Christmas Day holiday.',
  },
];

async function ensureEmploymentTypes() {
  for (const item of defaultEmploymentTypes) {
    const type = await EmploymentType.findOneAndUpdate(
      { code: item.code },
      {
        $setOnInsert: {
          name: item.name,
          code: item.code,
          description: item.description,
          isActive: item.isActive,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    await LeavePolicy.findOneAndUpdate(
      { employmentTypeId: type.id },
      {
        $setOnInsert: {
          employmentTypeId: type.id,
          rules: item.leaveRules,
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }
}

async function ensureHolidays() {
  for (const holiday of defaultHolidays) {
    const normalizedDate = new Date(holiday.date);
    normalizedDate.setHours(0, 0, 0, 0);

    await Holiday.findOneAndUpdate(
      { date: normalizedDate },
      {
        $setOnInsert: {
          name: holiday.name,
          date: normalizedDate,
          description: holiday.description,
        },
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }
}

async function ensureAdminUser() {
  const existingAdmin = await User.findOne({ email: env.adminEmail.toLowerCase() });

  if (existingAdmin) {
    return;
  }

  await User.create({
    fullName: 'System Admin',
    email: env.adminEmail.toLowerCase(),
    passwordHash: await hashValue(env.adminPassword),
    role: ROLES.ADMIN,
    isActive: true,
  });
}

async function ensureEmployeeUser() {
  const existingEmployee = await User.findOne({ email: env.employeeEmail.toLowerCase() });

  if (existingEmployee) {
    let employee = await Employee.findOne(
      { userId: existingEmployee.id },
    );

    if (!employee) {
      employee = await Employee.create({
        userId: existingEmployee.id,
        employeeId: 'EMP0001',
        phoneNumber: '9876543210',
        designation: 'Software Engineer',
        department: 'Engineering',
        dateOfJoining: new Date('2026-01-15'),
        monthlySalary: 45000,
        employmentType: 'full_time',
        status: 'active',
      });
    }

    await initializeLeaveBalanceForEmployee(
      employee.id,
      employee.employmentType,
      new Date(employee.dateOfJoining).getFullYear(),
    );

    return;
  }

  const user = await User.create({
    fullName: 'Demo Employee',
    email: env.employeeEmail.toLowerCase(),
    passwordHash: await hashValue(env.employeePassword),
    role: ROLES.EMPLOYEE,
    isActive: true,
  });

  const employee = await Employee.create({
    userId: user.id,
    employeeId: 'EMP0001',
    phoneNumber: '9876543210',
    designation: 'Software Engineer',
    department: 'Engineering',
    dateOfJoining: new Date('2026-01-15'),
    monthlySalary: 45000,
    employmentType: 'full_time',
    status: 'active',
  });

  await initializeLeaveBalanceForEmployee(
    employee.id,
    employee.employmentType,
    new Date(employee.dateOfJoining).getFullYear(),
  );
}

async function seedDefaultUsers() {
  await ensureEmploymentTypes();
  await ensureHolidays();
  await ensureAdminUser();

  if (env.seedDemoData) {
    await ensureEmployeeUser();
  }
}

module.exports = {
  seedDefaultUsers,
};
