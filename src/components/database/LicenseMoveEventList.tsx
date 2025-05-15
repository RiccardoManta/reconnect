'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { LicenseMoveEvent } from '@/types/database';
import { RefreshCw, AlertTriangle, FileText } from 'lucide-react'; // Used FileText icon

const styles: { [key: string]: CSSProperties } = {
  container: { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' },
  headerContainer: { display: 'flex', alignItems: 'center', marginBottom: '1.5rem' },
  headerIcon: { color: '#0F3460', marginRight: '1rem' },
  headerTitle: { fontSize: '1.75rem', fontWeight: 'bold', color: '#0F3460', margin: 0 },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
  tableBodyRow: { borderBottom: '1px solid #e5e7eb' },
  tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
  loadingSpinner: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
  errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
};

export default function LicenseMoveEventList() {
  const [licenseMoves, setLicenseMoves] = useState<LicenseMoveEvent[]>([]);
  const [loadingLicense, setLoadingLicense] = useState(true);
  const [errorLicense, setErrorLicense] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenseMoves = async () => {
      setLoadingLicense(true);
      setErrorLicense(null);
      try {
        const response = await fetch('/api/licensemoveevents');
        if (!response.ok) throw new Error('Failed to fetch license move events');
        const data = await response.json();
        setLicenseMoves(data.license_move_events || []);
      } catch (err) {
        setErrorLicense(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingLicense(false);
      }
    };
    fetchLicenseMoves();
  }, []);

  const renderLoading = () => (
    <div style={styles.loadingContainer}>
      <RefreshCw size={24} style={styles.loadingSpinner} />
      <p style={{ margin: 0 }}>Loading license move history...</p>
      <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const renderError = (errorMsg: string) => (
    <div style={styles.errorContainer}>
      <AlertTriangle size={20} style={{ marginRight: '0.5rem' }} />
      <p>{errorMsg}</p>
    </div>
  );
  
  return (
    <div style={styles.container}>
        <div style={styles.headerContainer}>
            <FileText size={28} style={styles.headerIcon} />
            <h1 style={styles.headerTitle}>License Move History</h1>
        </div>
        {loadingLicense ? renderLoading() : errorLicense ? renderError(errorLicense) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  {/* Removed Event ID */}
                  <th style={styles.tableHeaderCell}>License Name</th>
                  <th style={styles.tableHeaderCell}>License Key</th>
                  <th style={styles.tableHeaderCell}>From PC</th>
                  <th style={styles.tableHeaderCell}>To PC</th>
                  {/* <th style={styles.tableHeaderCell}>From VM</th> */}
                  {/* <th style={styles.tableHeaderCell}>To VM</th> */}
                  <th style={styles.tableHeaderCell}>Moved On</th>
                  {/* <th style={styles.tableHeaderCell}>Moved By</th> */}
                </tr>
              </thead>
              <tbody>
                {licenseMoves.length === 0 ? (
                  <tr><td colSpan={5} style={styles.noDataCell}>No license move events found.</td></tr>
                ) : (
                  licenseMoves.map((event) => {
                    // const fromLocation = event.from_pc_name || event.from_vm_name || (event.from_pc_id || event.from_vm_id ? `ID: ${event.from_pc_id || event.from_vm_id}` : 'Source N/A');
                    // const toLocation = event.to_pc_name || event.to_vm_name || (event.to_pc_id || event.to_vm_id ? `ID: ${event.to_pc_id || event.to_vm_id}` : 'Destination N/A');
                    return (
                      <tr key={event.move_id} style={styles.tableBodyRow}>
                        {/* Removed Event ID data cell */}
                        <td style={styles.tableBodyCell}>{event.license_name ?? 'N/A'}</td>
                        <td style={styles.tableBodyCell}>{event.license_key ?? 'N/A'}</td>
                        <td style={styles.tableBodyCell}>{event.from_pc_name ?? '-'}</td>
                        <td style={styles.tableBodyCell}>{event.to_pc_name ?? '-'}</td>
                        {/* <td style={styles.tableBodyCell}>{event.from_vm_name ?? '-'}</td> */}
                        {/* <td style={styles.tableBodyCell}>{event.to_vm_name ?? '-'}</td> */}
                        <td style={styles.tableBodyCell}>{event.event_timestamp ? new Date(event.event_timestamp).toLocaleString() : '-'}</td>
                        {/* <td style={styles.tableBodyCell}>{event.changed_by || '-'}</td> */}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
} 