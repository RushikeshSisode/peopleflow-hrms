const mongoose = require('mongoose');

const leaveBalanceRuleSchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      trim: true,
    },
    allocated: {
      type: Number,
      default: 0,
      min: 0,
    },
    used: {
      type: Number,
      default: 0,
      min: 0,
    },
    remaining: {
      type: Number,
      default: 0,
      min: 0,
    },
    isUnlimited: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    balances: {
      type: [leaveBalanceRuleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
