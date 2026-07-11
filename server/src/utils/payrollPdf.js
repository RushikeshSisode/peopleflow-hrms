function escapePdfText(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatColor([red, green, blue]) {
  return `${red} ${green} ${blue}`;
}

function drawFilledRect({ x, y, width, height, fillColor }) {
  return [
    'q',
    `${formatColor(fillColor)} rg`,
    `${x} ${y} ${width} ${height} re f`,
    'Q',
  ].join('\n');
}

function drawRoundedRect({
  x,
  y,
  width,
  height,
  radius = 8,
  fillColor = null,
  strokeColor = null,
  lineWidth = 1,
}) {
  const control = radius * 0.55228475;
  const path = [
    `${x + radius} ${y} m`,
    `${x + width - radius} ${y} l`,
    `${x + width - radius + control} ${y} ${x + width} ${y + radius - control} ${x + width} ${y + radius} c`,
    `${x + width} ${y + height - radius} l`,
    `${x + width} ${y + height - radius + control} ${x + width - radius + control} ${y + height} ${x + width - radius} ${y + height} c`,
    `${x + radius} ${y + height} l`,
    `${x + radius - control} ${y + height} ${x} ${y + height - radius + control} ${x} ${y + height - radius} c`,
    `${x} ${y + radius} l`,
    `${x} ${y + radius - control} ${x + radius - control} ${y} ${x + radius} ${y} c`,
    'h',
  ];
  const commands = ['q'];

  if (fillColor) {
    commands.push(`${formatColor(fillColor)} rg`);
  }
  if (strokeColor) {
    commands.push(`${formatColor(strokeColor)} RG`, `${lineWidth} w`);
  }

  commands.push(...path, fillColor && strokeColor ? 'B' : fillColor ? 'f' : 'S', 'Q');
  return commands.join('\n');
}

function drawLine({ x1, y1, x2, y2, strokeColor, lineWidth = 1 }) {
  return [
    'q',
    `${formatColor(strokeColor)} RG`,
    `${lineWidth} w`,
    `${x1} ${y1} m`,
    `${x2} ${y2} l`,
    'S',
    'Q',
  ].join('\n');
}

function drawText({
  x,
  y,
  text,
  font = 'F1',
  fontSize = 12,
  color = [0, 0, 0],
}) {
  return [
    'BT',
    `/${font} ${fontSize} Tf`,
    `${formatColor(color)} rg`,
    `${x} ${y} Td`,
    `(${escapePdfText(text)}) Tj`,
    'ET',
  ].join('\n');
}

function drawCenteredText({ centerX, y, text, font = 'F1', fontSize = 12, color }) {
  const widthFactor = font === 'F2' ? 0.56 : 0.52;
  const estimatedWidth = String(text).length * fontSize * widthFactor;

  return drawText({
    x: centerX - estimatedWidth / 2,
    y,
    text,
    font,
    fontSize,
    color,
  });
}

function formatMoney(value) {
  return Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildContentStream(payload) {
  const ink = [0.1, 0.14, 0.22];
  const muted = [0.4, 0.45, 0.54];
  const border = [0.86, 0.89, 0.93];
  const canvas = [0.975, 0.978, 0.984];
  const white = [1, 1, 1];
  const blocks = [];

  // Neutral page canvas and corporate header.
  blocks.push(
    drawFilledRect({ x: 0, y: 0, width: 842, height: 595, fillColor: canvas }),
    drawRoundedRect({
      x: 28,
      y: 468,
      width: 786,
      height: 98,
      radius: 10,
      fillColor: white,
      strokeColor: border,
    }),
  );

  blocks.push(
    drawText({
      x: 53,
      y: 522,
      text: payload.companyName,
      font: 'F2',
      fontSize: 23,
      color: ink,
    }),
    drawText({
      x: 651,
      y: 533,
      text: 'PAYROLL MONTH',
      font: 'F2',
      fontSize: 8,
      color: muted,
    }),
    drawText({
      x: 651,
      y: 507,
      text: payload.payrollMonthLabel,
      font: 'F2',
      fontSize: 15,
      color: ink,
    }),
  );

  // Employee information card.
  blocks.push(
    drawRoundedRect({
      x: 28,
      y: 264,
      width: 786,
      height: 180,
      radius: 10,
      fillColor: white,
      strokeColor: border,
    }),
  );

  blocks.push(
    drawText({
      x: 53,
      y: 412,
      text: 'EMPLOYEE DETAILS',
      font: 'F2',
      fontSize: 10,
      color: ink,
    }),
    drawLine({ x1: 53, y1: 397, x2: 790, y2: 397, strokeColor: border }),
  );

  // Labels sit above values for a cleaner, modern information hierarchy.
  blocks.push(
    drawText({ x: 53, y: 371, text: 'EMPLOYEE NAME', font: 'F2', fontSize: 7.5, color: muted }),
    drawText({ x: 53, y: 350, text: payload.employeeName, font: 'F2', fontSize: 12, color: ink }),
    drawText({ x: 300, y: 371, text: 'EMPLOYEE ID', font: 'F2', fontSize: 7.5, color: muted }),
    drawText({ x: 300, y: 350, text: payload.employeeCode, font: 'F2', fontSize: 12, color: ink }),
    drawText({ x: 548, y: 371, text: 'EMAIL', font: 'F2', fontSize: 7.5, color: muted }),
    drawText({ x: 548, y: 350, text: payload.employeeEmail, font: 'F2', fontSize: 11, color: ink }),
    drawText({ x: 53, y: 316, text: 'DESIGNATION', font: 'F2', fontSize: 7.5, color: muted }),
    drawText({ x: 53, y: 295, text: payload.designation, font: 'F2', fontSize: 11, color: ink }),
    drawText({ x: 300, y: 316, text: 'DEPARTMENT', font: 'F2', fontSize: 7.5, color: muted }),
    drawText({ x: 300, y: 295, text: payload.department, font: 'F2', fontSize: 11, color: ink }),
  );

  // Compact two-row salary table.
  const tableX = 28;
  const tableY = 105;
  const tableWidth = 786;
  const tableHeight = 112;
  const columnWidth = tableWidth / 3;
  const valueRowHeight = 66;

  blocks.push(
    drawFilledRect({
      x: tableX + 1,
      y: tableY + valueRowHeight,
      width: tableWidth - 2,
      height: tableHeight - valueRowHeight - 1,
      fillColor: [0.96, 0.96, 0.965],
    }),
    drawRoundedRect({
      x: tableX,
      y: tableY,
      width: tableWidth,
      height: tableHeight,
      radius: 7,
      strokeColor: border,
      lineWidth: 1.1,
    }),
    drawLine({
      x1: tableX,
      y1: tableY + valueRowHeight,
      x2: tableX + tableWidth,
      y2: tableY + valueRowHeight,
      strokeColor: border,
    }),
    drawLine({
      x1: tableX + columnWidth,
      y1: tableY,
      x2: tableX + columnWidth,
      y2: tableY + tableHeight,
      strokeColor: border,
    }),
    drawLine({
      x1: tableX + columnWidth * 2,
      y1: tableY,
      x2: tableX + columnWidth * 2,
      y2: tableY + tableHeight,
      strokeColor: border,
    }),
  );

  blocks.push(
    drawCenteredText({ centerX: tableX + columnWidth / 2, y: 188, text: 'GROSS SALARY', font: 'F2', fontSize: 9, color: muted }),
    drawCenteredText({ centerX: tableX + columnWidth * 1.5, y: 188, text: 'DEDUCTIONS', font: 'F2', fontSize: 9, color: muted }),
    drawCenteredText({ centerX: tableX + columnWidth * 2.5, y: 188, text: 'NET SALARY', font: 'F2', fontSize: 9, color: muted }),
    drawCenteredText({ centerX: tableX + columnWidth / 2, y: 132, text: `INR ${formatMoney(payload.grossSalary)}`, font: 'F2', fontSize: 16, color: ink }),
    drawCenteredText({ centerX: tableX + columnWidth * 1.5, y: 132, text: `INR ${formatMoney(payload.totalDeduction)}`, font: 'F2', fontSize: 16, color: ink }),
    drawCenteredText({ centerX: tableX + columnWidth * 2.5, y: 132, text: `INR ${formatMoney(payload.netSalary)}`, font: 'F2', fontSize: 16, color: ink }),
  );

  return blocks.join('\n');
}

function buildPdfDocument(contentStream) {
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj',
    `6 0 obj << /Length ${Buffer.byteLength(contentStream, 'utf8')} >> stream\n${contentStream}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function createPayslipPdf(payload) {
  return buildPdfDocument(buildContentStream(payload));
}

module.exports = {
  createPayslipPdf,
};
