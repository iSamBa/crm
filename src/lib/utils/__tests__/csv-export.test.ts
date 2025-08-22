import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  arrayToCSV, 
  downloadCSV, 
  formatArrayForCSV, 
  formatObjectForCSV,
  formatDateForCSV,
  CSVColumn 
} from '../csv-export';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock document methods
const mockClick = vi.fn();
const mockRemove = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

const mockAnchorElement = {
  href: '',
  download: '',
  click: mockClick,
  remove: mockRemove,
  style: {},
  setAttribute: vi.fn(),
};

const mockCreateElement = vi.fn(() => mockAnchorElement);

Object.defineProperty(global.document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(global.document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(global.document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

describe('CSV Export Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('arrayToCSV', () => {
    it('should convert array of objects to CSV string', () => {
      const data = [
        { name: 'John Doe', age: 30, email: 'john@example.com' },
        { name: 'Jane Smith', age: 25, email: 'jane@example.com' },
      ];

      const columns: CSVColumn[] = [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age' },
        { key: 'email', header: 'Email' },
      ];

      const result = arrayToCSV(data, columns);

      expect(result).toBe(
        '"Name","Age","Email"\n"John Doe","30","john@example.com"\n"Jane Smith","25","jane@example.com"'
      );
    });

    it('should handle empty array', () => {
      const result = arrayToCSV([], []);
      expect(result).toBe('');
    });

    it('should handle nested object values', () => {
      const data = [
        { user: { name: 'John', details: { age: 30 } } },
      ];

      const columns: CSVColumn[] = [
        { key: 'user.name', header: 'Name' },
        { key: 'user.details.age', header: 'Age' },
      ];

      const result = arrayToCSV(data, columns);
      expect(result).toBe('"Name","Age"\n"John","30"');
    });

    it('should handle null and undefined values', () => {
      const data = [
        { name: 'John', age: null, email: undefined },
      ];

      const columns: CSVColumn[] = [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age' },
        { key: 'email', header: 'Email' },
      ];

      const result = arrayToCSV(data, columns);
      expect(result).toBe('"Name","Age","Email"\n"John","",""');
    });

    it('should escape quotes properly', () => {
      const data = [
        { name: 'John "Johnny" Doe', notes: 'Has "special" requirements' },
      ];

      const columns: CSVColumn[] = [
        { key: 'name', header: 'Name' },
        { key: 'notes', header: 'Notes' },
      ];

      const result = arrayToCSV(data, columns);
      expect(result).toBe(
        '"Name","Notes"\n"John ""Johnny"" Doe","Has ""special"" requirements"'
      );
    });

    it('should use custom formatters', () => {
      const data = [
        { name: 'John', isActive: true, balance: 1234.56 },
      ];

      const columns: CSVColumn[] = [
        { key: 'name', header: 'Name' },
        { 
          key: 'isActive', 
          header: 'Status',
          formatter: (value) => value ? 'Active' : 'Inactive'
        },
        { 
          key: 'balance', 
          header: 'Balance',
          formatter: (value) => `$${value.toFixed(2)}`
        },
      ];

      const result = arrayToCSV(data, columns);
      expect(result).toBe('"Name","Status","Balance"\n"John","Active","$1234.56"');
    });
  });

  describe('downloadCSV', () => {
    it('should create and trigger download of CSV file', () => {
      const csvContent = '"Name","Age"\n"John Doe","30"';
      const filename = 'test-export.csv';

      downloadCSV(csvContent, filename);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAnchorElement.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
      expect(mockAnchorElement.setAttribute).toHaveBeenCalledWith('download', filename);
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchorElement);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchorElement);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle empty CSV content', () => {
      downloadCSV('', 'empty.csv');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('formatArrayForCSV', () => {
    it('should format array as semicolon-separated string', () => {
      const array = ['item1', 'item2', 'item3'];
      const result = formatArrayForCSV(array);
      expect(result).toBe('item1; item2; item3');
    });

    it('should handle empty array', () => {
      const result = formatArrayForCSV([]);
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(formatArrayForCSV(null)).toBe('');
      expect(formatArrayForCSV(undefined)).toBe('');
    });

    it('should handle non-array input', () => {
      expect(formatArrayForCSV('not an array' as any)).toBe('');
    });
  });

  describe('formatObjectForCSV', () => {
    it('should format emergency contact object', () => {
      const contact = {
        name: 'Jane Doe',
        phone: '555-1234',
        relationship: 'Spouse'
      };

      const result = formatObjectForCSV(contact);
      expect(result).toBe('Jane Doe (Spouse) - 555-1234');
    });

    it('should format generic object', () => {
      const obj = {
        key1: 'value1',
        key2: 'value2'
      };

      const result = formatObjectForCSV(obj);
      expect(result).toBe('key1: value1; key2: value2');
    });

    it('should handle null/undefined', () => {
      expect(formatObjectForCSV(null)).toBe('');
      expect(formatObjectForCSV(undefined)).toBe('');
    });

    it('should handle non-object input', () => {
      expect(formatObjectForCSV('not an object')).toBe('');
      expect(formatObjectForCSV(123)).toBe('');
    });
  });

  describe('formatDateForCSV', () => {
    it('should format date for CSV export', () => {
      const date = new Date('2024-01-15T10:30:45Z');
      const result = formatDateForCSV(date);
      expect(result).toMatch(/2024-01-15/);
    });

    it('should handle string dates', () => {
      const result = formatDateForCSV('2024-01-15');
      expect(result).toBeTruthy();
    });

    it('should handle invalid dates', () => {
      const result = formatDateForCSV('invalid-date');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(formatDateForCSV(null)).toBe('');
      expect(formatDateForCSV(undefined)).toBe('');
    });
  });

  describe('Integration tests', () => {
    it('should handle complex member data export', () => {
      const memberData = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          emergencyContact: {
            name: 'Jane Doe',
            phone: '555-5678',
            relationship: 'Spouse'
          },
          subscriptions: ['Basic Plan', 'Premium Add-on'],
          joinDate: '2024-01-15',
          isActive: true
        }
      ];

      const columns: CSVColumn[] = [
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { key: 'email', header: 'Email' },
        { 
          key: 'emergencyContact', 
          header: 'Emergency Contact',
          formatter: formatObjectForCSV
        },
        { 
          key: 'subscriptions', 
          header: 'Subscriptions',
          formatter: formatArrayForCSV
        },
        { 
          key: 'joinDate', 
          header: 'Join Date',
          formatter: formatDateForCSV
        },
        { 
          key: 'isActive', 
          header: 'Status',
          formatter: (value) => value ? 'Active' : 'Inactive'
        }
      ];

      const result = arrayToCSV(memberData, columns);
      
      expect(result).toContain('First Name');
      expect(result).toContain('John');
      expect(result).toContain('Doe');
      expect(result).toContain('Jane Doe (Spouse) - 555-5678');
      expect(result).toContain('Basic Plan; Premium Add-on');
      expect(result).toContain('Active');
    });

    it('should handle trainer data export', () => {
      const trainerData = [
        {
          id: '1',
          firstName: 'Mike',
          lastName: 'Johnson',
          specializations: ['Weight Training', 'Cardio'],
          hourlyRate: 75,
          certifications: ['CPT', 'NASM']
        }
      ];

      const columns: CSVColumn[] = [
        { key: 'firstName', header: 'First Name' },
        { key: 'lastName', header: 'Last Name' },
        { 
          key: 'specializations', 
          header: 'Specializations',
          formatter: formatArrayForCSV
        },
        { 
          key: 'hourlyRate', 
          header: 'Hourly Rate',
          formatter: (value) => `$${value}`
        },
        { 
          key: 'certifications', 
          header: 'Certifications',
          formatter: formatArrayForCSV
        }
      ];

      const result = arrayToCSV(trainerData, columns);
      
      expect(result).toContain('Mike');
      expect(result).toContain('Weight Training; Cardio');
      expect(result).toContain('$75');
      expect(result).toContain('CPT; NASM');
    });
  });

  describe('Performance tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        value: Math.random() * 1000
      }));

      const columns: CSVColumn[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'value', header: 'Value', formatter: (v) => v.toFixed(2) }
      ];

      const startTime = performance.now();
      const result = arrayToCSV(largeData, columns);
      const endTime = performance.now();

      expect(result).toBeTruthy();
      expect(result.split('\n')).toHaveLength(1001); // 1000 data rows + 1 header
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });
  });

  describe('Error handling', () => {
    it('should handle malformed data gracefully', () => {
      const malformedData = [
        { name: 'John' }, // Missing age, email
        { age: 25 }, // Missing name, email
        null, // Null item
        undefined, // Undefined item
      ];

      const columns: CSVColumn[] = [
        { key: 'name', header: 'Name' },
        { key: 'age', header: 'Age' },
        { key: 'email', header: 'Email' },
      ];

      expect(() => arrayToCSV(malformedData.filter(Boolean), columns)).not.toThrow();
    });

    it('should handle circular references in formatters', () => {
      const circularObj: any = { name: 'Test' };
      circularObj.self = circularObj;

      const data = [{ item: circularObj }];
      const columns: CSVColumn[] = [
        { 
          key: 'item', 
          header: 'Item',
          formatter: (value) => {
            try {
              return JSON.stringify(value);
            } catch {
              return 'Circular reference';
            }
          }
        }
      ];

      expect(() => arrayToCSV(data, columns)).not.toThrow();
    });
  });
});