'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { HardwareMoveEvent, LicenseMoveEvent } from '@/types/database'; // Assuming these types exist
import { RefreshCw, AlertTriangle } from 'lucide-react';

const styles: { [key: string]: CSSProperties } = {
  container: { display: 'flex', flexDirection: 'row', gap: '2rem', padding: '1rem' },
  historySection: { flex: 1, backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1rem' },
  header: { fontSize: '1.25rem', fontWeight: '600', color: '#0F3460', marginBottom: '1rem' },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' },
  tableHeaderCell: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563' },
  tableBodyRow: { borderBottom: '1px solid #e5e7eb' },
  tableBodyCell: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: '#6b7280' },
  loadingSpinner: { animation: 'spin 1s linear infinite', marginBottom: '0.5rem' },
  errorContainer: { textAlign: 'center', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' },
  noDataCell: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
};

export default function ChangeHistoryView() {
  const [hardwareMoves, setHardwareMoves] = useState<HardwareMoveEvent[]>([]);
  const [licenseMoves, setLicenseMoves] = useState<LicenseMoveEvent[]>([]);
  const [loadingHardware, setLoadingHardware] = useState(true);
  const [loadingLicense, setLoadingLicense] = useState(true);
  const [errorHardware, setErrorHardware] = useState<string | null>(null);
  const [errorLicense, setErrorLicense] = useState<string | null>(null);

  useEffect(() => {
    const fetchHardwareMoves = async () => {
      setLoadingHardware(true);
      setErrorHardware(null);
      try {
        const response = await fetch('/api/hardwaremoveevents');
        if (!response.ok) throw new Error('Failed to fetch hardware move events');
        const data = await response.json();
        setHardwareMoves(data.hardware_move_events || []);
      } catch (err) {
        setErrorHardware(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingHardware(false);
      }
    };

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

    fetchHardwareMoves();
    fetchLicenseMoves();
  }, []);

  const renderLoading = () => (
    <div style={styles.loadingContainer}>
      <RefreshCw size={24} style={styles.loadingSpinner} />
      <p style={{ margin: 0 }}>Loading history...</p>
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
      {/* Hardware Change History Section */}
      <div style={styles.historySection}>
        <h2 style={styles.header}>Hardware Change History</h2>
        {loadingHardware ? renderLoading() : errorHardware ? renderError(errorHardware) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeaderCell}>Event ID</th>
                  <th style={styles.tableHeaderCell}>Hardware</th>
                  <th style={styles.tableHeaderCell}>From Bench</th>
                  <th style={styles.tableHeaderCell}>To Bench</th>
                  <th style={styles.tableHeaderCell}>Moved On</th>
                  <th style={styles.tableHeaderCell}>Moved By</th>
                </tr>
              </thead>
              <tbody>
                {hardwareMoves.length === 0 ? (
                  <tr><td colSpan={6} style={styles.noDataCell}>No hardware move events found.</td></tr>
                ) : (
                  hardwareMoves.map((event) => (
                    <tr key={event.move_id} style={styles.tableBodyRow}>
                      <td style={styles.tableBodyCell}>{event.move_id}</td>
                      <td style={styles.tableBodyCell}>{event.hardware_description || event.install_id || 'N/A'}</td>
                      <td style={styles.tableBodyCell}>{event.from_bench_name || 'Source N/A'}</td>
                      <td style={styles.tableBodyCell}>{event.to_bench_name || 'Destination N/A'}</td>
                      <td style={styles.tableBodyCell}>{event.event_timestamp ? new Date(event.event_timestamp).toLocaleString() : '-'}</td>
                      <td style={styles.tableBodyCell}>{event.changed_by || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* License Change History Section */}
      <div style={styles.historySection}>
        <h2 style={styles.header}>License Change History</h2>
        {loadingLicense ? renderLoading() : errorLicense ? renderError(errorLicense) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeaderCell}>Event ID</th>
                  <th style={styles.tableHeaderCell}>License</th>
                  <th style={styles.tableHeaderCell}>From PC/VM</th>
                  <th style={styles.tableHeaderCell}>To PC/VM</th>
                  <th style={styles.tableHeaderCell}>Moved On</th>
                  <th style={styles.tableHeaderCell}>Moved By</th>
                </tr>
              </thead>
              <tbody>
                {licenseMoves.length === 0 ? (
                  <tr><td colSpan={6} style={styles.noDataCell}>No license move events found.</td></tr>
                ) : (
                  licenseMoves.map((event) => {
                    const fromLocation = event.from_pc_name || event.from_vm_name || (event.from_pc_id || event.from_vm_id ? `ID: ${event.from_pc_id || event.from_vm_id}` : 'Source N/A');
                    const toLocation = event.to_pc_name || event.to_vm_name || (event.to_pc_id || event.to_vm_id ? `ID: ${event.to_pc_id || event.to_vm_id}` : 'Destination N/A');
                    return (
                      <tr key={event.move_id} style={styles.tableBodyRow}>
                        <td style={styles.tableBodyCell}>{event.move_id}</td>
                        <td style={styles.tableBodyCell}>{event.license_name || event.license_key || event.license_id || 'N/A'}</td>
                        <td style={styles.tableBodyCell}>{fromLocation}</td>
                        <td style={styles.tableBodyCell}>{toLocation}</td>
                        <td style={styles.tableBodyCell}>{event.event_timestamp ? new Date(event.event_timestamp).toLocaleString() : '-'}</td>
                        <td style={styles.tableBodyCell}>{event.changed_by || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 