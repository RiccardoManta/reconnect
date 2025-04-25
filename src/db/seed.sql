-- Dummy Data for Reconnect Database

-- Users
INSERT INTO users (user_name, contact_info) VALUES
('Alice Wonderland', 'alice.wonder@example.com'),
('Bob The Builder', 'bob.builder@example.com'),
('Charlie Chaplin', 'charlie.chap@example.com');

-- Projects
INSERT INTO projects (project_number, project_name) VALUES
('P1001', 'Project Alpha'),
('P1002', 'Project Beta'),
('P1003', 'Project Gamma');

-- Software Catalog
INSERT INTO software (software_name, major_version, vendor) VALUES
('MATLAB', 'R2023a', 'MathWorks'),
('Simulink', 'R2023a', 'MathWorks'),
('ControlDesk', '7.5', 'dSPACE'),
('AutomationDesk', '6.2', 'dSPACE'),
('CANoe', '15.0', 'Vector'),
('Python', '3.11', 'Python Software Foundation');

-- Test Benches
INSERT INTO test_benches (hil_name, pp_number, system_type, bench_type, user_id, project_id, location, inventory_number) VALUES
('HIL-Rack-01', 'PP001', 'SCLX', 'Fullsize', 1, 1, 'Lab A', 'INV001'),
('HIL-Rack-02', 'PP002', 'PHS', 'Midsize', 2, 1, 'Lab B', 'INV002'),
('HIL-Desk-01', 'PP003', 'SCLX', 'Compact', 1, 2, 'Lab A', 'INV003');

-- PC Overview
INSERT INTO pc_overview (bench_id, pc_name, casual_name, purchase_year, inventory_number, pc_role, pc_model, ip_address, status, active_user) VALUES
(1, 'HOSTPC-01', 'AlphaHost', 2022, 'PCINV001', 'Host-PC', 'Dell Precision 7920', '192.168.1.10', 'Online', 'Alice Wonderland'),
(1, 'COMPPC-01', 'AlphaCompile', 2022, 'PCINV002', 'Compiler-PC', 'HP Z8 G4', '192.168.1.11', 'Online', 'Alice Wonderland'),
(2, 'HOSTPC-02', 'BetaHost', 2023, 'PCINV003', 'Host-PC', 'Dell Precision 5820', '192.168.1.20', 'Offline', NULL),
(NULL, 'LAPTOP-01', 'BobLaptop', 2023, 'PCINV004', 'User Laptop', 'Lenovo ThinkPad P1', '10.0.0.5', 'Online', 'Bob The Builder');

-- VM Instances
INSERT INTO vm_instances (vm_name, vm_address) VALUES
('VM-ToolServer', '192.168.1.50'),
('VM-SimTarget', '192.168.1.51'),
('VM-Utility', '10.0.0.10');

-- Licenses
INSERT INTO licenses (software_id, license_name, license_number, maintenance_end, owner, license_type) VALUES
(1, 'MATLAB Campus License', 'LIC-MAT-001', '2024-12-31', 'University Budget', 'Floating'),
(3, 'ControlDesk Network', 'LIC-CD-001', '2025-06-30', 'Project Alpha', 'Floating'),
(3, 'ControlDesk NodeLocked', 'LIC-CD-002', '2025-06-30', 'Project Alpha', 'Node-Locked'),
(5, 'CANoe Standard', 'LIC-CAN-001', '2024-09-30', 'Project Beta', 'Dongle');

-- PC Software Assignments (Linking Table)
-- PC 1 (AlphaHost) has MATLAB, Simulink, ControlDesk
INSERT INTO pc_software (pc_id, software_id, install_date) VALUES
(1, 1, '2023-01-15'),
(1, 2, '2023-01-15'),
(1, 3, '2023-02-01');
-- PC 2 (AlphaCompile) has MATLAB
INSERT INTO pc_software (pc_id, software_id, install_date) VALUES
(2, 1, '2023-01-20');
-- PC 4 (BobLaptop) has Python, CANoe
INSERT INTO pc_software (pc_id, software_id, install_date) VALUES
(4, 6, '2023-05-01'),
(4, 5, '2023-06-10');

-- VM Software Assignments (Linking Table)
-- VM 1 (ToolServer) has ControlDesk, AutomationDesk
INSERT INTO vm_software (vm_id, software_id, install_date) VALUES
(1, 3, '2023-03-01'),
(1, 4, '2023-03-01');
-- VM 2 (SimTarget) has Simulink
INSERT INTO vm_software (vm_id, software_id, install_date) VALUES
(2, 2, '2023-04-01');

-- License Assignments (Linking Table)
-- License 3 (NodeLocked CD) assigned to PC 1 (AlphaHost)
INSERT INTO license_assignments (license_id, pc_id, vm_id, assigned_on) VALUES
(3, 1, NULL, '2023-02-05');
-- License 4 (CANoe Dongle) assigned to PC 4 (BobLaptop) 
INSERT INTO license_assignments (license_id, pc_id, vm_id, assigned_on) VALUES
(4, 4, NULL, '2023-06-15');
-- License 2 (Network CD) assigned to VM 1 (ToolServer) - Example
INSERT INTO license_assignments (license_id, pc_id, vm_id, assigned_on) VALUES
(2, NULL, 1, '2023-03-05');

-- Add 1-2 entries for other tables for basic population (optional)
INSERT INTO model_stands (model_name, svn_link) VALUES ('GenericBrakingModel', 'svn://server/models/brake/trunk');
INSERT INTO wetbenches (wetbench_name, owner, system_type, linked_bench_id) VALUES ('BrakeHydraulics-1', 'IAV', 'Custom', 1); 