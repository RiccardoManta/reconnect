import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Check, RefreshCw } from 'lucide-react';

// --- Validation Helpers ---
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const YEAR_REGEX = /^\d{4}$/;
// Basic Hostname Check: Alphanumeric, hyphens, dots. No leading/trailing hyphens/dots.
const HOSTNAME_REGEX = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)(?!.*--)[A-Za-z0-9-]{1,63}(?<!-))*$/;
// Basic Email Check (Simple, allows most valid formats, not exhaustive RFC 5322)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_GENERIC_LENGTH = 100;

const validateFieldFormat = (name: string, value: any): string | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null; // Don't validate empty fields for format unless explicitly required (handled elsewhere)
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
      // Check if it's a valid IPv4 OR a valid hostname
      if (IPV4_REGEX.test(stringValue)) return null;
      if (HOSTNAME_REGEX.test(stringValue)) return null;
      // Modified error message for testing
      return 'VM ADDRESS FAILED FORMAT CHECK (TEST) - Must be valid IPv4 or hostname';
    case 'email':
      return EMAIL_REGEX.test(stringValue) ? null : 'Invalid email address format.';
    // Generic Length Check for common text fields
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
    case 'owner': // Added owner here as well
    case 'systemType':
    case 'platform':
    case 'systemSupplier':
      return stringValue.length <= MAX_GENERIC_LENGTH ? null : `Input cannot exceed ${MAX_GENERIC_LENGTH} characters.`;
    // Add more specific cases above this default
    default:
      // Check if the field name contains common patterns like Number, Key, ID but IS NOT the primary ID
      // This is a basic heuristic and might need refinement
      if ((name.toLowerCase().includes('number') || name.toLowerCase().includes('key') || name.toLowerCase().includes('id')) && 
          !name.toLowerCase().endsWith('id')) { // Avoid checking the primary ID field itself if it follows pattern like `xxxId`
          if (stringValue.length > MAX_GENERIC_LENGTH) {
             return `Input cannot exceed ${MAX_GENERIC_LENGTH} characters.`;
          }
      }
      return null; // No specific format validation for other fields
  }
};
// --- End Validation Helpers ---

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required?: boolean;
  options?: { value: string; label: string }[];
  editable?: boolean;
}

interface EditableDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any>;
  fields: Field[];
  onSave: (formData: Record<string, any>) => Promise<void>;
  onDelete?: () => Promise<void>;
  excludeFields?: string[];
  children?: React.ReactNode;
}

const EditableDetailsModal: React.FC<EditableDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  fields,
  onSave,
  onDelete,
  excludeFields = [],
  children
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form data and reset states when modal opens or data changes
  useEffect(() => {
    // Only run comparison logic if saveSuccess is not currently true
    if (!saveSuccess) {
      const dataChanged = JSON.stringify(data) !== JSON.stringify(formData);

      if (!data) {
          setFormData({});
          setIsEditMode(false); 
          setError(null);      
          setIsSaving(false);    
          setSaveSuccess(false); // Still reset here if data becomes null
          return;
      }
      
      if (dataChanged) { 
          const initialData: Record<string, any> = {};
          fields.forEach(field => {
            if (data[field.name] !== undefined) {
              initialData[field.name] = data[field.name];
            }
          });
          setFormData(initialData);
          setIsEditMode(false); 
          setError(null);      
          setIsSaving(false);    
          setSaveSuccess(false); // Reset success state when data truly changes
      }
      // If data hasn't changed, or if saveSuccess is true, do nothing
    }

  }, [data, fields, saveSuccess]); // REMOVED formData from dependencies

  // Effect to clear error/success when switching edit mode OR closing/reopening
  useEffect(() => {
    if (!isOpen) {
      // Reset everything when modal closes
      setIsEditMode(false);
      setError(null);
      setSaveSuccess(false);
      setIsSaving(false);
      // Don't necessarily need to reset formData here, 
      // the other effect handles it when data prop changes.
    } else {
      // Clear error/success when switching edit mode while open
      setError(null);
      setSaveSuccess(false);
    }
  }, [isEditMode, isOpen]);

  if (!isOpen) return null;

  // Helper function to format field names for display
  const formatFieldName = (name: string) => {
    return name
      .replace(/_/g, ' ')  // Replace underscores with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error/success message when user starts typing again
    if (error) setError(null); 
    if (saveSuccess) setSaveSuccess(false); 
  };

  const handleSubmit = async () => {
    // Frontend Validation
    for (const field of fields) {
      const value = formData[field.name];
      // 1. Required field check
      if (field.required && (value === null || value === undefined || String(value).trim() === '')) {
        setError(`Failed to save: ${field.label || field.name} is required.`);
        return; // Stop submission
      }
      
      // 2. Format validation check (only if field has value)
      const formatError = validateFieldFormat(field.name, value);
      if (formatError) {
        setError(formatError);
        return; // Stop submission
      }
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false); // Reset success state before attempting save

    try {
      await onSave(formData);
      
      // --- Success Handling ---
      setIsSaving(false);
      setSaveSuccess(true); // Set success state
      
      // // Auto-close after a delay - REMOVED
      // setTimeout(() => {
      //   onClose(); // Call the parent's close handler
      // }, 1500); // Close after 1.5 seconds

    } catch (err) {
      // --- Error Handling ---
      setError(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
      setIsSaving(false);
      setSaveSuccess(false); // Ensure success state is false on error
    } 
    // We no longer use finally block as success/error paths handle setIsSaving(false) separately
  };

  // Function to handle cancel button click
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setError(null);
    setSaveSuccess(false);
    // Reset form data back to the original data passed in
    if (data) {
      const initialData: Record<string, any> = {};
      fields.forEach(field => {
        if (data[field.name] !== undefined) {
          initialData[field.name] = data[field.name];
        }
      });
      setFormData(initialData);
    } else {
      setFormData({});
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
        maxWidth: '800px',
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.25rem',
                  backgroundColor: '#39A2DB',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Edit size={16} />
                Edit
              </button>
            )}
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
        </div>
        
        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#fee2e2', // Red background for error
            color: '#b91c1c', // Dark red text
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            border: '1px solid #fca5a5' // Lighter red border
          }}>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Success Message Area (optional, could also integrate into button) */}
        {saveSuccess && (
           <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#dcfce7', // Green background for success
            color: '#166534', // Dark green text
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            border: '1px solid #86efac', // Lighter green border
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Check size={18} /> 
            <p style={{ margin: 0 }}>Changes saved successfully!</p>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {fields.map((field) => {
            // Skip fields that should be excluded
            if (excludeFields.includes(field.name)) return null;
            
            // Skip fields that are not editable when in edit mode
            if (isEditMode && field.editable === false) return null;
            
            return (
              <div key={field.name} style={{
                padding: '0.75rem',
                backgroundColor: isEditMode ? 'white' : '#f9fafb',
                borderRadius: '0.25rem',
                border: '1px solid #e5e7eb',
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#4b5563',
                  marginBottom: '0.25rem',
                }}>
                  {field.label || formatFieldName(field.name)}
                </div>
                {isEditMode ? (
                  field.type === 'select' ? (
                    <select
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
                  )
                ) : (
                  <div style={{
                    fontSize: '1rem',
                    color: '#111827',
                    overflowWrap: 'break-word',
                  }}>
                    {formData[field.name] !== null && formData[field.name] !== undefined
                      ? String(formData[field.name])
                      : 'N/A'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Render children here, after the main fields grid */}
        {children}
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
        }}>
          {isEditMode && onDelete && (
            <button 
              onClick={onDelete} 
              disabled={isSaving || saveSuccess}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                backgroundColor: '#dc2626',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: (isSaving || saveSuccess) ? 'not-allowed' : 'pointer',
                opacity: (isSaving || saveSuccess) ? 0.6 : 1,
              }}
            >
              Delete
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving || saveSuccess}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: (isSaving || saveSuccess) ? 'not-allowed' : 'pointer',
                    opacity: (isSaving || saveSuccess) ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveSuccess ? onClose : handleSubmit} 
                  disabled={isSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.25rem',
                    backgroundColor: isSaving ? '#9ca3af' : '#39A2DB',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    transition: 'background-color 0.2s ease-in-out',
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    "Close"
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Keyframes for spinner */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EditableDetailsModal; 