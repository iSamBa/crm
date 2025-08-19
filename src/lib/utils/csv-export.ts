/**
 * CSV Export Utilities
 * Handles conversion of data to CSV format and triggers downloads
 */

export interface CSVColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn[]
): string {
  if (data.length === 0) {
    return '';
  }

  // Create header row
  const headers = columns.map(col => `"${col.header}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = getNestedValue(item, col.key);
      const formattedValue = col.formatter ? col.formatter(value) : value;
      
      // Handle null/undefined values
      if (formattedValue === null || formattedValue === undefined) {
        return '""';
      }
      
      // Escape quotes and wrap in quotes
      const stringValue = String(formattedValue);
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Get nested object value using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format date for CSV export - now uses centralized date formatting
 */
export { formatDateForCSV } from './date-formatting';

/**
 * Format array for CSV export
 */
export function formatArrayForCSV(arr: any[] | null): string {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join('; ');
}

/**
 * Format object for CSV export
 */
export function formatObjectForCSV(obj: any | null): string {
  if (!obj || typeof obj !== 'object') return '';
  
  if (obj.name && obj.phone && obj.relationship) {
    // Emergency contact format
    return `${obj.name} (${obj.relationship}) - ${obj.phone}`;
  }
  
  // Generic object format
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}