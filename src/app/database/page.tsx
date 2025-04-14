'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Database as DatabaseIcon, Table, Server, Lock, RefreshCw, User, Folder, HardDrive, Cpu, Settings, Activity, Wrench as Tool, Zap, Monitor, Layers, Gauge, Microchip, PcCase, Beaker, Plus } from 'lucide-react';
import DetailsModal from '@/components/DetailsModal';
import AddEntryModal from '@/components/AddEntryModal';
import EditableDetailsModal from '@/components/EditableDetailsModal';

interface TestBench {
  bench_id: number;
  hil_name: string;
  pp_number: string;
  system_type: string;
  bench_type: string;
  acquisition_date: string;
  location: string;
  user_name: string;
  project_name: string;
}

// New interfaces for each table type
interface Project {
  project_id: number;
  project_number: string;
  project_name: string;
}

interface User {
  user_id: number;
  user_name: string;
  contact_info: string;
}

interface License {
  license_id: number;
  tool_name: string;
  license_number: string;
  maintenance_end: string;
  owner: string;
}

interface VmInstance {
  vm_id: number;
  vm_name: string;
  vm_address: string;
  installed_tools: string;
}

interface ModelStand {
  model_id: number;
  model_name: string;
  svn_link: string;
  features: string;
}

interface Wetbench {
  wetbench_id: number;
  wetbench_name: string;
  pp_number: string;
  owner: string;
  system_type: string;
  platform: string;
  system_supplier: string;
  linked_bench_id: number;
  actuator_info: string;
  hardware_components: string;
  inventory_number: string;
}

interface HilTechnology {
  tech_id: number;
  bench_id: number;
  hil_name: string;
  fiu_info: string;
  io_info: string;
  can_interface: string;
  power_interface: string;
  possible_tests: string;
  leakage_module: string;
}

interface HilOperation {
  operation_id: number;
  bench_id: number;
  hil_name: string;
  possible_tests: string;
  vehicle_datasets: string;
  scenarios: string;
  controldesk_projects: string;
}

interface HardwareInstallation {
  install_id: number;
  bench_id: number;
  hil_name: string;
  ecu_info: string;
  sensors: string;
  additional_periphery: string;
}

interface PcOverview {
  pc_id: number;
  bench_id: number;
  hil_name: string;
  pc_name: string;
  purchase_year: number;
  inventory_number: string;
  pc_role: string;
  pc_model: string;
  special_equipment: string;
  mac_address: string;
  ip_address: string;
  active_licenses: string;
  installed_tools: string;
  pc_info_text: string;
  status: string;
  active_user: string;
}

interface ProjectOverview {
  overview_id: number;
  bench_id: number;
  hil_name: string;
  platform: string;
  system_supplier: string;
  wetbench_info: string;
  actuator_info: string;
  hardware: string;
  software: string;
  model_version: string;
  ticket_notes: string;
}

function TestBenchList() {
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestBench, setSelectedTestBench] = useState<TestBench | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Function to fetch users and projects for the dropdown selects
  const fetchRelatedData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      // Fetch projects
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/testbenches');
      if (!response.ok) {
        throw new Error('Failed to fetch test benches');
      }
      const data = await response.json();
      setTestBenches(data.testBenches || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading test benches: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching test benches:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch users and projects for dropdowns
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/testbenches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add test bench');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/testbenches');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTestBenches(data.testBenches || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateTestBench = async (formData: Record<string, any>) => {
    try {
      // Make sure the bench_id is included
      if (!formData.bench_id) {
        throw new Error('Test bench ID is required');
      }

      // Send the update request
      const response = await fetch('/api/testbenches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update test bench');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setTestBenches(prev => 
        prev.map(bench => 
          bench.bench_id === formData.bench_id ? data.testBench : bench
        )
      );
      
      // Also update the selected test bench
      setSelectedTestBench(data.testBench);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'hil_name',
      label: 'HIL Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'pp_number',
      label: 'PP Number',
      type: 'text' as const,
    },
    {
      name: 'system_type',
      label: 'System Type',
      type: 'text' as const,
    },
    {
      name: 'bench_type',
      label: 'Bench Type',
      type: 'text' as const,
    },
    {
      name: 'acquisition_date',
      label: 'Acquisition Date',
      type: 'date' as const,
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text' as const,
    },
    {
      name: 'user_id',
      label: 'User',
      type: 'select' as const,
      options: users.map(user => ({
        value: String(user.user_id),
        label: user.user_name,
      })),
    },
    {
      name: 'project_id',
      label: 'Project',
      type: 'select' as const,
      options: projects.map(project => ({
        value: String(project.project_id),
        label: project.project_name,
      })),
    },
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'bench_id',
      label: 'Bench ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'hil_name',
      label: 'HIL Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'pp_number',
      label: 'PP Number',
      type: 'text' as const,
    },
    {
      name: 'system_type',
      label: 'System Type',
      type: 'text' as const,
    },
    {
      name: 'bench_type',
      label: 'Bench Type',
      type: 'text' as const,
    },
    {
      name: 'acquisition_date',
      label: 'Acquisition Date',
      type: 'date' as const,
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text' as const,
    },
    {
      name: 'user_id',
      label: 'User',
      type: 'select' as const,
      options: users.map(user => ({
        value: String(user.user_id),
        label: user.user_name,
      })),
    },
    {
      name: 'project_id',
      label: 'Project',
      type: 'select' as const,
      options: projects.map(project => ({
        value: String(project.project_id),
        label: project.project_name,
      })),
    },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Server size={18} />
          Test Benches {hasLoaded ? `(${testBenches.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new test bench"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading test benches...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>HIL Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>PP Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>System Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>User</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Project</th>
                </tr>
              </thead>
              <tbody>
                {testBenches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No test benches found</td>
                  </tr>
                ) : (
                  testBenches.map((bench) => (
                    <tr key={bench.bench_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Fetch users and projects for edit modal
                      setSelectedTestBench(bench);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.bench_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.hil_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.pp_number}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.system_type}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.user_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.project_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTestBench && (
        <EditableDetailsModal
          isOpen={selectedTestBench !== null}
          onClose={() => setSelectedTestBench(null)}
          title={`Test Bench Details: ${selectedTestBench.hil_name}`}
          data={selectedTestBench}
          fields={detailsFields}
          onSave={handleUpdateTestBench}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Test Bench"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data.projects || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading projects: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add project');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/projects');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateProject = async (formData: Record<string, any>) => {
    try {
      // Make sure the project_id is included
      if (!formData.project_id) {
        throw new Error('Project ID is required');
      }

      // Send the update request
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setProjects(prev => 
        prev.map(project => 
          project.project_id === formData.project_id ? data.project : project
        )
      );
      
      // Also update the selected project
      setSelectedProject(data.project);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'project_number',
      label: 'Project Number',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'project_name',
      label: 'Project Name',
      type: 'text' as const,
      required: true,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'project_id',
      label: 'Project ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'project_number',
      label: 'Project Number',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'project_name',
      label: 'Project Name',
      type: 'text' as const,
      required: true,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Folder size={18} />
          Projects {hasLoaded ? `(${projects.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new project"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading projects...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Project Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Project Name</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No projects found</td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.project_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedProject(project)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{project.project_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{project.project_number}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{project.project_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedProject && (
        <EditableDetailsModal
          isOpen={selectedProject !== null}
          onClose={() => setSelectedProject(null)}
          title={`Project Details: ${selectedProject.project_name}`}
          data={selectedProject}
          fields={detailsFields}
          onSave={handleUpdateProject}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Project"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading users: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/users');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateUser = async (formData: Record<string, any>) => {
    try {
      // Make sure the user_id is included
      if (!formData.user_id) {
        throw new Error('User ID is required');
      }

      // Send the update request
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setUsers(prev => 
        prev.map(user => 
          user.user_id === formData.user_id ? data.user : user
        )
      );
      
      // Also update the selected user
      setSelectedUser(data.user);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'user_name',
      label: 'User Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'contact_info',
      label: 'Contact Info',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'user_id',
      label: 'User ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'user_name',
      label: 'User Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'contact_info',
      label: 'Contact Info',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <User size={18} />
          Users {hasLoaded ? `(${users.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new user"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading users...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>User Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Contact Info</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedUser(user)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{user.user_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{user.user_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{user.contact_info}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedUser && (
        <EditableDetailsModal
          isOpen={selectedUser !== null}
          onClose={() => setSelectedUser(null)}
          title={`User Details: ${selectedUser.user_name}`}
          data={selectedUser}
          fields={detailsFields}
          onSave={handleUpdateUser}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New User"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function ModelStandsList() {
  const [modelStands, setModelStands] = useState<ModelStand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelStand, setSelectedModelStand] = useState<ModelStand | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/modelstands');
      if (!response.ok) {
        throw new Error('Failed to fetch model stands');
      }
      const data = await response.json();
      setModelStands(data.modelStands || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading model stands: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching model stands:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/modelstands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add model stand');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/modelstands');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setModelStands(data.modelStands || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateModelStand = async (formData: Record<string, any>) => {
    try {
      // Make sure the model_id is included
      if (!formData.model_id) {
        throw new Error('Model ID is required');
      }

      // Send the update request
      const response = await fetch('/api/modelstands', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update model stand');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setModelStands(prev => 
        prev.map(model => 
          model.model_id === formData.model_id ? data.modelStand : model
        )
      );
      
      // Also update the selected model stand
      setSelectedModelStand(data.modelStand);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'model_name',
      label: 'Model Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'svn_link',
      label: 'SVN Link',
      type: 'text' as const,
    },
    {
      name: 'features',
      label: 'Features',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'model_id',
      label: 'Model ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'model_name',
      label: 'Model Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'svn_link',
      label: 'SVN Link',
      type: 'text' as const,
    },
    {
      name: 'features',
      label: 'Features',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Cpu size={18} />
          Model Stands {hasLoaded ? `(${modelStands.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new model stand"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading model stands...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Model Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>SVN Link</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Features</th>
                </tr>
              </thead>
              <tbody>
                {modelStands.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No model stands found</td>
                  </tr>
                ) : (
                  modelStands.map((model) => (
                    <tr key={model.model_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedModelStand(model)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{model.model_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{model.model_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{model.svn_link}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{model.features}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedModelStand && (
        <EditableDetailsModal
          isOpen={selectedModelStand !== null}
          onClose={() => setSelectedModelStand(null)}
          title={`Model Stand Details: ${selectedModelStand.model_name}`}
          data={selectedModelStand}
          fields={detailsFields}
          onSave={handleUpdateModelStand}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Model Stand"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function HilTechnologyList() {
  const [technology, setTechnology] = useState<HilTechnology[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTechnology, setSelectedTechnology] = useState<HilTechnology | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch test benches for dropdown select
      const testBenchesResponse = await fetch('/api/testbenches');
      if (testBenchesResponse.ok) {
        const testBenchesData = await testBenchesResponse.json();
        setTestBenches(testBenchesData.testBenches || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/hiltechnology');
      if (!response.ok) {
        throw new Error('Failed to fetch HIL technology data');
      }
      const data = await response.json();
      setTechnology(data.technology || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading HIL technology data: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL technology data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch test benches for dropdown
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/hiltechnology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add HIL technology');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/hiltechnology');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTechnology(data.technology || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateTechnology = async (formData: Record<string, any>) => {
    try {
      // Make sure the tech_id is included
      if (!formData.tech_id) {
        throw new Error('Technology ID is required');
      }

      // Send the update request
      const response = await fetch('/api/hiltechnology', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HIL technology');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setTechnology(prev => 
        prev.map(tech => 
          tech.tech_id === formData.tech_id ? data.technology : tech
        )
      );
      
      // Also update the selected technology
      setSelectedTechnology(data.technology);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'fiu_info',
      label: 'FIU Info',
      type: 'text' as const,
    },
    {
      name: 'io_info',
      label: 'I/O Info',
      type: 'text' as const,
    },
    {
      name: 'can_interface',
      label: 'CAN Interface',
      type: 'text' as const,
    },
    {
      name: 'power_interface',
      label: 'Power Interface',
      type: 'text' as const,
    },
    {
      name: 'possible_tests',
      label: 'Possible Tests',
      type: 'text' as const,
    },
    {
      name: 'leakage_module',
      label: 'Leakage Module',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'tech_id',
      label: 'Technology ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'fiu_info',
      label: 'FIU Info',
      type: 'text' as const,
    },
    {
      name: 'io_info',
      label: 'I/O Info',
      type: 'text' as const,
    },
    {
      name: 'can_interface',
      label: 'CAN Interface',
      type: 'text' as const,
    },
    {
      name: 'power_interface',
      label: 'Power Interface',
      type: 'text' as const,
    },
    {
      name: 'possible_tests',
      label: 'Possible Tests',
      type: 'text' as const,
    },
    {
      name: 'leakage_module',
      label: 'Leakage Module',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Microchip size={18} />
          HIL Technology {hasLoaded ? `(${technology.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new HIL technology"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading HIL technology data...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Test Bench</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>FIU Info</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>I/O Info</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>CAN Interface</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Power Interface</th>
                </tr>
              </thead>
              <tbody>
                {technology.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No HIL technology data found</td>
                  </tr>
                ) : (
                  technology.map((tech) => (
                    <tr key={tech.tech_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Fetch test benches for edit modal
                      setSelectedTechnology(tech);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.tech_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.hil_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.fiu_info}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.io_info}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.can_interface}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{tech.power_interface}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTechnology && (
        <EditableDetailsModal
          isOpen={selectedTechnology !== null}
          onClose={() => setSelectedTechnology(null)}
          title={`HIL Technology Details: ${selectedTechnology.hil_name}`}
          data={selectedTechnology}
          fields={detailsFields}
          onSave={handleUpdateTechnology}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New HIL Technology"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function HilOperationList() {
  const [operations, setOperations] = useState<HilOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<HilOperation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch test benches for dropdown select
      const testBenchesResponse = await fetch('/api/testbenches');
      if (testBenchesResponse.ok) {
        const testBenchesData = await testBenchesResponse.json();
        setTestBenches(testBenchesData.testBenches || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/hiloperation');
      if (!response.ok) {
        throw new Error('Failed to fetch HIL operation data');
      }
      const data = await response.json();
      setOperations(data.operations || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading HIL operation data: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL operation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch test benches for dropdown
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/hiloperation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add HIL operation');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/hiloperation');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setOperations(data.operations || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateOperation = async (formData: Record<string, any>) => {
    try {
      // Make sure the operation_id is included
      if (!formData.operation_id) {
        throw new Error('Operation ID is required');
      }

      // Send the update request
      const response = await fetch('/api/hiloperation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update HIL operation');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setOperations(prev => 
        prev.map(operation => 
          operation.operation_id === formData.operation_id ? data.operation : operation
        )
      );
      
      // Also update the selected operation
      setSelectedOperation(data.operation);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'possible_tests',
      label: 'Possible Tests',
      type: 'text' as const,
    },
    {
      name: 'vehicle_datasets',
      label: 'Vehicle Datasets',
      type: 'text' as const,
    },
    {
      name: 'scenarios',
      label: 'Scenarios',
      type: 'text' as const,
    },
    {
      name: 'controldesk_projects',
      label: 'ControlDesk Projects',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'operation_id',
      label: 'Operation ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'possible_tests',
      label: 'Possible Tests',
      type: 'text' as const,
    },
    {
      name: 'vehicle_datasets',
      label: 'Vehicle Datasets',
      type: 'text' as const,
    },
    {
      name: 'scenarios',
      label: 'Scenarios',
      type: 'text' as const,
    },
    {
      name: 'controldesk_projects',
      label: 'ControlDesk Projects',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Gauge size={18} />
          HIL Operation {hasLoaded ? `(${operations.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new HIL operation"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading HIL operation data...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Test Bench</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Possible Tests</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Vehicle Datasets</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Scenarios</th>
                </tr>
              </thead>
              <tbody>
                {operations.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No HIL operation data found</td>
                  </tr>
                ) : (
                  operations.map((operation) => (
                    <tr key={operation.operation_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Fetch test benches for edit modal
                      setSelectedOperation(operation);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{operation.operation_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{operation.hil_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{operation.possible_tests}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{operation.vehicle_datasets}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{operation.scenarios}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedOperation && (
        <EditableDetailsModal
          isOpen={selectedOperation !== null}
          onClose={() => setSelectedOperation(null)}
          title={`HIL Operation Details: ${selectedOperation.hil_name}`}
          data={selectedOperation}
          fields={detailsFields}
          onSave={handleUpdateOperation}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New HIL Operation"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function HardwareInstallationList() {
  const [hardware, setHardware] = useState<HardwareInstallation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHardware, setSelectedHardware] = useState<HardwareInstallation | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch test benches for dropdown select
      const testBenchesResponse = await fetch('/api/testbenches');
      if (testBenchesResponse.ok) {
        const testBenchesData = await testBenchesResponse.json();
        setTestBenches(testBenchesData.testBenches || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/hardware');
      if (!response.ok) {
        throw new Error('Failed to fetch hardware installation data');
      }
      const data = await response.json();
      setHardware(data.hardware || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading hardware installation data: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching hardware installation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };
  
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch test benches for dropdown
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/hardware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add hardware installation');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/hardware');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setHardware(data.hardware || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateHardware = async (formData: Record<string, any>) => {
    try {
      // Make sure the install_id is included
      if (!formData.install_id) {
        throw new Error('Installation ID is required');
      }

      // Send the update request
      const response = await fetch('/api/hardware', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update hardware installation');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setHardware(prev => 
        prev.map(hw => 
          hw.install_id === formData.install_id ? data.hardware : hw
        )
      );
      
      // Also update the selected hardware
      setSelectedHardware(data.hardware);

    } catch (err) {
      throw err;
    }
  };
  
  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'ecu_info',
      label: 'ECU Info',
      type: 'text' as const,
    },
    {
      name: 'sensors',
      label: 'Sensors',
      type: 'text' as const,
    },
    {
      name: 'additional_periphery',
      label: 'Additional Periphery',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'install_id',
      label: 'Installation ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'ecu_info',
      label: 'ECU Info',
      type: 'text' as const,
    },
    {
      name: 'sensors',
      label: 'Sensors',
      type: 'text' as const,
    },
    {
      name: 'additional_periphery',
      label: 'Additional Periphery',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Tool size={18} />
          Hardware Installation {hasLoaded ? `(${hardware.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new Hardware Installation"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading hardware installation data...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Test Bench</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ECU Info</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Sensors</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Additional Periphery</th>
                </tr>
              </thead>
              <tbody>
                {hardware.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No hardware installation data found</td>
                  </tr>
                ) : (
                  hardware.map((hw) => (
                    <tr key={hw.install_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setSelectedHardware(hw);
                      fetchRelatedData(); // Fetch test benches for the dropdown
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.install_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.hil_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.ecu_info}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.sensors}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{hw.additional_periphery}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedHardware && (
        <EditableDetailsModal
          isOpen={selectedHardware !== null}
          onClose={() => setSelectedHardware(null)}
          title={`Hardware Installation Details: ${selectedHardware.hil_name}`}
          data={selectedHardware}
          fields={detailsFields}
          onSave={handleUpdateHardware}
        />
      )}

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Hardware Installation"
        fields={addEntryFields}
        onSave={handleSaveEntry}
      />
    </div>
  );
}

function PcOverviewList() {
  const [pcs, setPcs] = useState<PcOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPc, setSelectedPc] = useState<PcOverview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch test benches for dropdown select
      const testBenchesResponse = await fetch('/api/testbenches');
      if (testBenchesResponse.ok) {
        const testBenchesData = await testBenchesResponse.json();
        setTestBenches(testBenchesData.testBenches || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/pcs');
      if (!response.ok) {
        throw new Error('Failed to fetch PC overview data');
      }
      const data = await response.json();
      setPcs(data.pcs || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading PC overview data: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching PC overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };
  
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch test benches for dropdown
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/pcs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add PC overview');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/pcs');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setPcs(data.pcs || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdatePc = async (formData: Record<string, any>) => {
    try {
      // Make sure the pc_id is included
      if (!formData.pc_id) {
        throw new Error('PC ID is required');
      }

      // Send the update request
      const response = await fetch('/api/pcs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update PC overview');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setPcs(prev => 
        prev.map(pc => 
          pc.pc_id === formData.pc_id ? data.pc : pc
        )
      );
      
      // Also update the selected PC
      setSelectedPc(data.pc);

    } catch (err) {
      throw err;
    }
  };
  
  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'pc_name',
      label: 'PC Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'purchase_year',
      label: 'Purchase Year',
      type: 'number' as const,
    },
    {
      name: 'inventory_number',
      label: 'Inventory Number',
      type: 'text' as const,
    },
    {
      name: 'pc_role',
      label: 'PC Role',
      type: 'text' as const,
    },
    {
      name: 'pc_model',
      label: 'PC Model',
      type: 'text' as const,
    },
    {
      name: 'special_equipment',
      label: 'Special Equipment',
      type: 'text' as const,
    },
    {
      name: 'mac_address',
      label: 'MAC Address',
      type: 'text' as const,
    },
    {
      name: 'ip_address',
      label: 'IP Address',
      type: 'text' as const,
    },
    {
      name: 'active_licenses',
      label: 'Active Licenses',
      type: 'text' as const,
    },
    {
      name: 'installed_tools',
      label: 'Installed Tools',
      type: 'text' as const,
    },
    {
      name: 'pc_info_text',
      label: 'PC Info',
      type: 'text' as const,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' },
        { value: 'maintenance', label: 'Maintenance' },
      ],
    },
    {
      name: 'active_user',
      label: 'Active User',
      type: 'text' as const,
    },
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'pc_id',
      label: 'PC ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'pc_name',
      label: 'PC Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'purchase_year',
      label: 'Purchase Year',
      type: 'number' as const,
    },
    {
      name: 'inventory_number',
      label: 'Inventory Number',
      type: 'text' as const,
    },
    {
      name: 'pc_role',
      label: 'PC Role',
      type: 'text' as const,
    },
    {
      name: 'pc_model',
      label: 'PC Model',
      type: 'text' as const,
    },
    {
      name: 'special_equipment',
      label: 'Special Equipment',
      type: 'text' as const,
    },
    {
      name: 'mac_address',
      label: 'MAC Address',
      type: 'text' as const,
    },
    {
      name: 'ip_address',
      label: 'IP Address',
      type: 'text' as const,
    },
    {
      name: 'active_licenses',
      label: 'Active Licenses',
      type: 'text' as const,
    },
    {
      name: 'installed_tools',
      label: 'Installed Tools',
      type: 'text' as const,
    },
    {
      name: 'pc_info_text',
      label: 'PC Info',
      type: 'text' as const,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' },
        { value: 'maintenance', label: 'Maintenance' },
      ],
    },
    {
      name: 'active_user',
      label: 'Active User',
      type: 'text' as const,
    },
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <PcCase size={18} />
          PC Overview {hasLoaded ? `(${pcs.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new PC"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading PC overview data...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Test Bench</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>PC Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Model</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>IP Address</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Active User</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Info</th>
                </tr>
              </thead>
              <tbody>
                {pcs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No PC overview data found</td>
                  </tr>
                ) : (
                  pcs.map((pc) => (
                    <tr key={pc.pc_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Fetch test benches for the dropdown
                      setSelectedPc(pc);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.pc_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.hil_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.pc_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.pc_role}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.pc_model}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{pc.ip_address}</td>
                      <td style={{ 
                        padding: '0.75rem 1rem', 
                        fontSize: '0.875rem', 
                        color: pc.status === 'online' ? '#059669' : pc.status === 'offline' ? '#dc2626' : '#d97706'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <div style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            backgroundColor: pc.status === 'online' ? '#059669' : pc.status === 'offline' ? '#dc2626' : '#d97706'
                          }}></div>
                          {pc.status || 'Unknown'}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>
                        {pc.active_user || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>
                        {pc.pc_info_text ? pc.pc_info_text.substring(0, 30) + (pc.pc_info_text.length > 30 ? '...' : '') : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedPc && (
        <EditableDetailsModal
          isOpen={selectedPc !== null}
          onClose={() => setSelectedPc(null)}
          title={`PC Overview Details: ${selectedPc.pc_name}`}
          data={selectedPc}
          fields={detailsFields}
          onSave={handleUpdatePc}
        />
      )}

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New PC"
        fields={addEntryFields}
        onSave={handleSaveEntry}
      />
    </div>
  );
}

function ProjectOverviewList() {
  const [overviews, setOverviews] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOverview, setSelectedOverview] = useState<ProjectOverview | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch test benches for dropdown select
      const testBenchesResponse = await fetch('/api/testbenches');
      if (testBenchesResponse.ok) {
        const testBenchesData = await testBenchesResponse.json();
        setTestBenches(testBenchesData.testBenches || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/projectoverview');
      if (!response.ok) {
        throw new Error('Failed to fetch project overview data');
      }
      const data = await response.json();
      setOverviews(data.projectOverviews || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading project overview data: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching project overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };
  
  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch test benches for dropdown
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/projectoverview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add project overview');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/projectoverview');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setOverviews(data.projectOverviews || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateOverview = async (formData: Record<string, any>) => {
    try {
      // Make sure the overview_id is included
      if (!formData.overview_id) {
        throw new Error('Overview ID is required');
      }

      // Send the update request
      const response = await fetch('/api/projectoverview', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project overview');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setOverviews(prev => 
        prev.map(overview => 
          overview.overview_id === formData.overview_id ? data.projectOverview : overview
        )
      );
      
      // Also update the selected overview
      setSelectedOverview(data.projectOverview);

    } catch (err) {
      throw err;
    }
  };
  
  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'platform',
      label: 'Platform',
      type: 'text' as const,
    },
    {
      name: 'system_supplier',
      label: 'System Supplier',
      type: 'text' as const,
    },
    {
      name: 'wetbench_info',
      label: 'Wetbench Info',
      type: 'text' as const,
    },
    {
      name: 'actuator_info',
      label: 'Actuator Info',
      type: 'text' as const,
    },
    {
      name: 'hardware',
      label: 'Hardware',
      type: 'text' as const,
    },
    {
      name: 'software',
      label: 'Software',
      type: 'text' as const,
    },
    {
      name: 'model_version',
      label: 'Model Version',
      type: 'text' as const,
    },
    {
      name: 'ticket_notes',
      label: 'Ticket Notes',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'overview_id',
      label: 'Overview ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'bench_id',
      label: 'Test Bench',
      type: 'select' as const,
      required: true,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'platform',
      label: 'Platform',
      type: 'text' as const,
    },
    {
      name: 'system_supplier',
      label: 'System Supplier',
      type: 'text' as const,
    },
    {
      name: 'wetbench_info',
      label: 'Wetbench Info',
      type: 'text' as const,
    },
    {
      name: 'actuator_info',
      label: 'Actuator Info',
      type: 'text' as const,
    },
    {
      name: 'hardware',
      label: 'Hardware',
      type: 'text' as const,
    },
    {
      name: 'software',
      label: 'Software',
      type: 'text' as const,
    },
    {
      name: 'model_version',
      label: 'Model Version',
      type: 'text' as const,
    },
    {
      name: 'ticket_notes',
      label: 'Ticket Notes',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Layers size={18} />
          Project Overview {hasLoaded ? `(${overviews.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new Project Overview"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading project overview data...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Test Bench</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Platform</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Supplier</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Hardware</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Software</th>
                </tr>
              </thead>
              <tbody>
                {overviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No project overview data found</td>
                  </tr>
                ) : (
                  overviews.map((overview) => (
                    <tr key={overview.overview_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Fetch test benches for the dropdown
                      setSelectedOverview(overview);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{overview.overview_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{overview.hil_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{overview.platform}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{overview.system_supplier}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{overview.hardware}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{overview.software}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedOverview && (
        <EditableDetailsModal
          isOpen={selectedOverview !== null}
          onClose={() => setSelectedOverview(null)}
          title={`Project Overview Details: ${selectedOverview.hil_name}`}
          data={selectedOverview}
          fields={detailsFields}
          onSave={handleUpdateOverview}
        />
      )}

      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Project Overview"
        fields={addEntryFields}
        onSave={handleSaveEntry}
      />
    </div>
  );
}

function VmInstancesList() {
  const [vmInstances, setVmInstances] = useState<VmInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVmInstance, setSelectedVmInstance] = useState<VmInstance | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/vminstances');
      if (!response.ok) {
        throw new Error('Failed to fetch VM instances');
      }
      const data = await response.json();
      setVmInstances(data.vmInstances || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading VM instances: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching VM instances:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/vminstances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add VM instance');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/vminstances');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setVmInstances(data.vmInstances || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateVmInstance = async (formData: Record<string, any>) => {
    try {
      // Make sure the vm_id is included
      if (!formData.vm_id) {
        throw new Error('VM ID is required');
      }

      // Send the update request
      const response = await fetch('/api/vminstances', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update VM instance');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setVmInstances(prev => 
        prev.map(vm => 
          vm.vm_id === formData.vm_id ? data.vmInstance : vm
        )
      );
      
      // Also update the selected VM instance
      setSelectedVmInstance(data.vmInstance);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'vm_name',
      label: 'VM Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'vm_address',
      label: 'VM Address',
      type: 'text' as const,
    },
    {
      name: 'installed_tools',
      label: 'Installed Tools',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'vm_id',
      label: 'VM ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'vm_name',
      label: 'VM Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'vm_address',
      label: 'VM Address',
      type: 'text' as const,
    },
    {
      name: 'installed_tools',
      label: 'Installed Tools',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Monitor size={18} />
          VM Instances {hasLoaded ? `(${vmInstances.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new VM instance"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading VM instances...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>VM Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>VM Address</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Installed Tools</th>
                </tr>
              </thead>
              <tbody>
                {vmInstances.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No VM instances found</td>
                  </tr>
                ) : (
                  vmInstances.map((vm) => (
                    <tr key={vm.vm_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedVmInstance(vm)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vm.vm_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vm.vm_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vm.vm_address}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{vm.installed_tools}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedVmInstance && (
        <EditableDetailsModal
          isOpen={selectedVmInstance !== null}
          onClose={() => setSelectedVmInstance(null)}
          title={`VM Instance Details: ${selectedVmInstance.vm_name}`}
          data={selectedVmInstance}
          fields={detailsFields}
          onSave={handleUpdateVmInstance}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New VM Instance"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function LicensesList() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pcs, setPcs] = useState<PcOverview[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch PCs for dropdown select
      const pcsResponse = await fetch('/api/pcs');
      if (pcsResponse.ok) {
        const pcsData = await pcsResponse.json();
        setPcs(pcsData.pcs || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/licenses');
      if (!response.ok) {
        throw new Error('Failed to fetch licenses');
      }
      const data = await response.json();
      setLicenses(data.licenses || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading licenses: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch PCs for dropdown
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add license');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/licenses');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setLicenses(data.licenses || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateLicense = async (formData: Record<string, any>) => {
    try {
      // Make sure the license_id is included
      if (!formData.license_id) {
        throw new Error('License ID is required');
      }

      // Send the update request
      const response = await fetch('/api/licenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update license');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setLicenses(prev => 
        prev.map(license => 
          license.license_id === formData.license_id ? data.license : license
        )
      );
      
      // Also update the selected license
      setSelectedLicense(data.license);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'tool_name',
      label: 'Tool Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'license_number',
      label: 'License Number',
      type: 'text' as const,
    },
    {
      name: 'maintenance_end',
      label: 'Maintenance End',
      type: 'date' as const,
    },
    {
      name: 'owner',
      label: 'Owner',
      type: 'text' as const,
    },
    {
      name: 'assigned_pc_id',
      label: 'Assigned PC',
      type: 'select' as const,
      options: pcs.map(pc => ({
        value: String(pc.pc_id),
        label: pc.pc_name,
      })),
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'license_id',
      label: 'License ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'tool_name',
      label: 'Tool Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'license_number',
      label: 'License Number',
      type: 'text' as const,
    },
    {
      name: 'maintenance_end',
      label: 'Maintenance End',
      type: 'date' as const,
    },
    {
      name: 'owner',
      label: 'Owner',
      type: 'text' as const,
    },
    {
      name: 'assigned_pc_id',
      label: 'Assigned PC',
      type: 'select' as const,
      options: pcs.map(pc => ({
        value: String(pc.pc_id),
        label: pc.pc_name,
      })),
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Lock size={18} />
          Licenses {hasLoaded ? `(${licenses.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new license"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading licenses...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Tool Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>License Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Maintenance End</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No licenses found</td>
                  </tr>
                ) : (
                  licenses.map((license) => (
                    <tr key={license.license_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Fetch PCs for edit modal
                      setSelectedLicense(license);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.license_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.tool_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.license_number}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.maintenance_end}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{license.owner}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedLicense && (
        <EditableDetailsModal
          isOpen={selectedLicense !== null}
          onClose={() => setSelectedLicense(null)}
          title={`License Details: ${selectedLicense.tool_name}`}
          data={selectedLicense}
          fields={detailsFields}
          onSave={handleUpdateLicense}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New License"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function WetbenchesList() {
  const [wetbenches, setWetbenches] = useState<Wetbench[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWetbench, setSelectedWetbench] = useState<Wetbench | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testBenches, setTestBenches] = useState<TestBench[]>([]);

  const fetchRelatedData = async () => {
    try {
      // Fetch test benches for dropdown select
      const testBenchesResponse = await fetch('/api/testbenches');
      if (testBenchesResponse.ok) {
        const testBenchesData = await testBenchesResponse.json();
        setTestBenches(testBenchesData.testBenches || []);
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    }
  };

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/wetbenches');
      if (!response.ok) {
        throw new Error('Failed to fetch wetbenches');
      }
      const data = await response.json();
      setWetbenches(data.wetbenches || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading wetbenches: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching wetbenches:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Fetch data when expanding if it hasn't been loaded yet
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the toggle expand
    fetchRelatedData(); // Fetch test benches for dropdown
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      const response = await fetch('/api/wetbenches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add wetbench');
      }

      // Refresh the list after adding
      const refreshResponse = await fetch('/api/wetbenches');
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setWetbenches(data.wetbenches || []);
      }
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateWetbench = async (formData: Record<string, any>) => {
    try {
      // Make sure the wetbench_id is included
      if (!formData.wetbench_id) {
        throw new Error('Wetbench ID is required');
      }

      // Send the update request
      const response = await fetch('/api/wetbenches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update wetbench');
      }

      // Get the updated data
      const data = await response.json();
      
      // Update the local state
      setWetbenches(prev => 
        prev.map(wetbench => 
          wetbench.wetbench_id === formData.wetbench_id ? data.wetbench : wetbench
        )
      );
      
      // Also update the selected wetbench
      setSelectedWetbench(data.wetbench);

    } catch (err) {
      throw err;
    }
  };

  // Define fields for the add entry modal
  const addEntryFields = [
    {
      name: 'wetbench_name',
      label: 'Wetbench Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'pp_number',
      label: 'PP Number',
      type: 'text' as const,
    },
    {
      name: 'owner',
      label: 'Owner',
      type: 'text' as const,
    },
    {
      name: 'system_type',
      label: 'System Type',
      type: 'text' as const,
    },
    {
      name: 'platform',
      label: 'Platform',
      type: 'text' as const,
    },
    {
      name: 'system_supplier',
      label: 'System Supplier',
      type: 'text' as const,
    },
    {
      name: 'linked_bench_id',
      label: 'Linked Test Bench',
      type: 'select' as const,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'actuator_info',
      label: 'Actuator Info',
      type: 'text' as const,
    },
    {
      name: 'hardware_components',
      label: 'Hardware Components',
      type: 'text' as const,
    },
    {
      name: 'inventory_number',
      label: 'Inventory Number',
      type: 'text' as const,
    }
  ];

  // Define fields for the editable details modal
  const detailsFields = [
    {
      name: 'wetbench_id',
      label: 'Wetbench ID',
      type: 'number' as const,
      editable: false, // ID shouldn't be editable
    },
    {
      name: 'wetbench_name',
      label: 'Wetbench Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'pp_number',
      label: 'PP Number',
      type: 'text' as const,
    },
    {
      name: 'owner',
      label: 'Owner',
      type: 'text' as const,
    },
    {
      name: 'system_type',
      label: 'System Type',
      type: 'text' as const,
    },
    {
      name: 'platform',
      label: 'Platform',
      type: 'text' as const,
    },
    {
      name: 'system_supplier',
      label: 'System Supplier',
      type: 'text' as const,
    },
    {
      name: 'linked_bench_id',
      label: 'Linked Test Bench',
      type: 'select' as const,
      options: testBenches.map(bench => ({
        value: String(bench.bench_id),
        label: bench.hil_name,
      })),
    },
    {
      name: 'actuator_info',
      label: 'Actuator Info',
      type: 'text' as const,
    },
    {
      name: 'hardware_components',
      label: 'Hardware Components',
      type: 'text' as const,
    },
    {
      name: 'inventory_number',
      label: 'Inventory Number',
      type: 'text' as const,
    }
  ];

  return (
    <div style={{ marginTop: '2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          marginBottom: isExpanded ? '0.5rem' : '0',
          transition: 'background-color 0.2s'
        }}
        onClick={toggleExpand}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          margin: 0
        }}>
          <Beaker size={18} />
          Wetbenches {hasLoaded ? `(${wetbenches.length})` : ''}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {loading && (
            <RefreshCw size={16} style={{ 
              animation: 'spin 1s linear infinite',
              color: '#6b7280'
            }} />
          )}
          <button
            onClick={handleAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Add new wetbench"
          >
            <Plus size={16} />
          </button>
          <div style={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.2s'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          transition: 'max-height 0.3s ease-in-out'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem',
              color: '#6b7280'
            }}>
              <RefreshCw size={24} style={{ 
                animation: 'spin 1s linear infinite',
                marginBottom: '0.5rem'
              }} />
              <p style={{ margin: 0 }}>Loading wetbenches...</p>
              <style jsx>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p>{error}</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Wetbench Name</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>PP Number</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Owner</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>System Type</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Platform</th>
                </tr>
              </thead>
              <tbody>
                {wetbenches.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No wetbenches found</td>
                  </tr>
                ) : (
                  wetbenches.map((wetbench) => (
                    <tr key={wetbench.wetbench_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchRelatedData(); // Fetch test benches for edit modal
                      setSelectedWetbench(wetbench);
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wetbench.wetbench_id}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wetbench.wetbench_name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wetbench.pp_number}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wetbench.owner}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wetbench.system_type}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{wetbench.platform}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedWetbench && (
        <EditableDetailsModal
          isOpen={selectedWetbench !== null}
          onClose={() => setSelectedWetbench(null)}
          title={`Wetbench Details: ${selectedWetbench.wetbench_name}`}
          data={selectedWetbench}
          fields={detailsFields}
          onSave={handleUpdateWetbench}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Wetbench"
          fields={addEntryFields}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

export default function DatabasePage() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto',
      maxHeight: '100vh'
    }}>
      <Header />
      
      <div style={{ 
        flex: 1, 
        padding: '2rem', 
        backgroundColor: '#f8fafc',
        overflowY: 'auto'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <DatabaseIcon size={28} style={{ color: '#0F3460', marginRight: '1rem' }} />
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 'bold',
              color: '#0F3460',
              margin: 0
            }}>Database Management</h1>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Database Connection Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Connection Settings</h2>
                <Server size={20} style={{ color: '#0F3460' }} />
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                margin: 0
              }}>Configure database connection parameters and credentials</p>
            </div>
            
            {/* Database Tables Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Tables</h2>
                <Table size={20} style={{ color: '#0F3460' }} />
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                margin: 0
              }}>View and manage database tables and records</p>
            </div>
            
            {/* Database Security Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>Security</h2>
                <Lock size={20} style={{ color: '#0F3460' }} />
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#4b5563',
                margin: 0
              }}>Manage database access permissions and security settings</p>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginTop: 0,
              marginBottom: '1rem'
            }}>Connection Status</h2>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 5px #10b981'
              }}></div>
              <span style={{ fontSize: '0.875rem', color: '#111827' }}>Connected to SQLite database</span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Database File</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>reconnect.db</p>
              </div>
              
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Tables</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>12</p>
              </div>
              
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Records</p>
                <p style={{ fontSize: '0.875rem', color: '#111827', margin: 0 }}>Multiple</p>
              </div>
            </div>
          </div>
          
          {/* Display all database tables */}
          <TestBenchList />
          <ProjectsList />
          <UsersList />
          <ModelStandsList />
          <VmInstancesList />
          <LicensesList />
          <WetbenchesList />
          <HilTechnologyList />
          <HilOperationList />
          <HardwareInstallationList />
          <PcOverviewList />
          <ProjectOverviewList />
        </div>
      </div>
    </main>
  );
} 