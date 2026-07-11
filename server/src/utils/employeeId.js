const Employee = require('../models/Employee');

async function generateEmployeeId() {
  const latestEmployee = await Employee.findOne({
    employeeId: /^EMP\d+$/,
  })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();

  const latestNumber = latestEmployee
    ? Number.parseInt(latestEmployee.employeeId.replace('EMP', ''), 10)
    : 0;

  return `EMP${String(latestNumber + 1).padStart(4, '0')}`;
}

module.exports = {
  generateEmployeeId,
};
