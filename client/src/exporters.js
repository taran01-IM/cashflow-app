import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Strip the rupee symbol + thin/regular minus signs so spreadsheets keep numeric
// values numeric. Used when building the row arrays for export.
export function exportRows({ filename, title, headers, rows, format = 'csv', subtitle }) {
  const safe = filename.replace(/[^a-z0-9_\-]/gi, '_');
  if (format === 'csv') return exportCsv(`${safe}.csv`, headers, rows);
  if (format === 'xlsx') return exportXlsx(`${safe}.xlsx`, title, headers, rows, subtitle);
  if (format === 'pdf') return exportPdf(`${safe}.pdf`, title, headers, rows, subtitle);
  throw new Error(`Unknown export format: ${format}`);
}

function exportCsv(filename, headers, rows) {
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  triggerDownload(filename, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
}

function exportXlsx(filename, title, headers, rows, subtitle) {
  const aoa = [];
  if (title) aoa.push([title]);
  if (subtitle) aoa.push([subtitle]);
  if (title || subtitle) aoa.push([]);
  aoa.push(headers);
  for (const r of rows) aoa.push(r);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Auto-size columns based on content
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      String(h).length,
      ...rows.map(r => String(r[i] ?? '').length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(title || 'Report'));
  XLSX.writeFile(wb, filename);
}

function sanitizeSheetName(name) {
  // Excel sheet names: max 31 chars; can't contain : \ / ? * [ ]
  return String(name).replace(/[:\\/?*[\]]/g, ' ').slice(0, 31);
}

function exportPdf(filename, title, headers, rows, subtitle) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margin = 36;

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, margin, margin + 4);
  }
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110);
    doc.text(subtitle, margin, margin + 22);
    doc.setTextColor(0);
  }

  autoTable(doc, {
    head: [headers],
    body: rows.map(r => r.map(v => v == null ? '' : String(v))),
    startY: margin + 32,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [240, 240, 235], textColor: 30, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 247] },
    didDrawPage: (data) => {
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(str, doc.internal.pageSize.getWidth() - margin, doc.internal.pageSize.getHeight() - 18, { align: 'right' });
      doc.setTextColor(0);
    },
  });

  doc.save(filename);
}

function triggerDownload(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
