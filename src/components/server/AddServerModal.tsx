import React, { useState, useEffect } from 'react';
import { X, User, Tag, FileText, Activity } from 'lucide-react';

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

// Define the props for the modal
interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serverData: ServerData, dbId?: number) => void;
  initialData?: ServerData | null; // Data for editing
  mode: 'add' | 'edit'; // Added mode prop
}

// Define the shape of server data used internally and passed to onSubmit
export interface ServerData {
  dbId?: number;
  name: string;
  platform: string; // Corresponds to 'category' from API / schema
  bench_type: string; // Corresponds to 'subcategory' from API / schema
  description: string;
  status: 'online' | 'offline' | 'in_use';
  user: string;
}

export default function AddServerModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  mode // Destructure mode
}: AddServerModalProps) {
  const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Define the initial state based on mode or provide defaults
  const getInitialFormData = (): Partial<ServerData> => {
      if (mode === 'edit' && initialData) {
          return initialData;
      }
      return {
        name: '',
        platform: categories[0] || fallbackCategories[0],
        bench_type: '',
        description: '',
        status: 'online',
        user: ''
      };
  };

  const [formData, setFormData] = useState<Partial<ServerData>>(getInitialFormData());

  // Effect to reset form data when modal opens or initialData/mode changes
  useEffect(() => {
      setFormData(getInitialFormData());
      setError(null); // Clear error when modal reopens or data changes
  }, [isOpen, initialData, mode, categories]); // Depend on categories as well for default

  // Fetch categories when the modal is open
  useEffect(() => {
    if (isOpen) {
      async function fetchCategories() {
        let fetchedCategories = fallbackCategories; // Start with fallback
        try {
          const response = await fetch('/api/categories');
          if (response.ok) {
            const data = await response.json();
            if (data.categories && data.categories.length > 0) {
              fetchedCategories = data.categories;
            } else {
              console.warn('No categories fetched, using fallback.');
            }
          } else {
            console.error('Failed to fetch categories, using fallback.');
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
        } finally {
            setCategories(fetchedCategories);
            // Update default platform if form is in add mode and hasn't been touched
            if (mode === 'add' && !initialData) { 
                setFormData(prev => ({ ...prev, platform: fetchedCategories[0] || ''}));
            }
        }
      }
      
      fetchCategories();
    }
  }, [isOpen, mode, initialData]); // Refetch categories if modal opens

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      // Handle checkboxes if you add any
      // const checkbox = e.target as HTMLInputElement;
      // setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    // Use mode to determine action, but rely on dbId for URL/method
    const isEditing = mode === 'edit' && !!formData?.dbId; 
    const url = isEditing ? `/api/servers?id=${formData.dbId}` : '/api/servers';
    const method = isEditing ? 'PUT' : 'POST';

    // Simple validation
    if (!formData.name || !formData.platform || !formData.description) {
        setError('Name, Platform, and Info fields are required.');
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Ensure all required fields are present before submitting
        body: JSON.stringify({
            name: formData.name,
            platform: formData.platform,
            bench_type: formData.bench_type || '', // Provide default if optional
            description: formData.description,
            status: formData.status || 'online', // Provide default
            user: formData.user || '' // Provide default
        }),
      });
      
      const data = await response.json(); // Attempt to parse JSON regardless of status
      
      if (!response.ok) {
        throw new Error(data.error || (isEditing ? 'Failed to update server' : 'Failed to add server'));
      }
      
      // Pass the submitted data (ensure it matches ServerData shape)
      onSubmit(formData as ServerData, formData?.dbId);
      
      onClose(); // Close modal on success
      
      // Optionally reset form only in add mode
      if (mode === 'add') {
          setFormData(getInitialFormData()); // Reset form fields
      }

    } catch (err: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} server:`, err);
      setError(err.message || `An unexpected error occurred`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with inline styles */}
      <div className="fixed inset-0 z-40" style={{
        backdropFilter: 'blur(5px)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        pointerEvents: 'auto'
      }} onClick={onClose}></div>

      {/* Modal Centering Wrapper (keep Tailwind classes for centering) */}
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ pointerEvents: 'none' }}>
         {/* Modal Content Box with inline styles */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px', // Use old max width
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            // animation: 'modalFadeIn 0.3s ease-out', // Assuming defined globally
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
        >
           {/* Modal Header with inline styles */}
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
            }}>
               {/* Use mode prop for title */}
              {mode === 'edit' ? 'Edit Testbench' : 'Add New Testbench'}
            </h3>

            {/* Close Button with inline styles */}
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
              onMouseOver={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = '#f5f5f5'}}
              onMouseOut={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = 'transparent'}}
            >
              <X size={20} color="#666" />
            </button>
          </div>

           {/* Form Body with inline styles */}
          <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' /* Add scroll for long forms */ }}>
            {/* Error Display with inline styles */}
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

            {/* Form Fields with inline styles */}
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
                PC Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
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
                onFocus={(e) => {(e.target as HTMLInputElement).style.borderColor = '#39A2DB'}}
                onBlur={(e) => {(e.target as HTMLInputElement).style.borderColor = '#e5e7eb'}}
                required
                disabled={isSubmitting}
                placeholder="e.g., HIL-BS-01-HostPC" // Keep placeholder from current
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
                 Platform (Category) {/* Use clearer label from current */}
              </label>
              <select
                id="platform"
                name="platform"
                value={formData.platform || ''}
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
                onFocus={(e) => {(e.target as HTMLSelectElement).style.borderColor = '#39A2DB'}}
                onBlur={(e) => {(e.target as HTMLSelectElement).style.borderColor = '#e5e7eb'}}
                required
                disabled={isSubmitting || categories.length === 0} // Disable if no categories
              >
                 {/* Add disabled option from current */}
                <option value="" disabled={!formData.platform}>Select a platform</option>
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
                 {/* Use correct icon from current */}
                <Activity size={16} color="#0F3460" /> 
                 Testbench Type (Subcategory) {/* Use clearer label */}
              </label>
              <input
                type="text"
                id="bench_type"
                name="bench_type"
                value={formData.bench_type || ''}
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
                onFocus={(e) => {(e.target as HTMLInputElement).style.borderColor = '#39A2DB'}}
                onBlur={(e) => {(e.target as HTMLInputElement).style.borderColor = '#e5e7eb'}}
                disabled={isSubmitting}
                placeholder="e.g., Body Systems" // Add placeholder
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
                 Info {/* Use simpler label */}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3} // Keep rows from current
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
                onFocus={(e) => {(e.target as HTMLTextAreaElement).style.borderColor = '#39A2DB'}}
                onBlur={(e) => {(e.target as HTMLTextAreaElement).style.borderColor = '#e5e7eb'}}
                required
                disabled={isSubmitting}
                placeholder="Enter details about the testbench..." // Add placeholder
              />
            </div>
            
             {/* Status and User fields (if needed, add similar blocks here) */}
             {/* Example for Status (adapt as needed) */}
             {mode === 'edit' && ( // Only show status/user in edit mode potentially?
                <div style={{ marginBottom: '20px' }}>
                <label htmlFor="status" style={{ /* ... label styles ... */ }}>Status</label>
                <select 
                    id="status" 
                    name="status" 
                    value={formData.status || 'online'} 
                    onChange={handleChange} 
                    style={{ /* ... select styles ... */ }} 
                    disabled={isSubmitting}
                >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="in_use">In Use</option>
                </select>
                </div>
             )}
             
             {/* Example for User (adapt as needed) */}
             {mode === 'edit' && (
                <div style={{ marginBottom: '20px' }}>
                <label htmlFor="user" style={{ /* ... label styles ... */ }}>User</label>
                <input 
                    type="text" 
                    id="user" 
                    name="user" 
                    value={formData.user || ''} 
                    onChange={handleChange} 
                    style={{ /* ... input styles ... */ }}
                    disabled={isSubmitting} 
                    placeholder="Current user"
                />
                </div>
             )}

            {/* Form Actions / Footer with inline styles */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid #f0f0f0',
              paddingTop: '20px',
              marginTop: '10px' // Add some margin before footer
            }}>
              {/* Cancel Button */}
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
                onMouseOver={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = '#e5e7eb'}}
                onMouseOut={(e) => {const target = e.currentTarget as HTMLButtonElement; target.style.backgroundColor = '#f3f4f6'}}
                 disabled={isSubmitting} // Disable when submitting
              >
                Cancel
              </button>
              {/* Submit Button */}
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
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.7 : 1 // Dim when submitting
                }}
                onMouseOver={(e) => { if (!isSubmitting) (e.target as HTMLButtonElement).style.backgroundColor = '#0a2647' }}
                onMouseOut={(e) => { if (!isSubmitting) (e.target as HTMLButtonElement).style.backgroundColor = '#0F3460' }}
                 disabled={isSubmitting} // Disable when submitting
              >
                 {/* Use mode prop for button text */}
                 {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Adding...') : (mode === 'edit' ? 'Save Changes' : 'Add Testbench')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 