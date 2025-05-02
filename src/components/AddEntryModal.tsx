import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

// --- Validation Helpers (copied from EditableDetailsModal) ---
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const YEAR_REGEX = /^\d{4}$/;
const HOSTNAME_REGEX = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-))*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_GENERIC_LENGTH = 100;

const validateFieldFormat = (name: string, value: any): string | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null; // Don't validate empty fields for format
  }
  const stringValue = String(value);

  switch (name) {
    case 'macAddress':
      return MAC_REGEX.test(stringValue) ? null : 'Invalid MAC address format (e.g., 00:1A:2B:3C:4D:EE)';
    case 'ipAddress':
      return IPV4_REGEX.test(stringValue) ? null : 'Invalid IPv4 address format (e.g., 192.168.1.1)';
    case 'purchaseYear':
      if (!YEAR_REGEX.test(stringValue)) return 'Invalid Year format (YYYY)';
      const year = parseInt(stringValue, 10);
      const currentYear = new Date().getFullYear();
      return (year >= 1980 && year <= currentYear + 1) ? null : `Year must be between 1980 and ${currentYear + 1}`;
    case 'vmName':
      if (stringValue.trim().length === 0) return 'VM Name cannot be empty or just whitespace.';
      if (stringValue.length > 63) return 'VM Name cannot exceed 63 characters.';
      return null;
    case 'vmAddress':
      if (IPV4_REGEX.test(stringValue)) return null;
      if (HOSTNAME_REGEX.test(stringValue)) return null;
      return 'Invalid VM Address format (must be valid IPv4 or hostname)';
    case 'email':
      return EMAIL_REGEX.test(stringValue) ? null : 'Invalid email address format.';
      
    // Generic Length Check
    case 'hilName':
    case 'pcName':
    case 'casualName':
    case 'pcRole':
    case 'pcModel':
    case 'projectName':
    case 'userName':
    case 'companyUsername':
    case 'softwareName':
    case 'manufacturer':
    case 'standName':
    case 'licenseName':
    case 'licenseType':
    case 'wetbenchName':
    case 'owner':
    case 'systemType':
    case 'platform':
    case 'systemSupplier':
      return stringValue.length <= MAX_GENERIC_LENGTH ? null : `Input cannot exceed ${MAX_GENERIC_LENGTH} characters.`;

    // Add more specific cases above this default
    default:
      if ((name.toLowerCase().includes('number') || name.toLowerCase().includes('key') || name.toLowerCase().includes('id')) && 
          !name.toLowerCase().endsWith('id')) {
          if (stringValue.length > MAX_GENERIC_LENGTH) {
             return `Input cannot exceed ${MAX_GENERIC_LENGTH} characters.`;
          }
      }
      return null;
  }
};
// --- End Validation Helpers ---

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: Field[];
  onSave: (formData: Record<string, any>) => Promise<void>;
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  fields, 
  onSave
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous error

    // --- Start Validation ---
    for (const field of fields) {
      const value = formData[field.name];
      // 1. Required field check
      if (field.required && (value === null || value === undefined || String(value).trim() === '')) {
        setError(`Please fill out the required field: ${field.label || field.name}`);
        return; // Stop submission
      }

      // 2. Format validation check
      const formatError = validateFieldFormat(field.name, value);
      if (formatError) {
        setError(formatError); // Corrected: Show only the specific format error
        return; // Stop submission
      }
    }
    // --- End Validation ---

    setSaving(true);
    try {
      await onSave(formData);
      onClose(); // Close modal on successful save
    } catch (err) {
      // Error from the onSave function (API call)
      setError(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
          }}>{title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
          >
            <X size={24} />
          </button>
        </div>
        
        {error && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            {fields.map((field) => (
              <div key={field.name}>
                <label 
                  htmlFor={field.name}
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#4b5563',
                    marginBottom: '0.5rem',
                  }}
                >
                  {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                backgroundColor: '#2563eb',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              disabled={saving}
            >
              {saving ? 'Saving...' : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEntryModal; 