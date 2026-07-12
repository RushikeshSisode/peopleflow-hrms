const FIXED_LEAVE_TYPES = [
  {
    key: 'casual_leave',
    label: 'Casual Leave',
    aliases: ['casual_leave', 'casual leave', 'casual'],
    category: 'paid',
  },
  {
    key: 'sick_leave',
    label: 'Sick Leave',
    aliases: ['sick_leave', 'sick leave', 'sick'],
    category: 'paid',
  },
  {
    key: 'paid_leave',
    label: 'Paid Leave',
    aliases: ['paid_leave', 'paid leave', 'paid'],
    category: 'paid',
  },
  {
    key: 'unpaid_leave',
    label: 'Unpaid Leave',
    aliases: ['unpaid_leave', 'unpaid leave', 'unpaid'],
    category: 'unpaid',
  },
];

function slugifyLeaveType(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getLeaveTypeDefinition(value) {
  const normalizedValue = slugifyLeaveType(value);

  return (
    FIXED_LEAVE_TYPES.find(
      (type) =>
        type.key === normalizedValue ||
        type.aliases.some((alias) => slugifyLeaveType(alias) === normalizedValue),
    ) || null
  );
}

function getCanonicalLeaveTypeLabel(value) {
  return getLeaveTypeDefinition(value)?.label || null;
}

function isUnpaidLeaveType(value) {
  return getLeaveTypeDefinition(value)?.category === 'unpaid';
}

function isPaidLeaveType(value) {
  return getLeaveTypeDefinition(value)?.category === 'paid';
}

module.exports = {
  FIXED_LEAVE_TYPES,
  getLeaveTypeDefinition,
  getCanonicalLeaveTypeLabel,
  isUnpaidLeaveType,
  isPaidLeaveType,
  slugifyLeaveType,
};
