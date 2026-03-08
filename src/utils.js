/* ═══════════════════════════════════════════════════════════════
   Pipeline3D — Shared Utilities
   ═══════════════════════════════════════════════════════════════ */

export const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

/** Generate a unique ID using crypto.randomUUID (collision-safe, no timestamp leakage) */
export const uid = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);

/**
 * Export an array of objects as a CSV file download.
 * @param {Object[]} data - Array of flat objects
 * @param {string} filename - Name for the downloaded file
 */
export function exportCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) return;

    // Get all unique keys across all objects
    const keys = [...new Set(data.flatMap(Object.keys))];

    const escape = (val) => {
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };

    const csv = [
        keys.join(','),
        ...data.map(row => keys.map(k => escape(row[k])).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
