const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    action: {
      type: String,
      enum: ['in', 'out'],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    logDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

attendanceLogSchema.index({ employeeId: 1, logDate: 1, timestamp: 1 });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
