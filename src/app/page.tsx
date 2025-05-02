'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar'; // Current Sidebar (now uses inline styles)
import ServerCard, { ServerCardProps } from '@/components/server/ServerCard'; // Current ServerCard, import ServerCardProps
import AddServerCard from '@/components/server/AddServerCard'; // Current AddServerCard
import AddServerModal, { ServerData as AddModalServerData } from '@/components/server/AddServerModal'; // Current AddServerModal

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

// Permission levels (adjust if needed)
type PermissionLevel = 'Admin' | 'Edit' | 'Read';

// NEW Interface for server data stored in state, matching API response and ServerCardProps
// (excluding functions)
interface DisplayServerData extends Omit<ServerCardProps, 'onOpenDeleteDialog' | 'onOpenEditModal'> {
  // Inherits pcId, casualName, platformName, benchType, pcInfoText, status, activeUser, platformId
  hilName: string | null; // ADDED hilName to match API response
}

export default function Home() {
  // Call useSession to get authentication status and data
  const { data: session, status } = useSession();

  // State variables - Use the new interface for servers
  const [servers, setServers] = useState<DisplayServerData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serverToEdit, setServerToEdit] = useState<AddModalServerData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serverToDeleteId, setServerToDeleteId] = useState<number | null>(null);
  const [serverToDeleteName, setServerToDeleteName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userPermissionLevel, setUserPermissionLevel] = useState<PermissionLevel>('Read'); // Default to Read

  // Fetching logic
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let fetchedCategories = fallbackCategories;
        try {
            const catResponse = await fetch('/api/categories');
            if (catResponse.ok) {
                const catData = await catResponse.json();
                if (catData.categories && catData.categories.length > 0) {
                    fetchedCategories = catData.categories;
                }
            }
        } catch (catError) {
            console.error("Failed to fetch categories, using fallback:", catError);
        }
        setCategories(fetchedCategories);

        const serverResponse = await fetch('/api/servers');
        if (!serverResponse.ok) {
          let errorMsg = 'Failed to fetch server data';
          try { 
            const errorData = await serverResponse.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {/* Ignore */} 
          throw new Error(errorMsg);
        }
        
        // API now returns the array directly
        const serverDataFromApi: DisplayServerData[] = await serverResponse.json(); 

        if (Array.isArray(serverDataFromApi)) {
          // No mapping needed if API returns correct camelCase structure matching DisplayServerData
          setServers(serverDataFromApi);
          console.log(`Fetched ${serverDataFromApi.length} server items.`);

          // Update category extraction based on platformName
          const serverPlatforms = serverDataFromApi.map((s) => s.platformName); 
          
          // Fix type issue in reduce
          const serverCategories = serverPlatforms.reduce<string[]>((unique, category) => {
              if (category && !unique.includes(category)) {
                unique.push(category);
              }
              return unique;
            }, []); // Initial value is string[]
          
          if (serverCategories.length > 0) {
              setCategories(serverCategories); 
          } else {
              // Keep fallback if no platforms found in data
              setCategories(fallbackCategories);
          }

        } else {
          console.warn('API response for /api/servers was not an array:', serverDataFromApi);
          setServers([]); 
          // Optionally set an error here
        }
      } catch (fetchError) {
        console.error('Error fetching data:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load data');
        setServers([]);
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // NEW Effect to fetch user permissions when authenticated
  useEffect(() => {
    async function fetchPermissions() {
      if (status === 'authenticated') {
        try {
          const response = await fetch('/api/user/permissions');
          if (!response.ok) {
            console.error("Failed to fetch user permissions, status:", response.status);
            throw new Error('Could not load user permissions');
          }
          const data = await response.json();
          setUserPermissionLevel(data.permissionName || 'Read'); // Update state, default to Read
          console.log("User Permission Level:", data.permissionName || 'Read');
        } catch (permError) {
          console.error("Error fetching permissions:", permError);
          setUserPermissionLevel('Read'); // Default to Read on error
        }
      }
    }

    fetchPermissions();
  }, [status]); // Re-run when authentication status changes

  // Group servers by category (same as before)
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter(server => server.platformName === category);
    return acc;
  }, {} as Record<string, DisplayServerData[]>);

  // Refetch function (same as before)
  const refetchServers = async () => {
    setLoading(true);
    setError(null);
    try {
        const serverResponse = await fetch('/api/servers');
        if (!serverResponse.ok) {
           let errorMsg = 'Failed to refetch servers';
            try { const errorData = await serverResponse.json(); errorMsg = errorData.message || errorMsg; } catch(e){} 
            throw new Error(errorMsg);
        }
        const serverDataFromApi: DisplayServerData[] = await serverResponse.json();
        if (Array.isArray(serverDataFromApi)) {
             setServers(serverDataFromApi);
        } else {
            console.warn('Refetch API response was not an array:', serverDataFromApi);
            setServers([]);
        }
      } catch (err) {
          console.error("Refetch error:", err);
          setError(err instanceof Error ? err.message : "Failed to reload servers");
      } finally {
          setLoading(false);
      }
  };

  // Modal Handlers (remain the same, using refetchServers)
  const handleAddSubmit = () => {
    refetchServers();
    // Modal closes itself on success
  };

  const openEditModal = (server: DisplayServerData) => {
    // Map the ServerCard data (DisplayServerData) to the structure AddServerModal expects (AddModalServerData)
    const serverDataForEditModal: AddModalServerData = {
        dbId: server.pcId, 
        hil_name: server.hilName || '', // ADDED: Map hilName
        casual_name: server.casualName || '', 
        platform: server.platformName || '', 
        bench_type: server.benchType || '',
        pc_info_text: server.pcInfoText || '',
        status: server.status || 'unknown',
        user_name: server.activeUser || '' 
    };
    setServerToEdit(serverDataForEditModal);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setServerToEdit(null);
  };

  const handleEditSubmit = (updatedServerFromModal: AddModalServerData) => {
    // Optimistically update state - map back from modal structure to DisplayServerData
    setServers(prevServers => 
      prevServers.map(server => 
        server.pcId === updatedServerFromModal.dbId 
          ? { 
              ...server, 
              pcId: updatedServerFromModal.dbId, 
              hilName: updatedServerFromModal.hil_name, // ADDED: Update hilName too
              casualName: updatedServerFromModal.casual_name,
              platformName: updatedServerFromModal.platform,
              benchType: updatedServerFromModal.bench_type,
              pcInfoText: updatedServerFromModal.pc_info_text,
              status: updatedServerFromModal.status,
              activeUser: updatedServerFromModal.user_name
            }
          : server
      )
    );
    closeEditModal();
  };

  const openDeleteDialog = (pcId: number, serverName: string) => {
    if (typeof pcId !== 'number') {
      console.error("Invalid pcId passed to openDeleteDialog:", pcId);
      return;
    }
    setServerToDeleteId(pcId); 
    setServerToDeleteName(serverName);
    setShowDeleteDialog(true);
    setDeleteError(null);
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
      // Update API call to use pcId parameter
      const response = await fetch(`/api/servers/${serverToDeleteId}`, { method: 'DELETE' }); 
      if (!response.ok) {
        let errorMsg = 'Failed to delete server from database';
        try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch(e){} 
        throw new Error(errorMsg);
      }
      refetchServers();
      closeDeleteDialog();
    } catch (err) {
      console.error("Error deleting server:", err);
      setDeleteError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Click Handlers (remain the same, using current logic)
  const handleCategoryClick = (category: string) => {
    const section = document.getElementById(`category-${category.replace(/\s+/g, '').toLowerCase()}`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  };

  // Use pcId for server element ID
  const handleServerClick = (serverElementId: string) => {
    const serverElement = document.getElementById(serverElementId);
    if (serverElement) {
      serverElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      serverElement.style.boxShadow = '0 0 0 2px #39A2DB';
      setTimeout(() => { serverElement.style.boxShadow = ''; }, 1500);
    }
  };

  // --- Old Loading State with Inline Styles ---
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

  // --- Old Error State with Inline Styles ---
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
          <div>Error: {error}</div> {/* Display the error message */}
        </div>
      </main>
    );
  }

  // --- Reintroduce renderCategorySection from old code ---
  const renderCategorySection = (category: string, serversList: DisplayServerData[]) => (
    <div
      key={category}
      // Use the cleaned category ID consistent with handleCategoryClick
      id={`category-${category.replace(/\s+/g, '').toLowerCase()}`}
      style={{
        scrollMarginTop: '100px', // Space for the header when scrolling
        marginBottom: '3rem'
      }}
    >
      {/* Category heading with inline styles */}
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

      {/* Category separator with inline styles */}
      <div style={{
        height: '2px',
        background: 'linear-gradient(to right, #0F3460, #39A2DB, rgba(255,255,255,0))',
        marginBottom: '1.5rem'
      }}></div>

      {/* Server cards grid using className="grid-container" */}
      <div className="grid-container">
        {serversList.map((server) => (
          <ServerCard
            key={server.pcId} 
            pcId={server.pcId}
            casualName={server.casualName}
            platformName={server.platformName}
            benchType={server.benchType}
            pcInfoText={server.pcInfoText}
            status={server.status}
            activeUser={server.activeUser}
            platformId={server.platformId}
            onOpenEditModal={() => openEditModal(server)}
            onOpenDeleteDialog={() => openDeleteDialog(server.pcId, server.casualName || 'Unknown')}
            userPermissionLevel={userPermissionLevel}
          />
        ))}

        {/* Conditionally render AddServerCard only in the first category AND if user has edit/admin rights */}
        {category === categories[0] && (userPermissionLevel === 'Admin' || userPermissionLevel === 'Edit') && (
          <AddServerCard onClick={() => setIsModalOpen(true)} />
        )}
      </div>
    </div>
  );

  // --- Main Render using Old Structure with Inline Styles ---
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Remove the problematic console.log call from JSX */}
        {/* {console.log('[page.tsx] Rendering Sidebar with categories:', categories)} */}
        <Sidebar
          servers={servers}
          categories={categories}
          onCategoryClick={handleCategoryClick}
          onServerClick={handleServerClick}
        />

        {/* Main content area with inline styles */}
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
            {/* Render all category sections using the helper function */}
            {categories.map(category => renderCategorySection(category, serversByCategory[category] || []))}

             {/* Fallback if no categories/servers (optional, can be adapted from old code if needed) */}
             {categories.length === 0 && !loading && (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
                   <p>No servers found.</p>
                   {/* Render AddServerCard directly or adjust styling as needed */}
                   <div style={{marginTop: '1rem'}}>
                      <AddServerCard onClick={() => setIsModalOpen(true)} />
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modals (using current AddServerModal component and props) */}
      <AddServerModal
        isOpen={isModalOpen || isEditModalOpen}
        onClose={isEditModalOpen ? closeEditModal : () => setIsModalOpen(false)}
        onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit}
        initialData={serverToEdit}
        mode={isEditModalOpen ? 'edit' : 'add'}
      />

      {/* Delete Confirmation Dialog (using old inline styles) */}
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
            className="fixed inset-0 flex items-center justify-center z-[101]" // Use z-[101] to ensure it's above z-100
            style={{ pointerEvents: 'none' }}
          >
            {/* Dialog Box */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              // animation: 'modalFadeIn 0.3s ease-out', // Assuming modalFadeIn is defined in CSS
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
                  Are you sure you want to delete the server "{serverToDeleteName}"? This action cannot be undone.
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
