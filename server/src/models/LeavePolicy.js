const mongoose = require('mongoose');

const leaveRuleSchema = new mongoose.Schema(
  {
    leaveType: {
      type: String,
      required: true,
      trim: true,
    },
    annualDays: {
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

const leavePolicySchema = new mongoose.Schema(
  {
    employmentTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmploymentType',
      required: true,
      unique: true,
    },
    rules: {
      type: [leaveRuleSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
