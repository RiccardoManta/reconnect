'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Database as DatabaseIcon, Table, Server, Lock, RefreshCw, User, Folder, HardDrive, Cpu, Settings, Activity, Wrench as Tool, Zap, Monitor, Layers, Gauge, Microchip, PcCase } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestBenches() {
      try {
        const response = await fetch('/api/testbenches');
        if (!response.ok) {
          throw new Error('Failed to fetch test benches');
        }
        const data = await response.json();
        setTestBenches(data.testBenches || []);
      } catch (err) {
        setError('Error loading test benches: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching test benches:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTestBenches();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p>Loading test benches...</p>
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        borderRadius: '0.5rem'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem'
      }}>Test Benches</h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>System</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Location</th>
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
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Server size={16} style={{ color: '#0F3460', opacity: 0.8 }} />
                      <span style={{ fontWeight: '500' }}>{bench.hil_name}</span> 
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({bench.pp_number})</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.bench_type}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.system_type}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{bench.location}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>
                    {bench.user_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} style={{ color: '#0F3460', opacity: 0.8 }} />
                        {bench.user_name}
                      </div>
                    ) : (
                      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>
                    {bench.project_name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Folder size={14} style={{ color: '#0F3460', opacity: 0.8 }} />
                        {bench.project_name}
                      </div>
                    ) : (
                      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No project</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError('Error loading projects: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Folder size={18} />
        Projects
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
                }}
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
      </div>
    </div>
  );
}

function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data.users || []);
      } catch (err) {
        setError('Error loading users: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <User size={18} />
        Users
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
                }}
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
      </div>
    </div>
  );
}

function ModelStandsList() {
  const [modelStands, setModelStands] = useState<ModelStand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModelStands() {
      try {
        const response = await fetch('/api/modelstands');
        if (!response.ok) {
          throw new Error('Failed to fetch model stands');
        }
        const data = await response.json();
        setModelStands(data.modelStands || []);
      } catch (err) {
        setError('Error loading model stands: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching model stands:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchModelStands();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading model stands...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Settings size={18} />
        Model Stands
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
                }}
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
      </div>
    </div>
  );
}

function VmInstancesList() {
  const [vms, setVms] = useState<VmInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVms() {
      try {
        const response = await fetch('/api/vms');
        if (!response.ok) {
          throw new Error('Failed to fetch VM instances');
        }
        const data = await response.json();
        setVms(data.vms || []);
      } catch (err) {
        setError('Error loading VM instances: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching VM instances:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVms();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading VM instances...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Monitor size={18} />
        Virtual Machines
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563' }}>Address</th>
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
                  transition: 'background-color 0.2s'
                }}
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
      </div>
    </div>
  );
}

function LicensesList() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLicenses() {
      try {
        const response = await fetch('/api/licenses');
        if (!response.ok) {
          throw new Error('Failed to fetch licenses');
        }
        const data = await response.json();
        setLicenses(data.licenses || []);
      } catch (err) {
        setError('Error loading licenses: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching licenses:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLicenses();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading licenses...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Tool size={18} />
        Licenses
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
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
      </div>
    </div>
  );
}

function WetbenchesList() {
  const [wetbenches, setWetbenches] = useState<Wetbench[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWetbenches() {
      try {
        const response = await fetch('/api/wetbenches');
        if (!response.ok) {
          throw new Error('Failed to fetch wetbenches');
        }
        const data = await response.json();
        setWetbenches(data.wetbenches || []);
      } catch (err) {
        setError('Error loading wetbenches: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching wetbenches:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWetbenches();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading wetbenches...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Layers size={18} />
        Wetbenches
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
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
      </div>
    </div>
  );
}

function HilTechnologyList() {
  const [technology, setTechnology] = useState<HilTechnology[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTechnology() {
      try {
        const response = await fetch('/api/hiltechnology');
        if (!response.ok) {
          throw new Error('Failed to fetch HIL technology data');
        }
        const data = await response.json();
        setTechnology(data.technology || []);
      } catch (err) {
        setError('Error loading HIL technology data: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching HIL technology data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTechnology();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading HIL technology data...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Zap size={18} />
        HIL Technology
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
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
      </div>
    </div>
  );
}

function HilOperationList() {
  const [operations, setOperations] = useState<HilOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOperations() {
      try {
        const response = await fetch('/api/hiloperation');
        if (!response.ok) {
          throw new Error('Failed to fetch HIL operation data');
        }
        const data = await response.json();
        setOperations(data.operation || []);
      } catch (err) {
        setError('Error loading HIL operation data: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching HIL operation data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOperations();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading HIL operation data...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Activity size={18} />
        HIL Operations
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
              operations.map((op) => (
                <tr key={op.operation_id} style={{
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.operation_id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.hil_name}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.possible_tests}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.vehicle_datasets}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{op.scenarios}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HardwareInstallationList() {
  const [hardware, setHardware] = useState<HardwareInstallation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHardware() {
      try {
        const response = await fetch('/api/hardware');
        if (!response.ok) {
          throw new Error('Failed to fetch hardware installation data');
        }
        const data = await response.json();
        setHardware(data.hardware || []);
      } catch (err) {
        setError('Error loading hardware installation data: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching hardware installation data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHardware();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading hardware installation data...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Microchip size={18} />
        Hardware Installations
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
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
      </div>
    </div>
  );
}

function PcOverviewList() {
  const [pcs, setPcs] = useState<PcOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPcs() {
      try {
        const response = await fetch('/api/pcs');
        if (!response.ok) {
          throw new Error('Failed to fetch PC overview data');
        }
        const data = await response.json();
        setPcs(data.pcs || []);
      } catch (err) {
        setError('Error loading PC overview data: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching PC overview data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPcs();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading PC overview data...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <PcCase size={18} />
        PC Overview
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
            </tr>
          </thead>
          <tbody>
            {pcs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No PC overview data found</td>
              </tr>
            ) : (
              pcs.map((pc) => (
                <tr key={pc.pc_id} style={{
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'background-color 0.2s'
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectOverviewList() {
  const [overviews, setOverviews] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverviews() {
      try {
        const response = await fetch('/api/projectoverview');
        if (!response.ok) {
          throw new Error('Failed to fetch project overview data');
        }
        const data = await response.json();
        setOverviews(data.projectOverviews || []);
      } catch (err) {
        setError('Error loading project overview data: ' + (err instanceof Error ? err.message : String(err)));
        console.error('Error fetching project overview data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOverviews();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: '0.875rem' }}>Loading project overview data...</p>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Cpu size={18} />
        Project Overviews
      </h2>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        padding: '1rem',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        overflowX: 'auto'
      }}>
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
                  transition: 'background-color 0.2s'
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
      </div>
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
          <UsersList />
          <ProjectsList />
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