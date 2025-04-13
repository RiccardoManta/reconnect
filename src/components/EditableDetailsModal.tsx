import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Check } from 'lucide-react';

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
  excludeFields?: string[];
}

const EditableDetailsModal: React.FC<EditableDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  fields,
  onSave,
  excludeFields = []
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when the modal opens or data changes
  useEffect(() => {
    const initialData: Record<string, any> = {};
    // Only include fields that are defined in the fields prop
    fields.forEach(field => {
      if (data[field.name] !== undefined) {
        initialData[field.name] = data[field.name];
      }
    });
    setFormData(initialData);
  }, [data, fields]);

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
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      setIsEditMode(false);
    } catch (err) {
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
                  backgroundColor: '#2563eb',
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
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
          }}>
            {error}
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
        
        {isEditMode && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            marginTop: '1.5rem',
          }}>
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
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
              type="button"
              onClick={handleSubmit}
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
        )}
      </div>
    </div>
  );
};

export default EditableDetailsModal; 