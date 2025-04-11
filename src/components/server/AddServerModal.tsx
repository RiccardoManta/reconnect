import React, { useState } from 'react';
import { X, User, Tag, FileText } from 'lucide-react';

const categories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (serverData: ServerData) => void;
}

export interface ServerData {
  name: string;
  category: string;
  description: string;
  user?: string;
  isOnline: boolean;
}

export default function AddServerModal({ isOpen, onClose, onAdd }: AddServerModalProps) {
  const [formData, setFormData] = useState<ServerData>({
    name: '',
    category: categories[0], // Default to first category
    description: '',
    isOnline: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    onClose();
    // Reset form
    setFormData({
      name: '',
      category: categories[0],
      description: '',
      isOnline: true,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 z-40" style={{ 
        backdropFilter: 'blur(5px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        pointerEvents: 'auto'
      }} onClick={onClose}></div>
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ pointerEvents: 'none' }}>
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            animation: 'modalFadeIn 0.3s ease-out',
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#0F3460',
              margin: 0
            }}>Add New Server</h3>
            
            <button 
              onClick={onClose} 
              style={{
                background: 'none',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} color="#666" />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="name" 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#4b5563', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FileText size={16} color="#0F3460" />
                Server Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#39A2DB'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="category" 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#4b5563', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Tag size={16} color="#0F3460" />
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  outline: 'none',
                  backgroundColor: 'white',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '20px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#39A2DB'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="description" 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#4b5563', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FileText size={16} color="#0F3460" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  resize: 'vertical',
                  minHeight: '100px',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#39A2DB'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="user" 
                style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#4b5563', 
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <User size={16} color="#0F3460" />
                User (Optional)
              </label>
              <input
                type="text"
                id="user"
                name="user"
                value={formData.user || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#39A2DB'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="isOnline"
                  name="isOnline"
                  checked={formData.isOnline}
                  onChange={handleChange}
                  style={{
                    appearance: 'none',
                    width: '20px',
                    height: '20px',
                    border: '2px solid #d1d5db',
                    borderRadius: '4px',
                    outline: 'none',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  className="custom-checkbox"
                />
                <style>{`
                  .custom-checkbox:checked {
                    background-color: #39A2DB;
                    border-color: #39A2DB;
                  }
                  .custom-checkbox:checked::before {
                    content: '';
                    position: absolute;
                    top: 4px;
                    left: 7px;
                    width: 5px;
                    height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                  }
                `}</style>
                <label 
                  htmlFor="isOnline" 
                  style={{ 
                    marginLeft: '10px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#4b5563',
                    cursor: 'pointer'
                  }}
                >
                  Online
                </label>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              borderTop: '1px solid #f0f0f0',
              paddingTop: '20px'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: '#0F3460',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0a2647'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0F3460'}
              >
                Add Server
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 