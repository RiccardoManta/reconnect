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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-30 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        {/* Modal Content */}        
        <div 
          className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-modalFadeIn overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          {/* Modal Header */}          
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">
              {mode === 'edit' ? 'Edit Testbench' : 'Add New Testbench'}
            </h3>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X size={22} />
            </button>
          </div>

          {/* Modal Body & Form */}          
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow">
            {/* Error Display */}            
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                {error}
              </div>
            )}
            
            {/* Form Fields */}            
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
                PC Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
                disabled={isSubmitting}
                placeholder="e.g., HIL-BS-01-HostPC"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="platform" className="block text-sm font-medium text-gray-600 mb-2">
                Platform (Category)
              </label>
              <select
                id="platform"
                name="platform"
                value={formData.platform || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none bg-select-arrow disabled:bg-gray-100"
                required
                disabled={isSubmitting}
              >
                <option value="" disabled>Select a platform</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="bench_type" className="block text-sm font-medium text-gray-600 mb-2">
                Testbench Type (Subcategory)
              </label>
              <input
                type="text"
                id="bench_type"
                name="bench_type"
                value={formData.bench_type || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                disabled={isSubmitting}
                placeholder="e.g., Bremssystem, Fullsize"
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="status" className="block text-sm font-medium text-gray-600 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'online'}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none bg-select-arrow disabled:bg-gray-100"
                required
                disabled={isSubmitting}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="in_use">In Use</option>
              </select>
            </div>

             <div className="mb-5">
              <label htmlFor="user" className="block text-sm font-medium text-gray-600 mb-2">
                Current User (if In Use)
              </label>
              <input
                type="text"
                id="user"
                name="user"
                value={formData.user || ''}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                disabled={isSubmitting}
                placeholder="e.g., John Doe"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-2">
                Info / Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base resize-vertical min-h-[100px] transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
                disabled={isSubmitting}
                placeholder="Add relevant details about the testbench..."
              />
            </div>
          </form>

          {/* Modal Footer */}          
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit" // Connect this button to the form
              form="addServerForm" // Use form ID if needed, or rely on default within form
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:bg-blue-300"
              onClick={handleSubmit} // Trigger submit manually if button is outside form
            >
              {isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Adding...') : (mode === 'edit' ? 'Save Changes' : 'Add Testbench')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Add subtle background animation or style */}
      <style jsx>{`
        .bg-select-arrow {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E%0A");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1.25em;
        }
        .animate-modalFadeIn {
          animation: modalFadeIn 0.2s ease-out forwards;
        }
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
} 