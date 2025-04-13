import React, { useState, useEffect } from 'react';
import { X, User, Tag, FileText, Activity } from 'lucide-react';

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (serverData: ServerData) => void;
}

export interface ServerData {
  name: string;
  platform: string;
  bench_type: string;
  description: string;
  status: 'online' | 'offline' | 'in_use';
  user: string;
}

export default function AddServerModal({ isOpen, onClose, onAdd }: AddServerModalProps) {
  const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ServerData>({
    name: '',
    platform: '',
    bench_type: '',
    description: '',
    status: 'online',
    user: '',
  });

  // Fetch categories from the API when modal opens
  useEffect(() => {
    if (isOpen) {
      async function fetchCategories() {
        try {
          const response = await fetch('/api/categories');
          if (response.ok) {
            const data = await response.json();
            if (data.categories && data.categories.length > 0) {
              setCategories(data.categories);
              // Set the first category as default
              setFormData(prev => ({ ...prev, platform: data.categories[0] }));
            } else {
              setCategories(fallbackCategories);
              setFormData(prev => ({ ...prev, platform: fallbackCategories[0] }));
            }
          } else {
            console.error('Failed to fetch categories');
            setCategories(fallbackCategories);
            setFormData(prev => ({ ...prev, platform: fallbackCategories[0] }));
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
          setCategories(fallbackCategories);
          setFormData(prev => ({ ...prev, platform: fallbackCategories[0] }));
        }
      }
      
      fetchCategories();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Send data to the API
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add server');
      }
      
      // Pass the server data to the parent component
      if (data.server) {
        onAdd({
          name: data.server.hil_name,
          platform: data.server.category || 'Uncategorized',
          bench_type: data.server.subcategory || '',
          description: data.server.description || '',
          status: data.server.status === 'offline' ? 'offline' : 
                data.server.status === 'in use' ? 'in_use' : 'online',
          user: data.server.active_user || '',
        });
      } else {
        // Fallback to using form data if server data isn't returned
        onAdd(formData);
      }
      
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        platform: categories[0] || 'Servers',
        bench_type: '',
        description: '',
        status: 'online',
        user: '',
      });
    } catch (err: any) {
      console.error('Error adding server:', err);
      setError(err.message || 'Failed to add server');
    } finally {
      setIsSubmitting(false);
    }
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
            }}>Add New Testbench</h3>
            
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
            {error && (
              <div style={{ 
                backgroundColor: '#fee2e2', 
                color: '#b91c1c', 
                padding: '10px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
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
                Testbench
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
                disabled={isSubmitting}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="platform" 
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
                Platform
              </label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
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
                disabled={isSubmitting}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label 
                htmlFor="bench_type" 
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
                Testbench Type
              </label>
              <input
                type="text"
                id="bench_type"
                name="bench_type"
                value={formData.bench_type}
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
                disabled={isSubmitting}
              />
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
                Info
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
                disabled={isSubmitting}
              />
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
                Add Testbench
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 