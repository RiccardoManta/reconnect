import React, { useState, useEffect } from 'react';
import { X, User, Tag, FileText, Activity, Cog } from 'lucide-react';

// --- NEW: Platform Interface --- (Matches API response)
interface Platform {
    platform_id: number;
    platform_name: string;
}

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
  hil_name: string;
  casual_name: string;
  platform: string; // Stores the platform NAME
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
  // --- UPDATED STATE: Use availablePlatforms --- 
  // const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [platformsError, setPlatformsError] = useState<string | null>(null);
  // --- 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Define the initial state based on mode or provide defaults using NEW names
  const getInitialFormData = (): Partial<ServerData> => {
      const defaultPlatformName = availablePlatforms[0]?.platform_name || '';
      if (mode === 'edit' && initialData) {
          return {
              dbId: initialData.dbId,
              hil_name: initialData.hil_name || '',
              casual_name: initialData.casual_name || '',
              platform: initialData.platform || defaultPlatformName,
              bench_type: initialData.bench_type || '',
              pc_info_text: initialData.pc_info_text || '',
              status: initialData.status || 'online',
              user_name: initialData.user_name || ''
          };
      }
      // Default for 'add' mode
      return {
        hil_name: '',
        casual_name: '',
        platform: defaultPlatformName,
        bench_type: '',
        pc_info_text: '',
        status: 'online',
        user_name: ''
      };
  };

  const [formData, setFormData] = useState<Partial<ServerData>>(getInitialFormData());

  // --- UPDATED EFFECT: Fetch Platforms from /api/platforms --- 
  useEffect(() => {
    if (isOpen) {
      setPlatformsLoading(true);
      setPlatformsError(null);
      async function fetchPlatforms() {
        try {
          const response = await fetch('/api/platforms'); // Correct endpoint
          if (!response.ok) {
            let errorMsg = 'Failed to fetch platforms';
            try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch(e){} 
            throw new Error(errorMsg);
          }
          // const data: Platform[] = await response.json(); // Expect Platform[] directly
          const responseData = await response.json(); // Get the response object
          const data: Platform[] = responseData.platforms; // CORRECT: Extract the array

          if (Array.isArray(data) && data.length > 0) {
            setAvailablePlatforms(data);
            // Update default platform in form only if it hasn't been set by initialData
            if (mode === 'add' || (mode === 'edit' && !initialData?.platform)) {
                setFormData(prev => ({ ...prev, platform: data[0].platform_name || '' }));
            }
          } else {
            console.warn('No platforms found or API response was not an array or empty.'); // Updated log
            setAvailablePlatforms([]); // Set to empty array
            setPlatformsError('No platforms available.');
          }
        } catch (err) {
          console.error('Error fetching platforms:', err);
          setPlatformsError(err instanceof Error ? err.message : 'Could not load platforms');
          setAvailablePlatforms([]); // Set to empty on error
        } finally {
          setPlatformsLoading(false);
        }
      }
      fetchPlatforms();
    } else {
        // Optionally clear platforms when modal closes
        // setAvailablePlatforms([]); 
    }
  }, [isOpen]); // Re-run only when modal opens/closes

  // Effect to reset form when initial data or mode changes, DEPENDING on available platforms
  useEffect(() => {
      setFormData(getInitialFormData());
      setError(null); // Clear submit error
  }, [initialData, mode, availablePlatforms]); // Now depends on availablePlatforms for default

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    const isEditing = mode === 'edit' && !!formData?.dbId; 
    const url = isEditing ? `/api/servers/${formData.dbId}` : '/api/servers';
    const method = isEditing ? 'PUT' : 'POST';

    // Updated validation
    if (!formData.hil_name || !formData.casual_name || !formData.platform || !formData.pc_info_text) {
        setError('Testbench Name, Casual Name, Platform, and PC Info Text fields are required.');
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        // Updated body to include hil_name
        body: JSON.stringify({
            hil_name: formData.hil_name,
            casual_name: formData.casual_name,
            platform: formData.platform,
            bench_type: formData.bench_type || '', 
            pc_info_text: formData.pc_info_text,
            user_name: formData.user_name || '' 
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || (isEditing ? 'Failed to update server' : 'Failed to add server'));
      }
      
      if (responseData.server) {
          onSubmit(responseData.server as ServerData); 
      } else {
          console.warn('API response successful but missing server data.');
      }
      
      onClose(); 
      
      if (mode === 'add') {
          setFormData(getInitialFormData()); 
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
          <form onSubmit={handleSubmit} style={{
            padding: '24px',
            maxHeight: 'calc(80vh - 140px)', // Adjust max height if needed
            overflowY: 'auto'
          }}>
             {/* -- Form Fields using inline styles based on provided example -- */}
             {/* ADDED: HIL Name / Testbench Name Field */}
             <div style={formGroupStyle}> 
               <label htmlFor="hil_name" style={labelStyle}>
                 <Cog size={16} style={iconStyle} />
                 Testbench Name (HIL Name)
               </label>
               <input 
                 type="text" 
                 id="hil_name" 
                 name="hil_name" 
                 value={formData.hil_name || ''} 
                 onChange={handleChange}
                 style={inputStyle} 
                 required 
                 placeholder="e.g., HIL-BS-01"
               />
             </div>

             {/* Casual Name */}
             <div style={formGroupStyle}> 
               <label htmlFor="casual_name" style={labelStyle}>
                 <User size={16} style={iconStyle} />
                 Casual Name
               </label>
               <input 
                 type="text" 
                 id="casual_name" 
                 name="casual_name" 
                 value={formData.casual_name || ''} 
                 onChange={handleChange}
                 style={inputStyle} 
                 required 
               />
             </div>

             {/* Platform Dropdown - UPDATED */}
             <div style={formGroupStyle}> 
                <label htmlFor="platform" style={labelStyle}>
                  <Tag size={16} style={iconStyle} />
                  Platform
                </label>
                {platformsLoading ? (
                  <div style={{color: '#666', fontSize:'14px'}}>Loading platforms...</div>
                ) : platformsError ? (
                  <div style={{color: '#ef4444', fontSize:'14px'}}>{platformsError}</div>
                ) : (
                  <select
                    id="platform"
                    name="platform"
                    value={formData.platform || ''} // Value is the platform name string
                    onChange={handleChange}
                    style={inputStyle} // Reuse input style, adjust if needed
                    required
                  >
                    {/* Provide a default disabled option if no platform is selected initially */}
                    {availablePlatforms.length === 0 && <option value="" disabled>No platforms available</option>}
                    {availablePlatforms.map((p) => (
                      <option key={p.platform_id} value={p.platform_name}>
                        {p.platform_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
             {/* Bench Type */}
             <div style={formGroupStyle}> 
               <label htmlFor="bench_type" style={labelStyle}>
                 <Tag size={16} style={iconStyle} />
                 Bench Type
               </label>
               <input 
                 type="text" 
                 id="bench_type" 
                 name="bench_type" 
                 value={formData.bench_type || ''} 
                 onChange={handleChange}
                 style={inputStyle} 
               />
             </div>
             
             {/* PC Info Text */}
             <div style={formGroupStyle}> 
               <label htmlFor="pc_info_text" style={labelStyle}>
                 <FileText size={16} style={iconStyle} />
                 PC Info Text
               </label>
               <textarea 
                 id="pc_info_text" 
                 name="pc_info_text" 
                 value={formData.pc_info_text || ''} 
                 onChange={handleChange}
                 style={textAreaStyle} 
                 rows={3}
                 required 
               />
             </div>
             
             {/* User Name */}
             <div style={formGroupStyle}> 
               <label htmlFor="user_name" style={labelStyle}>
                 <User size={16} style={iconStyle} />
                 Active User
               </label>
               <input 
                 type="text" 
                 id="user_name" 
                 name="user_name" 
                 value={formData.user_name || ''} 
                 onChange={handleChange}
                 style={inputStyle} 
               />
             </div>

             {/* -- Display Error Message -- */} 
             {error && (
               <p style={errorStyle}>
                 {error}
               </p>
             )}

             {/* -- Form Actions (Footer) -- */}
             <div style={{ 
               padding: '20px 24px', 
               borderTop: '1px solid #f0f0f0',
               display: 'flex',
               justifyContent: 'flex-end',
               gap: '0.75rem' // Use gap for spacing
             }}>
               <button 
                 type="button" 
                 onClick={onClose}
                 style={secondaryButtonStyle}
                 disabled={isSubmitting}
               >
                 Cancel
               </button>
               <button 
                 type="submit"
                 style={primaryButtonStyle}
                 disabled={isSubmitting || platformsLoading || !!platformsError}
               >
                 {isSubmitting ? (
                     <>{mode === 'edit' ? 'Saving Changes...' : 'Adding Testbench...'}</> 
                 ) : (
                     <>{mode === 'edit' ? 'Save Changes' : 'Add Testbench'}</>
                 )}
               </button>
             </div>
          </form>
        </div>
      </div>
    </>
  );
}

// --- Replicated Inline Styles (for completeness, assuming these were defined) --- 
const formGroupStyle: React.CSSProperties = {
  marginBottom: '1.5rem' // Add space between form groups
};

const labelStyle: React.CSSProperties = {
  display: 'flex', // Use flex for icon alignment
  alignItems: 'center',
  fontSize: '14px', 
  fontWeight: 500, 
  color: '#374151', 
  marginBottom: '0.5rem' // Space below label
};

const iconStyle: React.CSSProperties = {
  marginRight: '0.5rem',
  color: '#6b7280' // Icon color
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box' // Ensure padding doesn't increase size
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle, // Inherit input styles
  resize: 'vertical' // Allow vertical resize
};

const errorStyle: React.CSSProperties = {
  color: '#ef4444', // Red color for errors
  fontSize: '0.875rem', // Smaller font size
  marginTop: '-0.5rem', // Pull up below last field
  marginBottom: '1rem' // Space before footer
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#0F3460', // Primary color
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500
  // Add disabled styles directly or via className
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  backgroundColor: 'white',
  color: '#374151',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500
  // Add disabled styles
};

