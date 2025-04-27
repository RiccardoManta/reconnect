'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar'; // Current Sidebar (now uses inline styles)
import ServerCard from '@/components/server/ServerCard'; // Current ServerCard
import AddServerCard from '@/components/server/AddServerCard'; // Current AddServerCard
import AddServerModal, { ServerData } from '@/components/server/AddServerModal'; // Current AddServerModal

// Fallback categories in case API fails
const fallbackCategories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

// API data interface remains the same
interface ApiServerData {
  bench_id: number;
  hil_name: string;
  category: string;
  subcategory: string;
  description: string;
  status: string;
  active_user: string | null;
  location: string;
}

export default function Home() {
  // Call useSession to get authentication status and data
  const { data: session, status } = useSession();

  // State variables remain largely the same
  const [servers, setServers] = useState<ServerData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serverToEdit, setServerToEdit] = useState<ServerData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serverToDeleteId, setServerToDeleteId] = useState<number | null>(null);
  const [serverToDeleteName, setServerToDeleteName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetching logic remains the same as current page.tsx
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
          throw new Error('Failed to fetch server data');
        }
        const serverData = await serverResponse.json();

        if (serverData.servers && serverData.servers.length > 0) {
          const mappedServers = serverData.servers.map((server: ApiServerData): ServerData => ({
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

          const serverCategories = mappedServers
            .map((s: ServerData) => s.platform)
            .reduce((unique: string[], category: string) => {
              if (category && !unique.includes(category)) {
                unique.push(category);
              }
              return unique;
            }, []);
          if (serverCategories.length > 0) {
              setCategories(serverCategories);
          } // else keep the initially fetched/fallback categories

        } else {
          setServers([]);
          console.log('No server data found');
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

  // Group servers by category (same as before)
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter(server => server.platform === category);
    return acc;
  }, {} as Record<string, ServerData[]>);

  // Refetch function (same as before)
  const refetchServers = async () => {
    // Duplicating the fetch logic here for simplicity after add/edit/delete
    // In a real app, this would likely be a reusable hook or function
    setLoading(true);
    setError(null);
    try {
        const serverResponse = await fetch('/api/servers');
        if (!serverResponse.ok) throw new Error('Failed to refetch servers');
        const serverData = await serverResponse.json();
        if (serverData.servers) {
             const mappedServers = serverData.servers.map((server: ApiServerData): ServerData => ({
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

  const openEditModal = (server: ServerData) => {
    setServerToEdit(server);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setServerToEdit(null);
  };

  const handleEditSubmit = () => {
    refetchServers();
    closeEditModal();
  };

  const openDeleteDialog = (dbId: number, serverName: string) => {
    if (typeof dbId !== 'number') {
      console.error("Invalid dbId passed to openDeleteDialog:", dbId);
      return;
    }
    setServerToDeleteId(dbId);
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
      const response = await fetch(`/api/servers?id=${serverToDeleteId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete server from database');
      }
      // Instead of manipulating state directly, refetch for consistency
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

  // This handler now correctly receives server-card-${dbId}
  const handleServerClick = (serverElementId: string) => {
    const serverElement = document.getElementById(serverElementId);
    if (serverElement) {
      serverElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight effect from old code
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
  const renderCategorySection = (category: string, serversList: ServerData[]) => (
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
            key={server.dbId} // Use dbId as key
            id={`server-card-${server.dbId}`} // Use correct ID format
            dbId={server.dbId}
            name={server.name}
            platform={server.platform}
            bench_type={server.bench_type}
            description={server.description}
            status={server.status}
            user={server.user}
            // Pass props expected by current ServerCard component
            onOpenEditModal={() => openEditModal(server)}
            onOpenDeleteDialog={() => openDeleteDialog(server.dbId!, server.name)}
          />
        ))}

        {/* AddServerCard only in the first category */}
        {category === categories[0] && (
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
        {/* Sidebar component (already updated to use inline styles) */}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddSubmit} // Use updated handler
        mode="add"
      />

      {serverToEdit && (
          <AddServerModal
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onSubmit={handleEditSubmit} // Use updated handler
            initialData={serverToEdit}
            mode="edit"
          />
      )}

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
                    {isDeleting ? 'Deleting...' : 'Delete Server'} // Changed text slightly
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
