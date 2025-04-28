import React, { useState, useEffect } from 'react';
import { X, User, Tag, FileText, Activity } from 'lucide-react';

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

// Define the props for the modal
interface AddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updatedServerData: ServerData) => void;
  initialData?: ServerData | null; // Data for editing
  mode: 'add' | 'edit'; // Added mode prop
}

// Define the shape of server data used internally and passed to onSubmit
export interface ServerData {
  dbId?: number;
  casual_name: string;
  platform: string;
  bench_type: string;
  pc_info_text: string;
  status: 'online' | 'offline' | 'in_use' | string;
  user_name: string;
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
  
  // Define the initial state based on mode or provide defaults using NEW names
  const getInitialFormData = (): Partial<ServerData> => {
      if (mode === 'edit' && initialData) {
          // Ensure initialData conforms to the updated ServerData structure
          return {
              dbId: initialData.dbId,
              casual_name: initialData.casual_name || '',
              platform: initialData.platform || categories[0] || fallbackCategories[0],
              bench_type: initialData.bench_type || '',
              pc_info_text: initialData.pc_info_text || '',
              // Handle potential string status from initialData if needed, default to online
              status: initialData.status || 'online',
              user_name: initialData.user_name || ''
          };
      }
      // Default for 'add' mode
      return {
        casual_name: '',
        platform: categories[0] || fallbackCategories[0],
        bench_type: '',
        pc_info_text: '',
        status: 'online',
        user_name: ''
      };
  };

  const [formData, setFormData] = useState<Partial<ServerData>>(getInitialFormData());

  // Effect to reset form data when modal opens or initialData/mode changes
  useEffect(() => {
      // Use the updated getInitialFormData
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
    
    const isEditing = mode === 'edit' && !!formData?.dbId; 
    const url = isEditing ? `/api/servers/${formData.dbId}` : '/api/servers';
    const method = isEditing ? 'PUT' : 'POST';

    // Simple validation using NEW field names
    if (!formData.casual_name || !formData.platform || !formData.pc_info_text) {
        setError('Casual Name, Platform, and PC Info Text fields are required.');
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Body requires casual_name, platform, pc_info_text
        // user_name is sent, backend calculates status for PUT
        body: JSON.stringify({
            casual_name: formData.casual_name,
            platform: formData.platform,
            bench_type: formData.bench_type || '', 
            pc_info_text: formData.pc_info_text,
            user_name: formData.user_name || '' 
        }),
      });
      
      const responseData = await response.json(); // Parse JSON response
      
      if (!response.ok) {
        // Use error from response body if available
        throw new Error(responseData.error || (isEditing ? 'Failed to update server' : 'Failed to add server'));
      }
      
      // On success, call onSubmit with the SERVER data from the response
      // This assumes the API returns { success: true, server: {...} }
      if (responseData.server) {
          // Cast responseData.server to ServerData before passing
          onSubmit(responseData.server as ServerData); 
      } else {
          // Fallback or error if server data is missing in response
          console.warn('API response successful but missing server data.');
          // Optionally, still call onSubmit with local data, but it might be stale/incorrect
          // onSubmit(formData as ServerData);
      }
      
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
                htmlFor="casual_name"
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
                Casual Name
              </label>
              <input
                type="text"
                id="casual_name"
                name="casual_name"
                value={formData.casual_name || ''}
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
                placeholder="e.g., HIL-BS-01-HostPC"
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
                disabled={isSubmitting || categories.length === 0}
              >
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
                <Activity size={16} color="#0F3460" /> 
                 Bench Type
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
                placeholder="e.g., Body Systems"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="pc_info_text"
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
                 PC Info Text
              </label>
              <textarea
                id="pc_info_text"
                name="pc_info_text"
                value={formData.pc_info_text || ''}
                onChange={handleChange}
                rows={3}
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
                placeholder="e.g., Contains special measurement hardware..."
              />
            </div>

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