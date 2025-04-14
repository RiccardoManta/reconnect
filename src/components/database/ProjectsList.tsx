'use client';

import React, { useState } from 'react';
import { Folder, RefreshCw, Plus } from 'lucide-react';
import EditableDetailsModal from '@/components/EditableDetailsModal';
import AddEntryModal from '@/components/AddEntryModal';
import { Project } from '@/types/database';
import { keysToCamel, keysToSnake } from '@/utils/caseConverter';

// --- Reusable Modal Field Type Definitions (Consider moving to a shared file) ---
type FieldType = 'text' | 'number' | 'date' | 'select';

interface SelectOption {
  value: string;
  label: string;
}

interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  editable?: boolean;
}

interface TextField extends BaseField {
  type: 'text';
}

interface NumberField extends BaseField {
  type: 'number';
}

interface DateField extends BaseField {
  type: 'date';
}

interface SelectField extends BaseField {
  type: 'select';
  options: SelectOption[];
}

type ModalField = TextField | NumberField | DateField | SelectField;
// --- End Reusable Modal Field Type Definitions ---

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    if (hasLoaded) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      // Convert incoming snake_case keys to camelCase
      setProjects(keysToCamel<Project[]>(data.projects || []));
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
    if (newExpandedState && !hasLoaded && !loading) {
      fetchData();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // Convert outgoing camelCase keys to snake_case for the API
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add project');
      }

      // Refresh data - API returns snake_case, convert to camelCase
      const savedData = await response.json();
      const newProject = keysToCamel<Project>(savedData.project);
      setProjects(prev => [...prev, newProject]);
      setIsAddModalOpen(false); // Close modal on success

    } catch (err) {
      console.error("Failed to save project:", err);
      throw err; // Let the modal handle displaying the error
    }
  };

  const handleUpdateProject = async (formData: Record<string, any>) => {
    try {
      // Ensure projectId is present (already camelCase from modal)
      if (!formData.projectId) {
        throw new Error('Project ID is required');
      }

      // Convert outgoing camelCase keys to snake_case for the API
      const snakeCaseData = keysToSnake(formData);
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snakeCaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      // API returns the updated record in snake_case, convert to camelCase
      const data = await response.json();
      const updatedProject = keysToCamel<Project>(data.project);

      // Update local state with camelCase data
      setProjects(prev =>
        prev.map(project =>
          project.projectId === updatedProject.projectId ? updatedProject : project
        )
      );

      // Update selected project with camelCase data
      setSelectedProject(updatedProject);
      // Optionally close the modal on successful update
      // setSelectedProject(null);

    } catch (err) {
      console.error("Failed to update project:", err);
      throw err; // Let the modal handle displaying the error
    }
  };

  // Define fields for the add entry modal using camelCase names
  const addEntryFields: ModalField[] = [
    { name: 'projectNumber', label: 'Project Number', type: 'text', required: true },
    { name: 'projectName', label: 'Project Name', type: 'text', required: true },
  ];

  // Define fields for the editable details modal using camelCase names
  const detailsFields: ModalField[] = [
    { name: 'projectId', label: 'Project ID', type: 'number', editable: false },
    { name: 'projectNumber', label: 'Project Number', type: 'text', required: true },
    { name: 'projectName', label: 'Project Name', type: 'text', required: true },
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
                    <tr key={project.projectId} style={{
                      borderBottom: '1px solid #e5e7eb',
                      transition: 'background-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedProject(project)} // Use camelCase data
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{project.projectId}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{project.projectNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' }}>{project.projectName}</td>
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
          title={`Project Details: ${selectedProject.projectName}`} // Use camelCase
          data={selectedProject} // Pass camelCase data
          fields={detailsFields} // Pass camelCase fields
          onSave={handleUpdateProject} // Handler expects camelCase, converts to snake_case
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Project"
          fields={addEntryFields} // Pass camelCase fields
          onSave={handleSaveEntry} // Handler expects camelCase, converts to snake_case
        />
      )}
    </div>
  );
} 