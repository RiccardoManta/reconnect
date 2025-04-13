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
    // Refresh the server list to include the newly added server
    fetchServers();
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
            name={server.name}
            platform={server.platform}
            bench_type={server.bench_type}
            description={server.description}
            status={server.status}
            user={server.user}
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
      
      <AddServerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddServer}
      />
    </main>
  );
}
