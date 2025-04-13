import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

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
    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
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