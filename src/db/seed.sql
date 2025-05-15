-- Updated Seed data for Reconnect Database (MySQL compatible)
-- Order is important due to foreign key constraints.

-- Clear existing data from tables in reverse order of dependencies
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM group_platform_access;
DELETE FROM license_assignments;
DELETE FROM licenses;
DELETE FROM pc_software;
DELETE FROM vm_software;
DELETE FROM hardware_installations;
DELETE FROM hardware_move_events;
DELETE FROM license_move_events;
DELETE FROM hil_operation;
DELETE FROM hil_technology;
DELETE FROM test_bench_project_overview;
DELETE FROM pc_overview;
DELETE FROM wetbenches;
DELETE FROM bench_capabilities;
DELETE FROM test_benches;
DELETE FROM vm_instances;
DELETE FROM model_stands;
DELETE FROM software;
DELETE FROM projects;
DELETE FROM users;
DELETE FROM platforms;
DELETE FROM user_groups;
DELETE FROM permissions;
DELETE FROM test_station_modules;
DELETE FROM simulation_models;
DELETE FROM signal_chains;
DELETE FROM dut_actuator_signal_acquisition;
DELETE FROM control_buttons;
DELETE FROM power_supplies;
DELETE FROM dut_diagnostics;
SET FOREIGN_KEY_CHECKS = 1;

-- Reset Auto Increment counters
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
ALTER TABLE hardware_installations AUTO_INCREMENT = 1;
ALTER TABLE licenses AUTO_INCREMENT = 1;
ALTER TABLE license_assignments AUTO_INCREMENT = 1;
ALTER TABLE hardware_move_events AUTO_INCREMENT = 1;
ALTER TABLE license_move_events AUTO_INCREMENT = 1;
ALTER TABLE test_station_modules AUTO_INCREMENT = 1;
ALTER TABLE simulation_models AUTO_INCREMENT = 1;
ALTER TABLE signal_chains AUTO_INCREMENT = 1;
ALTER TABLE dut_actuator_signal_acquisition AUTO_INCREMENT = 1;
ALTER TABLE control_buttons AUTO_INCREMENT = 1;
ALTER TABLE power_supplies AUTO_INCREMENT = 1;
ALTER TABLE dut_diagnostics AUTO_INCREMENT = 1;

-- 1. permissions (IDs: 1=Default, 2=Read, 3=Edit, 4=Admin)
INSERT INTO permissions (permission_name) VALUES
('Default'), ('Read'), ('Edit'), ('Admin');

-- 2. platforms (IDs: 1='MQB', 2='MEB', 3='PPE')
INSERT INTO platforms (platform_name) VALUES
('MQB'), ('MEB'), ('PPE');

-- 3. user_groups (Permissions IDs: 1=Default, 2=Read, 3=Edit, 4=Admin)
INSERT INTO user_groups (user_group_name, permission_id) VALUES
('Admin', 4), ('User', 2), ('MQB Editor', 3);

-- 4. users (Assigning user_group_id)
INSERT INTO users (user_name, company_username, email, password_hash, salt, user_group_id) VALUES
('Alice Wonderland', 'alice.w', 'alice.wonder@example.com', 'dummy_hash_alice', 'dummy_salt_alice', 1),
('Bob The Builder', 'bob.b', 'bob.builder@example.com', 'dummy_hash_bob', 'dummy_salt_bob', 2),
('Charlie Chaplin', 'charlie.c', 'charlie.chap@example.com', 'dummy_hash_charlie', 'dummy_salt_charlie', 3);

-- 5. projects (IDs: 1, 2, 3)
INSERT INTO projects (project_number, project_name) VALUES
('P2024-01', 'Autonomous Braking System'),
('P2023-15', 'NextGen Infotainment'),
('P2025-05', 'EV Powertrain Control');

-- 6. software (IDs: 1-6)
INSERT INTO software (software_name, major_version, vendor) VALUES
('ControlDesk', '8.1', 'dSPACE'), ('AutomationDesk', '7.0', 'dSPACE'), ('CANoe', '16 SP3', 'Vector'),
('Python', '3.10', 'Python Software Foundation'), ('Simulink', 'R2024a', 'MathWorks'), ('Docker Desktop', '4.28', 'Docker Inc.');

-- 7. model_stands (IDs: 1, 2, 3)
INSERT INTO model_stands (model_name, svn_link, features) VALUES
('GenericABSModel', 'svn://server/models/abs/trunk', 'Basic ABS logic simulation'),
('ME7_EngineModel', 'svn://server/models/engine/me7_v2', 'Includes Turbocharger dynamics'),
('InfotainmentUI_Sim', 'git@server:models/ui_sim.git', 'HMI interaction simulation');

-- 8. vm_instances (IDs: 1, 2, 3)
INSERT INTO vm_instances (vm_name, vm_address) VALUES
('VM-BuildServer-01', '10.1.1.100'), ('VM-LicenseServer-FlexLM', '10.1.1.101'), ('VM-SimTarget-Linux', '192.168.50.5');

-- 9. test_benches (IDs: 1, 2, 3) - Updated structure
INSERT INTO test_benches (hil_name, pp_number, system_type, bench_type, acquisition_date, usage_period, project_id, location, inventory_number, eplan, manufacturer, bench_generation, purchase_price, project_contact, model_id) VALUES
('HIL-Fullsize-01', 'PP001', 'SCLX', 'Fullsize Braking', '2022-05-10', 'Long Term', 1, 'Lab A, Rack 3', 'INV-HIL-001', 'EPL-HIL001.pdf', 'dSPACE', 'Gen5', 75000.00, 'project.alpha@example.com', 1),
('HIL-Midsize-01', 'PP002', 'PHS', 'Midsize Infotainment', '2023-01-20', 'Project Specific', 2, 'Lab B, Desk 1', 'INV-HIL-002', 'EPL-HIL002.pdf', 'Vector', 'VT-System Gen3', 45000.00, 'project.beta@example.com', 2),
('HIL-Compact-01', 'PP003', 'SCLX', 'Compact Powertrain', '2024-03-15', 'Short Term', 3, 'Lab A, Rack 4', 'INV-HIL-003', 'EPL-HIL003.pdf', 'NI', 'SLSC based', 30000.00, 'project.gamma@example.com', 3);

-- Optional: bench_capabilities (Example)
-- INSERT INTO bench_capabilities (bench_id, capability_name) VALUES
-- (1, 'CAN-FD'), (1, 'SENT'), (2, 'Ethernet DOIP');


-- 10. wetbenches (IDs: 1, 2, 3) - Removed 'platform' column
INSERT INTO wetbenches (wetbench_name, pp_number, owner, system_type, system_supplier, linked_bench_id, actuator_info, hardware_components, inventory_number) VALUES
('WB-BrakeCalipers-Gen1', 'WB001', 'IAV', 'Hydraulic', 'Supplier A', 1, '4x Caliper Actuators', 'Pressure sensors, Valves', 'INV-WB-001'),
('WB-SpeakerSystem-XYZ', 'WB002', 'VW', 'Audio', 'Supplier B', 2, 'Amplifier, 6x Speakers', 'CAN interface, Power Supply', 'INV-WB-002'),
('WB-MotorInverter-Alpha', 'WB003', 'IAV', 'Electric Drive', 'Supplier C', 3, 'Inverter, Resolver Simulator', 'High Voltage DC, Cooling Unit', 'INV-WB-003');

-- 11. pc_overview (IDs: 1, 2, 3, 4)
INSERT INTO pc_overview (bench_id, pc_name, casual_name, purchase_year, inventory_number, pc_role, pc_model, special_equipment, mac_address, ip_address, pc_info_text, status, active_user) VALUES
(1, 'PC-HIL001-HOST', 'HIL01-Host', 2022, 'PCINV001', 'Host-PC', 'Dell Precision 7920', 'Dual Xeon Silver, 128GB RAM', '00:1A:2B:3C:4D:01', '192.168.1.10', 'Main control PC for HIL-Fullsize-01', 'online', 'Alice Wonderland'),
(1, 'PC-HIL001-COMP', 'HIL01-Compile', 2022, 'PCINV002', 'Compiler-PC', 'HP Z8 G4', '12-core CPU, 64GB RAM', '00:1A:2B:3C:4D:02', '192.168.1.11', 'Dedicated compiler for Project Alpha', 'online', NULL),
(2, 'PC-HIL002-HOST', 'HIL02-Host', 2023, 'PCINV003', 'Host-PC', 'Lenovo P620', 'Threadripper Pro, 64GB RAM', '00:1A:2B:3C:4D:03', '192.168.2.10', 'Control PC for Midsize Infotainment HIL', 'offline', NULL),
(NULL, 'PC-BOB-LAPTOP', 'BobLaptop', 2023, 'PCINV004', 'User Laptop', 'Dell XPS 15', 'OLED Screen', '00:1A:2B:3C:4D:04', '192.168.1.50', 'Bob Builders primary laptop', 'in_use', 'Bob The Builder');

-- 12. test_bench_project_overview (linking to bench_ids 1, 2, 3 using platform_id, added wetbench_id)
-- Platform IDs: 1='MQB', 2='MEB', 3='PPE' ; Wetbench IDs: 1, 2, 3
INSERT INTO test_bench_project_overview (bench_id, platform_id, wetbench_id, system_supplier, wetbench_info, actuator_info, hardware, software, model_version, ticket_notes) VALUES
(1, 1, 1, 'Conti', 'WB-BrakeCalipers-Gen1 used', 'Standard caliper actuators', 'SCALEXIO, FIU, IO Cards', 'ControlDesk, AutomationDesk', 'ABS_v3.1', 'Requires specific CAN config'),
(2, 2, 2, 'Harman', 'WB-SpeakerSystem-XYZ used', 'Audio system actuators', 'PHS Base, CAN/LIN Cards', 'CANoe, ControlDesk', 'UI_v1.5', 'Check power sequence'),
(3, 3, 3, 'Bosch', 'WB-MotorInverter-Alpha used', 'E-Motor inverter', 'SCALEXIO, E-Motor Interface', 'ControlDesk, Simulink', 'MotorCtrl_v2.0', 'High voltage safety required');

-- 13. hil_technology (linking to bench_ids 1, 2, 3)
INSERT INTO hil_technology (bench_id, fiu_info, io_info, can_interface, power_interface, possible_tests, leakage_module) VALUES
(1, 'dSPACE FIU E', '10x Analog In, 8x Digital Out', '5x CAN FD Channels', 'Programmable PSU 0-60V', 'ABS/ESC Tests, Sensor Failure Sim', 'LM-01'),
(2, 'None', '4x Analog Out, 16x Digital In', '2x CAN, 4x LIN Channels', 'Standard 12V Automotive', 'HMI Tests, Bus Communication Tests', NULL),
(3, 'dSPACE FIU Compact', 'Resolver Input, HighSpeed DIO', '3x CAN FD, 1x Ethernet', 'High Voltage DC Source', 'Inverter Control Tests, HV Safety Tests', 'LM-02');

-- 14. hil_operation (linking to bench_ids 1, 2, 3)
INSERT INTO hil_operation (bench_id, possible_tests, vehicle_datasets, scenarios, controldesk_projects) VALUES
(1, 'Braking maneuvers, Stability tests', 'VW Passat B8 Dataset', 'Mu-split braking, Emergency stop', 'B8_ABS_Tests.cdp'),
(2, 'Cluster interaction, Media playback', 'Audi Q4 e-tron Dataset', 'Startup sequence, User navigation', 'Q4_HMI_Validation.cdp'),
(3, 'Torque control, Efficiency tests', 'Porsche Taycan Dataset', 'Load steps, Fault injection', 'Taycan_Motor_Test.cdp');

-- hardware_group_types are inserted by schema.sql. Example IDs: ECU=6, Sensor Emulation=10, Additional Periphery=12
-- Make sure these IDs correspond to what schema.sql inserts.
-- Example IDs from schema.sql: 'ECU' (6), 'Sensor Emulation' (10), 'Additional Periphery' (12)

-- 15. hardware_installations (Replaces hardware_installation - linking to bench_ids 1, 2, 3 and hardware_group_type_ids)
INSERT INTO hardware_installations (hardware_group_id, bench_id, description, hardware_number, part_number, software_version, manufacturer, installation_date) VALUES
(6, 1, 'Bosch ABS/ESP Controller Mk100', 'HW-ABS-001', 'PN-ABS-123', 'SW_v5.2.1', 'Bosch', '2023-01-15'),
(10, 1, 'Wheel speed sensors (Front Left)', 'HW-WSS-FL-001', 'PN-WSS-456', 'N/A', 'Conti', '2023-01-15'),
(12, 2, 'External Display Unit for MIB3', 'HW-DISP-001', 'PN-DISP-789', 'FW_v1.2', 'LG', '2023-03-20');

-- 16. pc_software (linking pc_ids 1,2,3,4 and software_ids 1-6)
INSERT INTO pc_software (pc_id, software_id, install_date) VALUES
(1, 1, '2023-01-10'), (1, 2, '2023-01-10'), (1, 5, '2023-02-15'),
(2, 5, '2023-01-15'), (2, 4, '2023-01-15'),
(3, 1, '2023-08-01'), (3, 3, '2023-08-05'),
(4, 3, '2023-09-01'), (4, 4, '2023-09-01'), (4, 6, '2024-01-01');

-- 17. vm_software (linking vm_ids 1,2,3 and software_ids 1-6)
INSERT INTO vm_software (vm_id, software_id, install_date) VALUES
(1, 4, '2023-05-01'), (1, 6, '2023-05-01'),
(2, 1, '2023-06-10'), (2, 2, '2023-06-10'),
(3, 5, '2023-07-15');

-- 18. licenses (IDs: 1, 2, 3 - using software_ids 1, 3, 5)
INSERT INTO licenses (software_id, license_name, license_description, license_number, dongle_number, maintenance_end, owner, license_type, remarks) VALUES
(1, 'ControlDesk Full License', 'Network license for ControlDesk', 'CD-NET-001', NULL, '2025-12-31', 'Lab Budget', 'Floating', 'Managed by FlexLM on VM-LicenseServer'),
(3, 'CANoe Pro', 'Professional CANoe License with Ethernet Option', 'CAN-PRO-005', 'DGL-VEC-1005', '2024-11-30', 'Project Beta', 'Dongle', 'Dongle assigned to Bob'),
(5, 'Simulink Standard', 'Node-locked Simulink license', 'SL-STD-101', NULL, '2025-03-31', 'Project Alpha', 'Node-Locked', 'Activated on HIL01-Compile');

-- 19. license_assignments (Links licenses to pc_id/vm_id)
-- Assuming we assign some licenses to PCs for seeding purposes.
-- The old seed data had bench_id, install_date, install_notes.
-- We need to adapt this to pc_id/vm_id and assigned_on.
-- For now, let's create a placeholder INSERT and then refine it.

INSERT INTO license_assignments (license_id, pc_id, assigned_on) VALUES
(1, 1, '2023-01-15'), -- Example: License 1 assigned to PC 1
(2, 2, '2023-02-20'), -- Example: License 2 assigned to PC 2
(3, 1, '2023-03-10'); -- Example: License 3 also assigned to PC 1
-- Add more sample assignments as needed, ensuring pc_id/vm_id exist.
-- If a license is for a VM, use (license_id, vm_id, assigned_on) with pc_id as NULL.

-- 20. group_platform_access (Link groups to platforms)
-- Group IDs: 1='Admin', 2='User', 3='MQB Editor'
-- Platform IDs: 1='MQB', 2='MEB', 3='PPE'
INSERT INTO group_platform_access (user_group_id, platform_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2),
(3, 1);

-- Seed data for new descriptive tables (examples)
INSERT INTO test_station_modules (add_on_modules, pedal_actuator) VALUES
('High-Precision ADC module, SENT-to-CAN Converter', 'Linear Actuator Type A'),
('None', 'Rotary Actuator Type B');

INSERT INTO simulation_models (environment_model, driver_model, vehicle_model, base_vehicle_model, brake_system, propulsion_system, suspension_system, steering_system, vertical_dynamics_system, vehicle_control_system, infotainment_system, adas_system, energy_system) VALUES
('Standard Road Network v2.1', 'Aggressive Driver Profile', 'VW Golf 8 Full Vehicle', 'Golf 8 Base', 'ABS/ESP Mk100', 'TSI 1.5L EA211', 'MacPherson/Multi-link', 'EPS APA Gen2', 'Skyhook Basic', 'VCU Golf 8', 'MIB 3.1', 'ACC/LKA Gen3', '12V Lead-Acid Start-Stop');

INSERT INTO signal_chains (io_models, peripheral_hw, wetbench, hcu_emulation, epb, buttons, rdz_sensor, test_modules, diagnostic_modules) VALUES
('dSPACE IO Board DS2201', 'Custom Breakout Box v3', 'WB-BrakeCalipers-Gen1', 'HCU Emulation Card v1.2', 'EPB Actuator Interface', 'Standard Button Panel', 'RDZ Sensor Interface v2', 'ADC Module', 'OBD-II Interface');

INSERT INTO dut_actuator_signal_acquisition (epg, measurement, pump_control, valve_currents) VALUES
('EPG Module Type X', 'Current & Voltage Sensors', 'PWM Pump Controller', 'High-Side Driver Array');

INSERT INTO control_buttons (esc_button, auto_hold_button, epb_button) VALUES
('ESC_OFF_Signal_Path', 'AUTOHOLD_Signal_Path', 'EPB_Applied_Signal_Path');

INSERT INTO power_supplies (power_supply, fiu) VALUES
('EA PS 9080-170', 'dSPACE FIU E'), ('GW Instek GPE-4323', 'None');

INSERT INTO dut_diagnostics (odis, internal_dut_values) VALUES
('ODIS Service v23.1', 'DTC_List, Measurement_Blocks_001-010'), ('ODIS Engineering v11.0', 'Adaptation_Channels_HVAC');

-- History tables (hardware_move_events, license_move_events) are populated by triggers, no direct seed data needed.

COMMIT; 