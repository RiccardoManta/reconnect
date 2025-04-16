import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Server, Circle, Plus } from 'lucide-react';
import { ServerData } from '@/components/server/AddServerModal';

interface SidebarProps {
  servers: ServerData[];
  categories: string[];
  onCategoryClick: (category: string) => void;
  onServerClick: (serverElementId: string) => void;
  onAddServerClick?: () => void;
}

export default function Sidebar({
  servers,
  categories,
  onCategoryClick,
  onServerClick,
  onAddServerClick,
}: SidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    // Initialize all categories as expanded
    categories.reduce((acc, category) => ({ ...acc, [category]: true }), {})
  );

  // Toggle category expansion
  const toggleCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onCategoryClick
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group servers by category
  const serversByCategory = categories.reduce((acc, category) => {
    acc[category] = servers.filter((server) => server.platform === category);
    return acc;
  }, {} as Record<string, ServerData[]>);

  // Get effective status based on user presence and explicitly set status
  const getEffectiveStatus = (server: ServerData) => {
    if (server.status === 'offline') return 'offline';
    return server.user && server.user.trim() !== '' ? 'in_use' : 'online';
  };

  // Update the status indicator in the sidebar
  const getStatusColor = (server: ServerData) => {
    const effectiveStatus = getEffectiveStatus(server);
    switch (effectiveStatus) {
      case 'online':
        return '#10b981'; // Green
      case 'offline':
        return '#9ca3af'; // Grey
      case 'in_use':
        return '#ef4444'; // Red
      default:
        return '#9ca3af'; // Default to Grey
    }
  };

  return (
    <div className="w-[380px] border-r border-gray-200 bg-gray-50 /*h-[calc(100vh-73px)]*/ overflow-y-auto p-4 flex flex-col flex-shrink-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Server Explorer
        </h3>
        {/* Add Server Button */}        
        {onAddServerClick && ( 
          <button
            onClick={onAddServerClick}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            title="Add New Server"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Categories and Servers List */}      
      <div className="flex-grow">
        {categories.map((category) => (
          <div key={category} className="mb-2">
            {/* Category header */}            
            <div
              onClick={() => onCategoryClick(category)}
              className="flex items-center p-2 rounded-md cursor-pointer bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-colors"
            >
              <span
                onClick={(e) => toggleCategory(category, e)}
                className="inline-flex mr-2 cursor-pointer p-1 hover:bg-gray-300 rounded"
              >
                {expandedCategories[category] ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </span>
              <span className="font-bold flex-grow truncate">{category}</span>
              <span className="ml-auto text-xs text-gray-500 font-normal px-1.5 py-0.5 bg-white rounded-full">
                {serversByCategory[category]?.length || 0}
              </span>
            </div>

            {/* Servers list */}            
            {expandedCategories[category] && (
              <div className="ml-3 mt-1 pl-3 border-l border-gray-200">
                {(serversByCategory[category]?.length || 0) > 0 ? (
                  serversByCategory[category].map((server, idx) => (
                    // Ensure dbId exists before rendering the server item
                    server.dbId !== undefined && (
                        <div
                          key={`${category}-${server.dbId}`}
                          // Pass the element ID expected by the page handler
                          onClick={() => onServerClick(`server-${server.dbId}`)}
                          className="flex items-center py-1.5 px-2 mb-0.5 rounded cursor-pointer text-sm hover:bg-gray-100 transition-colors group"
                        >
                          <Server size={14} className="mr-2 text-gray-500 group-hover:text-gray-700 flex-shrink-0" />
                          <span className="flex-grow truncate text-gray-700 group-hover:text-gray-900">{server.name}</span>
                          <div className="ml-2 flex items-center flex-shrink-0">
                            <Circle
                              size={8}
                              fill={getStatusColor(server)}
                              strokeWidth={0} // Use fill only
                              className="mr-1"
                              // color={getStatusColor(server)} // Removed color prop, fill is enough
                            />
                            {/* User display can be added here if needed */}
                          </div>
                        </div>
                    )
                  ))
                ) : (
                  <div className="px-2 py-1 text-xs text-gray-400 italic">No servers in this category</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 