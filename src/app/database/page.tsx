'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Database as DatabaseIcon, Table, Server, Lock, RefreshCw, User, Folder, HardDrive, Cpu, Settings, Activity, Wrench as Tool, Zap, Monitor, Layers, Gauge, Microchip, PcCase, Beaker } from 'lucide-react';
import DetailsModal from '@/components/DetailsModal';

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
                    onClick={() => setSelectedTestBench(bench)}
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
        <DetailsModal
          isOpen={selectedTestBench !== null}
          onClose={() => setSelectedTestBench(null)}
          title={`Test Bench Details: ${selectedTestBench.hil_name}`}
          data={selectedTestBench}
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
        <DetailsModal
          isOpen={selectedProject !== null}
          onClose={() => setSelectedProject(null)}
          title={`Project Details: ${selectedProject.project_name}`}
          data={selectedProject}
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Name</th>
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
        <DetailsModal
          isOpen={selectedUser !== null}
          onClose={() => setSelectedUser(null)}
          title={`User Details: ${selectedUser.user_name}`}
          data={selectedUser}
        />
      )}
    </div>
  );
}

function ModelStandsList() {
  const [modelStands, setModelStands] = useState<ModelStand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelStand | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

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
          <Settings size={18} />
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
                    onClick={() => setSelectedModel(model)}
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

      {selectedModel && (
        <DetailsModal
          isOpen={selectedModel !== null}
          onClose={() => setSelectedModel(null)}
          title={`Model Stand Details: ${selectedModel.model_name}`}
          data={selectedModel}
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

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/hiltechnology');
      if (!response.ok) {
        throw new Error('Failed to fetch HIL technology');
      }
      const data = await response.json();
      setTechnology(data.technology || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading HIL technology: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL technology:', err);
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
              <p style={{ margin: 0 }}>Loading HIL technology...</p>
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
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No HIL technology found</td>
                  </tr>
                ) : (
                  technology.map((tech) => (
                    <tr key={tech.tech_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedTechnology(tech)}
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
        <DetailsModal
          isOpen={selectedTechnology !== null}
          onClose={() => setSelectedTechnology(null)}
          title={`HIL Technology Details: ${selectedTechnology.hil_name}`}
          data={selectedTechnology}
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

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/hiloperation');
      if (!response.ok) {
        throw new Error('Failed to fetch HIL operation');
      }
      const data = await response.json();
      setOperations(data.operations || []);
      setHasLoaded(true);
    } catch (err) {
      setError('Error loading HIL operation: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching HIL operation:', err);
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
          <Activity size={18} />
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
              <p style={{ margin: 0 }}>Loading HIL operation...</p>
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
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No HIL operation found</td>
                  </tr>
                ) : (
                  operations.map((operation) => (
                    <tr key={operation.operation_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedOperation(operation)}
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
        <DetailsModal
          isOpen={selectedOperation !== null}
          onClose={() => setSelectedOperation(null)}
          title={`HIL Operation Details: ${selectedOperation.hil_name}`}
          data={selectedOperation}
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
                    onClick={() => setSelectedHardware(hw)}
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
        <DetailsModal
          isOpen={selectedHardware !== null}
          onClose={() => setSelectedHardware(null)}
          title={`Hardware Installation Details: ${selectedHardware.hil_name}`}
          data={selectedHardware}
        />
      )}
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
                    onClick={() => setSelectedPc(pc)}
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
        <DetailsModal
          isOpen={selectedPc !== null}
          onClose={() => setSelectedPc(null)}
          title={`PC Overview Details: ${selectedPc.pc_name}`}
          data={selectedPc}
        />
      )}
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

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/projectoverview');
      if (!response.ok) {
        throw new Error('Failed to fetch project overview data');
      }
      const data = await response.json();
      setOverviews(data.overviews || []);
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
                    onClick={() => setSelectedOverview(overview)}
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
        <DetailsModal
          isOpen={selectedOverview !== null}
          onClose={() => setSelectedOverview(null)}
          title={`Project Overview Details: ${selectedOverview.hil_name}`}
          data={selectedOverview}
        />
      )}
    </div>
  );
}

function VmInstancesList() {
  const [vms, setVms] = useState<VmInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVm, setSelectedVm] = useState<VmInstance | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return; // Don't fetch if already loaded
    
    setLoading(true);
    try {
      const response = await fetch('/api/vms');
      if (!response.ok) {
        throw new Error('Failed to fetch VM instances');
      }
      const data = await response.json();
      setVms(data.vms || []);
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
          <HardDrive size={18} />
          VM Instances {hasLoaded ? `(${vms.length})` : ''}
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
                {vms.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No VM instances found</td>
                  </tr>
                ) : (
                  vms.map((vm) => (
                    <tr key={vm.vm_id} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedVm(vm)}
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

      {selectedVm && (
        <DetailsModal
          isOpen={selectedVm !== null}
          onClose={() => setSelectedVm(null)}
          title={`VM Instance Details: ${selectedVm.vm_name}`}
          data={selectedVm}
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
                    onClick={() => setSelectedLicense(license)}
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
        <DetailsModal
          isOpen={selectedLicense !== null}
          onClose={() => setSelectedLicense(null)}
          title={`License Details: ${selectedLicense.tool_name}`}
          data={selectedLicense}
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
                    onClick={() => setSelectedWetbench(wetbench)}
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
        <DetailsModal
          isOpen={selectedWetbench !== null}
          onClose={() => setSelectedWetbench(null)}
          title={`Wetbench Details: ${selectedWetbench.wetbench_name}`}
          data={selectedWetbench}
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