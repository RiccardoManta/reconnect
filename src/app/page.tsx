'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ServerCard from '@/components/server/ServerCard';
import AddServerCard from '@/components/server/AddServerCard';
import AddServerModal, { ServerData } from '@/components/server/AddServerModal';

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

// Update the ServerData interface to match our API data structure
interface ApiServerData {
  bench_id: number;
  hil_name: string;
  category: string;      // bench_type
  subcategory: string;   // system_type
  description: string;   // pc_info_text
  status: string;
  active_user: string;
  location: string;
}

export default function Home() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [categories, setCategories] = useState<string[]>(fallbackCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- State for Edit Modal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serverToEdit, setServerToEdit] = useState<ServerData | null>(null);
  
  // --- State for Delete Confirmation Dialog ---
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serverToDeleteId, setServerToDeleteId] = useState<number | null>(null);
  const [serverToDeleteName, setServerToDeleteName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Fetch categories from the API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        
        // Use fetched categories if available, otherwise use fallback
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        } else {
          console.warn('No categories found, using fallback');
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Use fallback categories if API fails
        setCategories(fallbackCategories);
      }
    }
    
    fetchCategories();
  }, []);

  // Fetch servers from the API
  const fetchServers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) {
        throw new Error('Failed to fetch server data');
      }
      const data = await response.json();
      
      // Map API data to the format expected by ServerCard
      if (data.servers && data.servers.length > 0) {
        // First, collect all unique categories from the server data
        const categoryList = data.servers
          .map((server: ApiServerData) => server.category || 'Uncategorized')
          // Remove empty/null values and duplicates
          .reduce((unique: string[], category: string) => {
            if (category && !unique.includes(category)) {
              unique.push(category);
            }
            return unique;
          }, []);
        
        // Always ensure we have some categories to display
        if (categoryList.length > 0) {
          setCategories(categoryList);
        } else {
          // If no categories found from server data, use the defaults
          console.warn('No categories found from server data, using fallback');
          setCategories(fallbackCategories);
        }
        
        const mappedServers = data.servers.map((server: ApiServerData) => ({
          dbId: server.bench_id,
          name: server.hil_name || 'Unnamed Server',
          platform: server.category || 'Uncategorized',
          bench_type: server.subcategory || '',
          description: server.description || 'No description available',
          status: server.status === 'offline' ? 'offline' : 
                server.status === 'in use' ? 'in_use' : 'online',
          user: server.active_user || '',
        }));
        setServers(mappedServers);
      } else {
        setError('No server data found');
      }
    } catch (error) {
      console.error('Error fetching server data:', error);
      setError('Failed to load server data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchServers();
  }, []);
  
  // Group servers by category
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter(server => server.platform === category);
    return acc;
  }, {} as Record<string, ServerData[]>);

  const handleAddServer = (serverData: ServerData) => {
    fetchServers();
  };

  // --- Edit Modal Handlers ---
  const openEditModal = (server: ServerData) => {
    setServerToEdit(server);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setServerToEdit(null);
  };

  const handleEditSubmit = (serverData: ServerData, dbId?: number) => {
    // API call was handled by the modal, just refetch to update the list
    fetchServers();
    closeEditModal(); // Close modal after submit
  };

  // Function to remove a server from the frontend state using dbId
  const handleDeleteServer = (idToDelete: number) => {
    setServers(prevServers => prevServers.filter(server => server.dbId !== idToDelete));
  };

  // --- Delete Dialog Handlers ---
  const openDeleteDialog = (dbId: number, serverName: string) => {
    setServerToDeleteId(dbId);
    setServerToDeleteName(serverName);
    setShowDeleteDialog(true);
    setDeleteError(null); // Clear previous errors
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setServerToDeleteId(null);
    setServerToDeleteName('');
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (serverToDeleteId === null) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/servers?id=${serverToDeleteId}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete server from database');
      }

      // If API delete is successful, update frontend state
      handleDeleteServer(serverToDeleteId); // Call the existing frontend state update function
      closeDeleteDialog(); // Close the dialog

    } catch (err) {
      console.error("Error deleting server:", err);
      setDeleteError(err instanceof Error ? err.message : 'An unknown error occurred');
      // Keep dialog open to show error
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle category click from the sidebar
  const handleCategoryClick = (category: string) => {
    // Find the category section and scroll to it with improved smoothness
    const section = document.getElementById(`category-${category.toLowerCase()}`);
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Scroll to a specific server when clicked in sidebar
  const handleServerClick = (serverId: string) => {
    const serverElement = document.getElementById(serverId);
    if (serverElement) {
      serverElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center',
      });
      
      // Add a brief highlight effect
      serverElement.style.boxShadow = '0 0 0 2px #39A2DB';
      setTimeout(() => {
        serverElement.style.boxShadow = '';
      }, 1500);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: '#0F3460'
        }}>
          <div>Loading server data...</div>
        </div>
      </main>
    );
  }

  // Render error state
  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          color: '#EF4444'
        }}>
          <div>{error}</div>
        </div>
      </main>
    );
  }

  // Render a category section
  const renderCategorySection = (category: string, serversList: ServerData[]) => (
    <div 
      key={category} 
      id={`category-${category.toLowerCase()}`}
      style={{ 
        scrollMarginTop: '100px', // Space for the header when scrolling
        marginBottom: '3rem' 
      }}
    >
      {/* Category heading */}
      <div style={{ 
        padding: '1rem 0 1rem', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#0F3460',
          margin: 0
        }}>
          {category}
        </h2>
        
        <div style={{ 
          fontSize: '0.9rem',
          color: '#666'
        }}>
          {serversList.length} {serversList.length === 1 ? 'item' : 'items'}
        </div>
      </div>
      
      {/* Category separator */}
      <div style={{ 
        height: '2px', 
        background: 'linear-gradient(to right, #0F3460, #39A2DB, rgba(255,255,255,0))',
        marginBottom: '1.5rem'
      }}></div>
      
      {/* Server cards grid */}
      <div className="grid-container">
        {serversList.map((server, index) => (
          <ServerCard
            key={`${category}-${index}`}
            id={`server-${category.toLowerCase()}-${index}`}
            dbId={server.dbId}
            name={server.name}
            platform={server.platform}
            bench_type={server.bench_type}
            description={server.description}
            status={server.status}
            user={server.user}
            onDelete={handleDeleteServer}
            onOpenDeleteDialog={openDeleteDialog}
            onOpenEditModal={openEditModal}
          />
        ))}
        
        {/* Only show add button in the first category for simplicity */}
        {category === categories[0] && (
          <AddServerCard onClick={() => setIsModalOpen(true)} />
        )}
      </div>
    </div>
  );

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar with server click handler */}
        <Sidebar 
          servers={servers} 
          categories={categories} 
          onCategoryClick={handleCategoryClick}
          onServerClick={handleServerClick}
        />
        
        {/* Main content */}
        <div className="content" style={{ 
          flex: 1, 
          paddingTop: '1.5rem',
          height: 'calc(100vh - 73px)',
          overflowY: 'auto'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '0 1rem' 
          }}>
            {/* Render all category sections */}
            {categories.map(category => renderCategorySection(category, serversByCategory[category] || []))}
          </div>
        </div>
      </div>
      
      {/* Add Server Modal */}
      <AddServerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddServer}
      />

      {/* Edit Server Modal - Reusing AddServerModal */}
      <AddServerModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        initialData={serverToEdit}
      />

      {/* Delete Confirmation Dialog - Rendered at Page Level */}
      {showDeleteDialog && (
        <>
          {/* Backdrop */}
          <div 
            style={{ 
              position: 'fixed', 
              inset: 0, 
              backdropFilter: 'blur(5px)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 100, 
              pointerEvents: 'auto'
            }} 
            onClick={closeDeleteDialog}
          />
          {/* Centering Wrapper */}
          <div 
            className="fixed inset-0 flex items-center justify-center z-101"
            style={{ pointerEvents: 'none' }}
          >
            {/* Dialog Box */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              animation: 'modalFadeIn 0.3s ease-out',
              pointerEvents: 'auto'
            }}>
              {/* Dialog Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ 
                  fontSize: '18px',
                  fontWeight: 'bold', 
                  color: '#0F3460',
                  margin: 0
                }}>Confirm Deletion</h3>
              </div>

              {/* Dialog Content */}
              <div style={{ padding: '24px' }}> 
                <p style={{ margin: '0 0 1.5rem 0', color: '#4b5563', fontSize: '15px', lineHeight: '1.6' }}>
                  Are you sure you want to delete the server '{serverToDeleteName}'? This action cannot be undone.
                </p>
                
                {deleteError && (
                  <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.5rem', marginTop:'-0.5rem' }}>
                    Error: {deleteError}
                  </p>
                )}
                
                {/* Dialog Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    onClick={closeDeleteDialog}
                    style={{ 
                      padding: '8px 16px',
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px', 
                      backgroundColor: 'white', 
                      color: '#374151', 
                      cursor: 'pointer', 
                      fontSize: '14px',
                      opacity: isDeleting ? 0.7 : 1
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmDelete}
                    style={{ 
                      padding: '8px 16px',
                      border: 'none', 
                      borderRadius: '8px', 
                      backgroundColor: '#ef4444',
                      color: 'white', 
                      cursor: 'pointer', 
                      fontSize: '14px',
                      opacity: isDeleting ? 0.7 : 1
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Server'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
