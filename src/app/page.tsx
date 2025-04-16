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
  active_user: string | null; // Allow null for active_user
  location: string;
}

export default function Home() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // Initialize empty, set later
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
  
  // Fetch categories (and servers combined for simplicity now)
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch categories first or use fallback
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

        // Fetch servers
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
          
          // Re-derive categories from actual server data if necessary
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
          // No servers found, keep categories, set servers empty
          setServers([]);
          console.log('No server data found');
        }
      } catch (fetchError) {
        console.error('Error fetching data:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load data');
        setServers([]); // Clear servers on error
        setCategories(fallbackCategories); // Reset categories on error
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []); // Empty dependency array means run once on mount

  // Group servers by category
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter(server => server.platform === category);
    return acc;
  }, {} as Record<string, ServerData[]>);

  const handleAddServer = () => {
    // Refetch data after adding a server (API call is in the modal)
    async function refetchData() { 
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
          setError(err instanceof Error ? err.message : "Failed to reload servers after add");
      } finally {
          setLoading(false);
      }
    }
    refetchData();
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

  const handleEditSubmit = () => {
    // Refetch data after editing (API call is in the modal)
     async function refetchData() { 
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
          setError(err instanceof Error ? err.message : "Failed to reload servers after edit");
      } finally {
          setLoading(false);
      }
    }
    refetchData();
    closeEditModal(); // Close modal after triggering refetch
  };

  // Function to remove a server from the frontend state using dbId
  const handleDeleteServer = (idToDelete: number) => {
    setServers(prevServers => prevServers.filter(server => server.dbId !== idToDelete));
  };

  // --- Delete Dialog Handlers ---
  const openDeleteDialog = (dbId: number, serverName: string) => {
    if (typeof dbId !== 'number') {
        console.error("Invalid dbId passed to openDeleteDialog:", dbId);
        return;
    }
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
  const handleServerClick = (serverElementId: string) => { 
    const serverElement = document.getElementById(serverElementId);
    if (serverElement) {
      serverElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center',
      });
      
      // Add a brief highlight effect
      serverElement.style.transition = 'box-shadow 0.3s ease-in-out'; // Add transition
      serverElement.style.boxShadow = '0 0 8px 3px rgba(57, 162, 219, 0.7)'; // Adjust shadow
      setTimeout(() => {
        serverElement.style.boxShadow = '';
      }, 1500);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center text-gray-600">
          <div>Loading server data...</div>
        </div>
      </main>
    );
  }
  
  // Render error state
  if (error) {
      return (
        <main className="flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1 items-center justify-center text-red-600">
                <div>Error: {error}</div>
            </div>
        </main>
      );
  }
  
  // Helper function to render a category section
  const renderCategorySection = (category: string, serversList: ServerData[]) => (
    <div key={category} id={`category-${category.toLowerCase()}`} className="mb-12">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">{category}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {serversList.map((server) => (
          server.dbId !== undefined && (
            <div key={server.dbId} id={`server-${server.dbId}`}>
              <ServerCard 
                {...server}
                id={`server-card-${server.dbId}`}
                onOpenEditModal={() => openEditModal(server)}
                onOpenDeleteDialog={() => openDeleteDialog(server.dbId!, server.name)}
              />
            </div>
          )
        ))}
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          categories={categories} 
          servers={servers} 
          onCategoryClick={handleCategoryClick} 
          onServerClick={handleServerClick}
          onAddServerClick={() => setIsModalOpen(true)}
        />
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Render server sections */}          
          {categories.length > 0 ? (
            categories.map(category => renderCategorySection(category, serversByCategory[category] || []))
          ) : (
            !loading && <p>No servers found.</p>
          )}
        </div>
      </div>

      {/* Add Server Modal */}      
      <AddServerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddServer}
        mode="add"
      />

      {/* Edit Server Modal */}      
      {serverToEdit && (
          <AddServerModal
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            onSubmit={handleEditSubmit}
            initialData={serverToEdit} 
            mode="edit"
          />
      )}

      {/* Delete Confirmation Dialog */}      
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete server &apos;{serverToDeleteName}&apos;? This action cannot be undone.</p>
            {deleteError && <p className="mb-4 text-sm text-red-600">Error: {deleteError}</p>}
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
