-- Updated Seed data for Reconnect Database (MySQL compatible)
-- Order is important due to foreign key constraints.

-- Clear existing data from tables in reverse order of dependencies
-- (Optional but recommended for repeatable seeding)
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM group_platform_access;
DELETE FROM license_assignments;
DELETE FROM licenses;
DELETE FROM pc_software;
DELETE FROM vm_software;
DELETE FROM hardware_installation;
DELETE FROM hil_operation;
DELETE FROM hil_technology;
DELETE FROM test_bench_project_overview;
DELETE FROM pc_overview;
DELETE FROM wetbenches;
DELETE FROM test_benches;
DELETE FROM vm_instances;
DELETE FROM model_stands;
DELETE FROM software;
DELETE FROM projects;
DELETE FROM users;
DELETE FROM platforms;
DELETE FROM user_groups;
DELETE FROM permissions;
SET FOREIGN_KEY_CHECKS = 1;

-- Reset Auto Increment counters (Optional)
ALTER TABLE permissions AUTO_INCREMENT = 1;
ALTER TABLE user_groups AUTO_INCREMENT = 1;
ALTER TABLE platforms AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE projects AUTO_INCREMENT = 1;
ALTER TABLE software AUTO_INCREMENT = 1;
ALTER TABLE model_stands AUTO_INCREMENT = 1;
ALTER TABLE vm_instances AUTO_INCREMENT = 1;
ALTER TABLE test_benches AUTO_INCREMENT = 1;
ALTER TABLE wetbenches AUTO_INCREMENT = 1;
ALTER TABLE pc_overview AUTO_INCREMENT = 1;
ALTER TABLE test_bench_project_overview AUTO_INCREMENT = 1;
ALTER TABLE hil_technology AUTO_INCREMENT = 1;
ALTER TABLE hil_operation AUTO_INCREMENT = 1;
ALTER TABLE hardware_installation AUTO_INCREMENT = 1;
ALTER TABLE licenses AUTO_INCREMENT = 1;
ALTER TABLE license_assignments AUTO_INCREMENT = 1;

-- 1. permissions (Order is important for IDs used later)
INSERT INTO permissions (permission_name) VALUES
('Default'), -- ID: 1
('Read'),    -- ID: 2
('Edit'),    -- ID: 3
('Admin');   -- ID: 4

-- 2. platforms (IDs: 1='MQB', 2='MEB', 3='PPE')
INSERT INTO platforms (platform_name) VALUES
('MQB'),
('MEB'),
('PPE');

-- 3. user_groups (Assign permission_id)
-- Permissions IDs: 1=Default, 2=Read, 3=Edit, 4=Admin
INSERT INTO user_groups (user_group_name, permission_id) VALUES
('Admin', 4),      -- Give Admin group Admin permission
('User', 2),       -- Give User group Read permission
('MQB Editor', 3); -- Give MQB Editor group Edit permission

-- 4. users (Assigning user_group_id, adding required email/password/salt)
-- IMPORTANT: Replace password_hash and salt with actual secure values in a real application!
INSERT INTO users (user_name, company_username, email, password_hash, salt, user_group_id) VALUES
('Alice Wonderland', 'alice.w', 'alice.wonder@example.com', 'dummy_hash_alice', 'dummy_salt_alice', 1), -- Admin Group
('Bob The Builder', 'bob.b', 'bob.builder@example.com', 'dummy_hash_bob', 'dummy_salt_bob', 2),       -- User Group
('Charlie Chaplin', 'charlie.c', 'charlie.chap@example.com', 'dummy_hash_charlie', 'dummy_salt_charlie', 3); -- MQB Editor Group

-- 5. projects (Same as before - IDs: 1, 2, 3)
INSERT INTO projects (project_number, project_name) VALUES
('P2024-01', 'Autonomous Braking System'),
('P2023-15', 'NextGen Infotainment'),
('P2025-05', 'EV Powertrain Control');

-- 6. software (Same as before - IDs: 1, 2, 3, 4, 5, 6)
INSERT INTO software (software_name, major_version, vendor) VALUES
('ControlDesk', '8.1', 'dSPACE'),
('AutomationDesk', '7.0', 'dSPACE'),
('CANoe', '16 SP3', 'Vector'),
('Python', '3.10', 'Python Software Foundation'),
('Simulink', 'R2024a', 'MathWorks'),
('Docker Desktop', '4.28', 'Docker Inc.');

-- 7. model_stands (Same as before - IDs: 1, 2, 3)
INSERT INTO model_stands (model_name, svn_link, features) VALUES
('GenericABSModel', 'svn://server/models/abs/trunk', 'Basic ABS logic simulation'),
('ME7_EngineModel', 'svn://server/models/engine/me7_v2', 'Includes Turbocharger dynamics'),
('InfotainmentUI_Sim', 'git@server:models/ui_sim.git', 'HMI interaction simulation');

-- 8. vm_instances (Same as before - IDs: 1, 2, 3)
INSERT INTO vm_instances (vm_name, vm_address) VALUES
('VM-BuildServer-01', '10.1.1.100'),
('VM-LicenseServer-FlexLM', '10.1.1.101'),
('VM-SimTarget-Linux', '192.168.50.5');

-- 9. test_benches (Same as before - IDs: 1, 2, 3)
INSERT INTO test_benches (hil_name, pp_number, system_type, bench_type, acquisition_date, usage_period, user_id, project_id, location, inventory_number, eplan) VALUES
('HIL-Fullsize-01', 'PP001', 'SCLX', 'Fullsize Braking', '2022-05-10', 'Long Term', 1, 1, 'Lab A, Rack 3', 'INV-HIL-001', 'EPL-HIL001.pdf'),
('HIL-Midsize-01', 'PP002', 'PHS', 'Midsize Infotainment', '2023-01-20', 'Project Specific', 2, 2, 'Lab B, Desk 1', 'INV-HIL-002', 'EPL-HIL002.pdf'),
('HIL-Compact-01', 'PP003', 'SCLX', 'Compact Powertrain', '2024-03-15', 'Short Term', 3, 3, 'Lab A, Rack 4', 'INV-HIL-003', 'EPL-HIL003.pdf');

-- 10. wetbenches (Same as before - IDs: 1, 2, 3) - Platform column here still string!
INSERT INTO wetbenches (wetbench_name, pp_number, owner, system_type, platform, system_supplier, linked_bench_id, actuator_info, hardware_components, inventory_number) VALUES
('WB-BrakeCalipers-Gen1', 'WB001', 'IAV', 'Hydraulic', 'MQB', 'Supplier A', 1, '4x Caliper Actuators', 'Pressure sensors, Valves', 'INV-WB-001'),
('WB-SpeakerSystem-XYZ', 'WB002', 'VW', 'Audio', 'MEB', 'Supplier B', 2, 'Amplifier, 6x Speakers', 'CAN interface, Power Supply', 'INV-WB-002'),
('WB-MotorInverter-Alpha', 'WB003', 'IAV', 'Electric Drive', 'PPE', 'Supplier C', 3, 'Inverter, Resolver Simulator', 'High Voltage DC, Cooling Unit', 'INV-WB-003');

-- 11. pc_overview (Same as before - IDs: 1, 2, 3, 4)
INSERT INTO pc_overview (bench_id, pc_name, casual_name, purchase_year, inventory_number, pc_role, pc_model, special_equipment, mac_address, ip_address, pc_info_text, status, active_user) VALUES
(1, 'PC-HIL001-HOST', 'HIL01-Host', 2022, 'PCINV001', 'Host-PC', 'Dell Precision 7920', 'Dual Xeon Silver, 128GB RAM', '00:1A:2B:3C:4D:01', '192.168.1.10', 'Main control PC for HIL-Fullsize-01', 'online', 'Alice Wonderland'),
(1, 'PC-HIL001-COMP', 'HIL01-Compile', 2022, 'PCINV002', 'Compiler-PC', 'HP Z8 G4', '12-core CPU, 64GB RAM', '00:1A:2B:3C:4D:02', '192.168.1.11', 'Dedicated compiler for Project Alpha', 'online', NULL),
(2, 'PC-HIL002-HOST', 'HIL02-Host', 2023, 'PCINV003', 'Host-PC', 'Lenovo P620', 'Threadripper Pro, 64GB RAM', '00:1A:2B:3C:4D:03', '192.168.2.10', 'Control PC for Midsize Infotainment HIL', 'offline', NULL),
(NULL, 'PC-BOB-LAPTOP', 'BobLaptop', 2023, 'PCINV004', 'User Laptop', 'Dell XPS 15', 'OLED Screen', '00:1A:2B:3C:4D:04', '192.168.1.50', 'Bob Builders primary laptop', 'in_use', 'Bob The Builder');

-- 12. test_bench_project_overview (linking to bench_ids 1, 2, 3 using platform_id)
-- Platform IDs: 1='MQB', 2='MEB', 3='PPE'
INSERT INTO test_bench_project_overview (bench_id, platform_id, system_supplier, hardware, software, model_version, ticket_notes) VALUES
(1, 1, 'Conti', 'SCALEXIO, FIU, IO Cards', 'ControlDesk, AutomationDesk', 'ABS_v3.1', 'Requires specific CAN config'),
(2, 2, 'Harman', 'PHS Base, CAN/LIN Cards', 'CANoe, ControlDesk', 'UI_v1.5', 'Check power sequence'),
(3, 3, 'Bosch', 'SCALEXIO, E-Motor Interface', 'ControlDesk, Simulink', 'MotorCtrl_v2.0', 'High voltage safety required');

-- 13. hil_technology (Same as before - linking to bench_ids 1, 2, 3)
INSERT INTO hil_technology (bench_id, fiu_info, io_info, can_interface, power_interface, possible_tests, leakage_module) VALUES
(1, 'dSPACE FIU E', '10x Analog In, 8x Digital Out', '5x CAN FD Channels', 'Programmable PSU 0-60V', 'ABS/ESC Tests, Sensor Failure Sim', 'LM-01'),
(2, 'None', '4x Analog Out, 16x Digital In', '2x CAN, 4x LIN Channels', 'Standard 12V Automotive', 'HMI Tests, Bus Communication Tests', NULL),
(3, 'dSPACE FIU Compact', 'Resolver Input, HighSpeed DIO', '3x CAN FD, 1x Ethernet', 'High Voltage DC Source', 'Inverter Control Tests, HV Safety Tests', 'LM-02');

-- 14. hil_operation (Same as before - linking to bench_ids 1, 2, 3)
INSERT INTO hil_operation (bench_id, possible_tests, vehicle_datasets, scenarios, controldesk_projects) VALUES
(1, 'Braking maneuvers, Stability tests', 'VW Passat B8 Dataset', 'Mu-split braking, Emergency stop', 'B8_ABS_Tests.cdp'),
(2, 'Cluster interaction, Media playback', 'Audi Q4 e-tron Dataset', 'Startup sequence, User navigation', 'Q4_HMI_Validation.cdp'),
(3, 'Torque control, Efficiency tests', 'Porsche Taycan Dataset', 'Load steps, Fault injection', 'Taycan_Motor_Test.cdp');

-- 15. hardware_installation (Same as before - linking to bench_ids 1, 2, 3)
INSERT INTO hardware_installation (bench_id, ecu_info, sensors, additional_periphery) VALUES
(1, 'Bosch ABS/ESP Controller Mk100', '4x Wheel speed, 1x Yaw rate, 1x Steering angle', 'Brake pressure sensors'),
(2, 'Harman MIB3 Main Unit, Instrument Cluster', 'Ambient light sensor, GPS Antenna', 'External Speakers, Display Unit'),
(3, 'Bosch Inverter Gen3, VCU', 'Motor temperature, DC Link Voltage/Current', 'E-Motor Dynamometer');

-- 16. pc_software (Same as before - linking pc_ids 1,2,3,4 and software_ids 1-6)
INSERT INTO pc_software (pc_id, software_id, install_date) VALUES
(1, 1, '2023-01-10'), (1, 2, '2023-01-10'), (1, 5, '2023-02-15'), -- HIL01-Host: CD, AD, Simulink
(2, 5, '2023-01-15'), (2, 4, '2023-01-15'), -- HIL01-Compile: Simulink, Python
(3, 1, '2023-08-01'), (3, 3, '2023-08-05'), -- HIL02-Host: CD, CANoe
(4, 3, '2023-09-01'), (4, 4, '2023-09-01'), (4, 6, '2024-01-01'); -- BobLaptop: CANoe, Python, Docker

-- 17. vm_software (Same as before - linking vm_ids 1,2,3 and software_ids 1-6)
INSERT INTO vm_software (vm_id, software_id, install_date) VALUES
(1, 4, '2023-05-01'), (1, 6, '2023-05-01'), -- VM-BuildServer: Python, Docker
(2, 1, '2023-06-10'), (2, 2, '2023-06-10'), -- VM-LicenseServer: CD, AD (Placeholder for server component)
(3, 5, '2023-07-15'); -- VM-SimTarget: Simulink

-- 18. licenses (Same as before - IDs: 1, 2, 3 - using software_ids 1, 3, 5)
INSERT INTO licenses (software_id, license_name, license_description, license_number, dongle_number, maintenance_end, owner, license_type, remarks) VALUES
(1, 'ControlDesk Full License', 'Network license for ControlDesk', 'CD-NET-001', NULL, '2025-12-31', 'Lab Budget', 'Floating', 'Managed by FlexLM on VM-LicenseServer'),
(3, 'CANoe Pro', 'Professional CANoe License with Ethernet Option', 'CAN-PRO-005', 'DGL-VEC-1005', '2024-11-30', 'Project Beta', 'Dongle', 'Dongle assigned to Bob'),
(5, 'Simulink Standard', 'Node-locked Simulink license', 'SL-STD-101', NULL, '2025-03-31', 'Project Alpha', 'Node-Locked', 'Activated on HIL01-Compile');

-- 19. license_assignments (Same as before - linking license_ids 1,2,3 and pc_ids/vm_ids)
INSERT INTO license_assignments (license_id, pc_id, vm_id, assigned_on) VALUES
(2, 4, NULL, '2023-09-05'), -- CANoe Dongle (LIC-ID 2) assigned to BobLaptop (PC_ID 4)
(3, 2, NULL, '2023-01-20'), -- Simulink Node-Locked (LIC-ID 3) assigned to HIL01-Compile (PC_ID 2)
(1, NULL, 2, '2023-06-15'); -- ControlDesk Network (LIC-ID 1) conceptually assigned to License Server VM (VM_ID 2)

-- 20. group_platform_access (Link groups to platforms)
-- Group IDs: 1='Admin', 2='User', 3='MQB Editor'
-- Platform IDs: 1='MQB', 2='MEB', 3='PPE'
INSERT INTO group_platform_access (user_group_id, platform_id) VALUES
(1, 1), (1, 2), (1, 3), -- Admin: All platforms
(2, 1), (2, 2),          -- User: MQB, MEB
(3, 1);                  -- MQB Editor: MQB 