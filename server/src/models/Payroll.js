const mongoose = require('mongoose');

const payrollAdjustmentSchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    grossSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    perDaySalary: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDeduction: {
      type: Number,
      required: true,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    attendanceSummary: {
      totalWorkingDays: { type: Number, default: 0, min: 0 },
      presentDays: { type: Number, default: 0, min: 0 },
      absentDays: { type: Number, default: 0, min: 0 },
      approvedPaidLeaveDays: { type: Number, default: 0, min: 0 },
      unpaidLeaveDays: { type: Number, default: 0, min: 0 },
      lateMarks: { type: Number, default: 0, min: 0 },
      lateDeductionDays: { type: Number, default: 0, min: 0 },
      paidLeaveAdjustmentUsed: { type: Number, default: 0, min: 0 },
      salaryDeductionDays: { type: Number, default: 0, min: 0 },
    },
    deductionBreakdown: {
      unpaidLeaveDays: { type: Number, default: 0, min: 0 },
      absentDays: { type: Number, default: 0, min: 0 },
      lateDeductionDays: { type: Number, default: 0, min: 0 },
      adjustableDeductionDays: { type: Number, default: 0, min: 0 },
      paidLeaveAdjustmentUsed: { type: Number, default: 0, min: 0 },
      finalSalaryDeductionDays: { type: Number, default: 0, min: 0 },
      unpaidLeaveAmount: { type: Number, default: 0, min: 0 },
      adjustableDeductionAmount: { type: Number, default: 0, min: 0 },
    },
    paidLeaveAdjustments: {
      type: [payrollAdjustmentSchema],
      default: [],
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    slipNumber: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ year: -1, month: -1, processedAt: -1 });

module.exports = mongoose.model('Payroll', payrollSchema);
