'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import ServerCard from '@/components/server/ServerCard';
import AddServerCard from '@/components/server/AddServerCard';
import AddServerModal, { ServerData } from '@/components/server/AddServerModal';

// Initial sample data with 2 servers in each category
const initialServers: ServerData[] = [
  // Servers category
  {
    name: 'Web Server 1',
    category: 'Servers',
    description: 'Primary web server for production environment.',
    isOnline: true,
    user: 'John Doe',
  },
  {
    name: 'Web Server 2',
    category: 'Servers',
    description: 'Backup web server for failover.',
    isOnline: false,
    user: 'Admin User',
  },
  
  // Databases category
  {
    name: 'MySQL Database',
    category: 'Databases',
    description: 'Main relational database for user data.',
    isOnline: true,
    user: 'Cargoroy',
  },
  {
    name: 'MongoDB Instance',
    category: 'Databases',
    description: 'NoSQL database for analytics.',
    isOnline: true,
    user: 'John Doe',
  },
  
  // Applications category
  {
    name: 'CRM App',
    category: 'Applications',
    description: 'Customer relationship management system.',
    isOnline: true,
    user: 'Sales Team',
  },
  {
    name: 'ERP System',
    category: 'Applications',
    description: 'Enterprise resource planning application.',
    isOnline: false,
    user: 'Operations',
  },
  
  // Networks category
  {
    name: 'Main Router',
    category: 'Networks',
    description: 'Primary network router for office.',
    isOnline: true,
    user: 'IT Admin',
  },
  {
    name: 'VPN Gateway',
    category: 'Networks',
    description: 'Secure remote access connection.',
    isOnline: false,
    user: 'Security Team',
  },
  
  // Cloud category
  {
    name: 'AWS EC2 Instance',
    category: 'Cloud',
    description: 'Cloud server for application hosting.',
    isOnline: true,
    user: 'DevOps',
  },
  {
    name: 'Azure Storage',
    category: 'Cloud',
    description: 'Cloud storage for backups and media.',
    isOnline: true,
    user: 'Cloud Admin',
  },
];

// Categories in the same order as the navigation
const categories = ["Servers", "Databases", "Applications", "Networks", "Cloud"];

export default function Home() {
  const [servers, setServers] = useState<ServerData[]>(initialServers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Group servers by category
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter(server => server.category === category);
    return acc;
  }, {} as Record<string, ServerData[]>);

  const handleAddServer = (serverData: ServerData) => {
    setServers(prev => [...prev, serverData]);
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
            name={server.name}
            category={server.category}
            description={server.description}
            isOnline={server.isOnline}
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
        {/* Sidebar */}
        <Sidebar 
          servers={servers} 
          categories={categories} 
          onCategoryClick={handleCategoryClick} 
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
            {categories.map(category => renderCategorySection(category, serversByCategory[category]))}
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
