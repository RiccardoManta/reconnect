'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { ClipboardList, RefreshCw, PlusCircle, Ban } from 'lucide-react';
import EditableDetailsModal from '@/components/EditableDetailsModal';
import AddEntryModal from '@/components/AddEntryModal';
import { Project } from '@/types/database';
import { usePermissions } from '@/contexts/PermissionContext';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { permissionName, isLoading: permissionsLoading } = usePermissions();
  const isReadOnly = permissionName === 'Read';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      // API returns snake_case, Project type is snake_case
      setProjects(data.projects || []);
    } catch (err) {
      setError('Error loading projects: ' + (err instanceof Error ? err.message : String(err)));
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClick = () => {
    if (isReadOnly || permissionsLoading) return;
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = async (formData: Record<string, any>) => {
    try {
      // formData from AddEntryModal is now snake_case
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send snake_case data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add project');
      }

      // API returns snake_case { project: ... }
      const savedData = await response.json();
      const newProject = savedData.project as Project;
      setProjects(prev => [...prev, newProject]);
      setIsAddModalOpen(false); // Close modal on success

    } catch (err) {
      console.error("Failed to save project:", err);
      throw err; // Let the modal handle displaying the error
    }
  };

  const handleUpdateProject = async (formData: Record<string, any>) => {
    try {
      // Ensure project_id is present (now snake_case from modal)
      if (!formData.project_id) {
        throw new Error('Project ID (project_id) is required');
      }

      // formData from EditableDetailsModal is now snake_case
      const response = await fetch('/api/projects', { // Assuming PUT to collection endpoint, ID in body
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send snake_case data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      // API returns the updated record in snake_case { project: ... }
      const data = await response.json();
      const updatedProject = data.project as Project;

      // Update local state with snake_case data
      setProjects(prev =>
        prev.map(project =>
          project.project_id === updatedProject.project_id ? updatedProject : project // Use snake_case
        )
      );

      // Update selected project with snake_case data
      if (selectedProject?.project_id === updatedProject.project_id) { // Use snake_case
          setSelectedProject(updatedProject);
      }

    } catch (err) {
      console.error("Failed to update project:", err);
      throw err; // Let the modal handle displaying the error
    }
  };

  // Define fields for the add entry modal using snake_case names
  const addEntryFields: ModalField[] = [
    { name: 'project_number', label: 'Project Number', type: 'text', required: true },
    { name: 'project_name', label: 'Project Name', type: 'text', required: true },
  ];

  // Define fields for the editable details modal using snake_case names
  const detailsFields: ModalField[] = [
    { name: 'project_id', label: 'Project ID', type: 'number', editable: false },
    { name: 'project_number', label: 'Project Number', type: 'text', required: true, editable: true },
    { name: 'project_name', label: 'Project Name', type: 'text', required: true, editable: true },
  ];

  // --- Styles --- (Adapted from other lists)
  const styles: { [key: string]: CSSProperties } = {
    headerContainer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
    headerTitleContainer: { display: 'flex', alignItems: 'center' },
    headerIcon: { color: '#0F3460', marginRight: '1rem' },
    headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
    addButton: { 
        border: 'none', 
        borderRadius: '0.375rem', 
        padding: '0.5rem 0.75rem', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        fontSize: '0.875rem', 
        fontWeight: 500, 
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
        backgroundColor: '#39A2DB',
        color: 'white' 
    },
    tableContainer: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', overflowX: 'auto' },
    loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
    loadingSpinner: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
    errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
    tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
    tableBodyRow: { borderBottom: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' },
    tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  };

  return (
    <div>
       {/* Page Header */}
       <div style={styles.headerContainer}>
         <div style={styles.headerTitleContainer}>
           <ClipboardList size={28} style={styles.headerIcon} />
           <h1 style={styles.headerTitle}>Projects {projects.length > 0 ? `(${projects.length})` : ''}</h1>
         </div>
         <button
           onClick={handleAddClick}
           style={{
             ...styles.addButton,
             ...( (isReadOnly || permissionsLoading) ? { cursor: 'not-allowed', opacity: 0.7 } : {}),
           }}
           disabled={isReadOnly || permissionsLoading}
           title={isReadOnly ? "Read-only: Cannot add new project" : "Add new project"}
         >
           {(isReadOnly && !permissionsLoading) && <Ban size={16} style={{ marginRight: '0.5rem' }} />}
           <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
           Add Project
         </button>
       </div>

       {/* Table Container */}
       <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <RefreshCw size={24} style={styles.loadingSpinner} />
              <p style={{ margin: 0 }}>Loading projects...</p>
              <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : error ? (
            <div style={styles.errorContainer}><p>{error}</p></div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeaderCell}>Project Name</th>
                  <th style={styles.tableHeaderCell}>Project Number</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No projects found</td></tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.project_id}
                      style={styles.tableBodyRow}
                      onClick={() => setSelectedProject(project)} // Set selected for modal
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <td style={styles.tableBodyCell}>{project.project_name}</td>
                      <td style={styles.tableBodyCell}>{project.project_number}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      
      {/* Modals */} 
      {selectedProject && (
        <EditableDetailsModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          data={selectedProject}
          fields={detailsFields}
          onSave={handleUpdateProject}
          title={`Edit Project: ${selectedProject.project_name}`}
          isReadOnly={isReadOnly}
        />
      )}

      {isAddModalOpen && (
        <AddEntryModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Project"
          fields={addEntryFields}
          onSave={handleSaveEntry}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
} 