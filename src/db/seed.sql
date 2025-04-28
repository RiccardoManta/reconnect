-- Seed data for Reconnect Database (Based on schema.sql)
-- Order is important due to foreign key constraints.

-- 1. users (IDs: 1, 2, 3)
INSERT INTO users (user_name, contact_info) VALUES
('Alice Wonderland', 'alice.wonder@example.com'),
('Bob The Builder', 'bob.builder@example.com'),
('Charlie Chaplin', 'charlie.chap@example.com');

-- 2. projects (IDs: 1, 2, 3)
INSERT INTO projects (project_number, project_name) VALUES
('P2024-01', 'Autonomous Braking System'),
('P2023-15', 'NextGen Infotainment'),
('P2025-05', 'EV Powertrain Control');

-- 3. software (IDs: 1, 2, 3, 4, 5, 6)
INSERT INTO software (software_name, major_version, vendor) VALUES
('ControlDesk', '8.1', 'dSPACE'),
('AutomationDesk', '7.0', 'dSPACE'),
('CANoe', '16 SP3', 'Vector'),
('Python', '3.10', 'Python Software Foundation'),
('Simulink', 'R2024a', 'MathWorks'),
('Docker Desktop', '4.28', 'Docker Inc.');

-- 4. model_stands (IDs: 1, 2, 3)
INSERT INTO model_stands (model_name, svn_link, features) VALUES
('GenericABSModel', 'svn://server/models/abs/trunk', 'Basic ABS logic simulation'),
('ME7_EngineModel', 'svn://server/models/engine/me7_v2', 'Includes Turbocharger dynamics'),
('InfotainmentUI_Sim', 'git@server:models/ui_sim.git', 'HMI interaction simulation');

-- 5. vm_instances (IDs: 1, 2, 3)
INSERT INTO vm_instances (vm_name, vm_address) VALUES
('VM-BuildServer-01', '10.1.1.100'),
('VM-LicenseServer-FlexLM', '10.1.1.101'),
('VM-SimTarget-Linux', '192.168.50.5');

-- 6. test_benches (IDs: 1, 2, 3)
INSERT INTO test_benches (hil_name, pp_number, system_type, bench_type, acquisition_date, usage_period, user_id, project_id, location, inventory_number, eplan) VALUES
('HIL-Fullsize-01', 'PP001', 'SCLX', 'Fullsize Braking', '2022-05-10', 'Long Term', 1, 1, 'Lab A, Rack 3', 'INV-HIL-001', 'EPL-HIL001.pdf'),
('HIL-Midsize-01', 'PP002', 'PHS', 'Midsize Infotainment', '2023-01-20', 'Project Specific', 2, 2, 'Lab B, Desk 1', 'INV-HIL-002', 'EPL-HIL002.pdf'),
('HIL-Compact-01', 'PP003', 'SCLX', 'Compact Powertrain', '2024-03-15', 'Short Term', 3, 3, 'Lab A, Rack 4', 'INV-HIL-003', 'EPL-HIL003.pdf');

-- 7. wetbenches (IDs: 1, 2, 3)
INSERT INTO wetbenches (wetbench_name, pp_number, owner, system_type, platform, system_supplier, linked_bench_id, actuator_info, hardware_components, inventory_number) VALUES
('WB-BrakeCalipers-Gen1', 'WB001', 'IAV', 'Hydraulic', 'MQB', 'Supplier A', 1, '4x Caliper Actuators', 'Pressure sensors, Valves', 'INV-WB-001'),
('WB-SpeakerSystem-XYZ', 'WB002', 'VW', 'Audio', 'MEB', 'Supplier B', 2, 'Amplifier, 6x Speakers', 'CAN interface, Power Supply', 'INV-WB-002'),
('WB-MotorInverter-Alpha', 'WB003', 'IAV', 'Electric Drive', 'PPE', 'Supplier C', 3, 'Inverter, Resolver Simulator', 'High Voltage DC, Cooling Unit', 'INV-WB-003');

-- 8. pc_overview (IDs: 1, 2, 3, 4)
INSERT INTO pc_overview (bench_id, pc_name, casual_name, purchase_year, inventory_number, pc_role, pc_model, special_equipment, mac_address, ip_address, pc_info_text, status, active_user) VALUES
(1, 'PC-HIL001-HOST', 'HIL01-Host', 2022, 'PCINV001', 'Host-PC', 'Dell Precision 7920', 'Dual Xeon Silver, 128GB RAM', '00:1A:2B:3C:4D:01', '192.168.1.10', 'Main control PC for HIL-Fullsize-01', 'online', 'Alice Wonderland'),
(1, 'PC-HIL001-COMP', 'HIL01-Compile', 2022, 'PCINV002', 'Compiler-PC', 'HP Z8 G4', '12-core CPU, 64GB RAM', '00:1A:2B:3C:4D:02', '192.168.1.11', 'Dedicated compiler for Project Alpha', 'online', NULL),
(2, 'PC-HIL002-HOST', 'HIL02-Host', 2023, 'PCINV003', 'Host-PC', 'Lenovo P620', 'Threadripper Pro, 64GB RAM', '00:1A:2B:3C:4D:03', '192.168.2.10', 'Control PC for Midsize Infotainment HIL', 'offline', NULL),
(NULL, 'PC-BOB-LAPTOP', 'BobLaptop', 2023, 'PCINV004', 'User Laptop', 'Dell XPS 15', 'OLED Screen', '00:1A:2B:3C:4D:04', '192.168.1.50', 'Bob Builders primary laptop', 'in_use', 'Bob The Builder');

-- 9. test_bench_project_overview (linking to bench_ids 1, 2, 3)
INSERT INTO test_bench_project_overview (bench_id, platform, system_supplier, hardware, software, model_version, ticket_notes) VALUES
(1, 'MQB', 'Conti', 'SCALEXIO, FIU, IO Cards', 'ControlDesk, AutomationDesk', 'ABS_v3.1', 'Requires specific CAN config'),
(2, 'MEB', 'Harman', 'PHS Base, CAN/LIN Cards', 'CANoe, ControlDesk', 'UI_v1.5', 'Check power sequence'),
(3, 'PPE', 'Bosch', 'SCALEXIO, E-Motor Interface', 'ControlDesk, Simulink', 'MotorCtrl_v2.0', 'High voltage safety required');

-- 10. hil_technology (linking to bench_ids 1, 2, 3)
INSERT INTO hil_technology (bench_id, fiu_info, io_info, can_interface, power_interface, possible_tests, leakage_module) VALUES
(1, 'dSPACE FIU E', '10x Analog In, 8x Digital Out', '5x CAN FD Channels', 'Programmable PSU 0-60V', 'ABS/ESC Tests, Sensor Failure Sim', 'LM-01'),
(2, 'None', '4x Analog Out, 16x Digital In', '2x CAN, 4x LIN Channels', 'Standard 12V Automotive', 'HMI Tests, Bus Communication Tests', NULL),
(3, 'dSPACE FIU Compact', 'Resolver Input, HighSpeed DIO', '3x CAN FD, 1x Ethernet', 'High Voltage DC Source', 'Inverter Control Tests, HV Safety Tests', 'LM-02');

-- 11. hil_operation (linking to bench_ids 1, 2, 3)
INSERT INTO hil_operation (bench_id, possible_tests, vehicle_datasets, scenarios, controldesk_projects) VALUES
(1, 'Braking maneuvers, Stability tests', 'VW Passat B8 Dataset', 'Mu-split braking, Emergency stop', 'B8_ABS_Tests.cdp'),
(2, 'Cluster interaction, Media playback', 'Audi Q4 e-tron Dataset', 'Startup sequence, User navigation', 'Q4_HMI_Validation.cdp'),
(3, 'Torque control, Efficiency tests', 'Porsche Taycan Dataset', 'Load steps, Fault injection', 'Taycan_Motor_Test.cdp');

-- 12. hardware_installation (linking to bench_ids 1, 2, 3)
INSERT INTO hardware_installation (bench_id, ecu_info, sensors, additional_periphery) VALUES
(1, 'Bosch ABS/ESP Controller Mk100', '4x Wheel speed, 1x Yaw rate, 1x Steering angle', 'Brake pressure sensors'),
(2, 'Harman MIB3 Main Unit, Instrument Cluster', 'Ambient light sensor, GPS Antenna', 'External Speakers, Display Unit'),
(3, 'Bosch Inverter Gen3, VCU', 'Motor temperature, DC Link Voltage/Current', 'E-Motor Dynamometer');

-- 13. pc_software (linking pc_ids 1,2,3,4 and software_ids 1-6)
INSERT INTO pc_software (pc_id, software_id, install_date) VALUES
(1, 1, '2023-01-10'), (1, 2, '2023-01-10'), (1, 5, '2023-02-15'), -- HIL01-Host: CD, AD, Simulink
(2, 5, '2023-01-15'), (2, 4, '2023-01-15'), -- HIL01-Compile: Simulink, Python
(3, 1, '2023-08-01'), (3, 3, '2023-08-05'), -- HIL02-Host: CD, CANoe
(4, 3, '2023-09-01'), (4, 4, '2023-09-01'), (4, 6, '2024-01-01'); -- BobLaptop: CANoe, Python, Docker

-- 14. vm_software (linking vm_ids 1,2,3 and software_ids 1-6)
INSERT INTO vm_software (vm_id, software_id, install_date) VALUES
(1, 4, '2023-05-01'), (1, 6, '2023-05-01'), -- VM-BuildServer: Python, Docker
(2, 1, '2023-06-10'), (2, 2, '2023-06-10'), -- VM-LicenseServer: CD, AD (Placeholder for server component)
(3, 5, '2023-07-15'); -- VM-SimTarget: Simulink

-- 15. licenses (IDs: 1, 2, 3 - using software_ids 1, 3, 5)
INSERT INTO licenses (software_id, license_name, license_description, license_number, dongle_number, maintenance_end, owner, license_type, remarks) VALUES
(1, 'ControlDesk Full License', 'Network license for ControlDesk', 'CD-NET-001', NULL, '2025-12-31', 'Lab Budget', 'Floating', 'Managed by FlexLM on VM-LicenseServer'),
(3, 'CANoe Pro', 'Professional CANoe License with Ethernet Option', 'CAN-PRO-005', 'DGL-VEC-1005', '2024-11-30', 'Project Beta', 'Dongle', 'Dongle assigned to Bob'),
(5, 'Simulink Standard', 'Node-locked Simulink license', 'SL-STD-101', NULL, '2025-03-31', 'Project Alpha', 'Node-Locked', 'Activated on HIL01-Compile');

-- 16. license_assignments (linking license_ids 1,2,3 and pc_ids/vm_ids)
INSERT INTO license_assignments (license_id, pc_id, vm_id, assigned_on) VALUES
(2, 4, NULL, '2023-09-05'), -- CANoe Dongle (LIC-ID 2) assigned to BobLaptop (PC_ID 4)
(3, 2, NULL, '2023-01-20'), -- Simulink Node-Locked (LIC-ID 3) assigned to HIL01-Compile (PC_ID 2)
(1, NULL, 2, '2023-06-15'); -- ControlDesk Network (LIC-ID 1) conceptually assigned to License Server VM (VM_ID 2) 