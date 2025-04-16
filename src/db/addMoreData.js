const dbUtils = require('./dbUtils'); // Reverted to require

// Make the function async
async function addMoreData() {
  try {
    console.log('Adding more sample data to the MySQL database...');
    
    // Add more users
    const usersSql = `
      INSERT INTO users (user_name, contact_info) VALUES
      ('Emma Wilson', 'emma.wilson@example.com'),
      ('Michael Chen', 'michael.chen@example.com'),
      ('Sarah Johnson', 'sarah.johnson@example.com'),
      ('David Martinez', 'david.martinez@example.com'),
      ('Lisa Rodriguez', 'lisa.rodriguez@example.com')
    `;
    await dbUtils.run(usersSql); // Use await
    console.log('Additional users added');
    
    // Add more projects
    const projectsSql = `
      INSERT INTO projects (project_number, project_name) VALUES
      ('P2023-004', 'Autonomous Driving Platform'),
      ('P2023-005', 'EV Battery Management'),
      ('P2023-006', 'Active Suspension System'),
      ('P2023-007', 'Electric Power Steering'),
      ('P2023-008', 'Advanced HMI Testing')
    `;
    await dbUtils.run(projectsSql); // Use await
    console.log('Additional projects added');
    
    // Add more test benches
    const benchesSql = `
      INSERT INTO test_benches (
        hil_name, pp_number, system_type, bench_type, 
        acquisition_date, usage_period, user_id, project_id, 
        location, inventory_number, eplan
      ) VALUES
      ('HIL-AD-04', 'PP4567', 'SCLX', 'Fullsize', '2022-06-15', '36 months', 4, 4, 'Lab D', 'INV-2022-004', 'EP-AD-04'),
      ('HIL-BMS-05', 'PP5678', 'PHS', 'Midsize', '2022-07-20', '24 months', 5, 5, 'Lab E', 'INV-2022-005', 'EP-BMS-05'),
      ('HIL-SUS-06', 'PP6789', 'SCLX', 'Bremssystem', '2022-08-10', '36 months', 6, 6, 'Lab F', 'INV-2022-006', 'EP-SUS-06'),
      ('HIL-EPS-07', 'PP7890', 'PHS', 'Fullsize', '2022-09-15', '24 months', 1, 7, 'Lab G', 'INV-2022-007', 'EP-EPS-07'),
      ('HIL-HMI-08', 'PP8901', 'SCLX', 'Midsize', '2022-10-20', '36 months', 2, 8, 'Lab H', 'INV-2022-008', 'EP-HMI-08')
    `;
    await dbUtils.run(benchesSql); // Use await
    console.log('Additional test benches added');
    
    // Add more test bench project overviews
    const overviewSql = `
      INSERT INTO test_bench_project_overview (
        bench_id, platform, system_supplier, wetbench_info, 
        actuator_info, hardware, software, model_version, ticket_notes
      ) VALUES
      (4, 'Platform D', 'Supplier W', 'Wetbench 4', 'Actuator System 4', 'Hardware v2.2', 'Software v3.5', 'Model v2.3', 'Camera calibration needed'),
      (5, 'Platform E', 'Supplier V', 'Wetbench 5', 'Actuator System 5', 'Hardware v2.5', 'Software v3.7', 'Model v2.4', 'Temperature sensor issues'),
      (6, 'Platform F', 'Supplier U', 'Wetbench 6', 'Actuator System 6', 'Hardware v2.8', 'Software v3.9', 'Model v2.5', 'New test cases added'),
      (7, 'Platform G', 'Supplier T', 'Wetbench 7', 'Actuator System 7', 'Hardware v3.0', 'Software v4.0', 'Model v2.6', 'Updated simulation models'),
      (8, 'Platform H', 'Supplier S', 'Wetbench 8', 'Actuator System 8', 'Hardware v3.2', 'Software v4.1', 'Model v2.7', 'GUI testing framework added')
    `;
    await dbUtils.run(overviewSql); // Use await
    console.log('Additional project overviews added');
    
    // Add more technology info
    const techSql = `
      INSERT INTO hil_technology (
        bench_id, fiu_info, io_info, can_interface, 
        power_interface, possible_tests, leakage_module
      ) VALUES
      (4, 'FIU v3.5', 'DS2217 I/O', 'CAN FD, FlexRay, Ethernet', 'AC/DC Power Module+', 'Camera perception, LiDAR processing', 'LM-3500'),
      (5, 'FIU v3.7', 'DS2219 I/O', 'CAN FD, LIN', 'HV Power Supply', 'Battery cell simulation, thermal management', 'LM-3700'),
      (6, 'FIU v3.8', 'DS2220 I/O', 'CAN, FlexRay', 'DC Power Module', 'Suspension response, damper control', 'LM-3800'),
      (7, 'FIU v4.0', 'DS2225 I/O', 'CAN FD, LIN', 'AC/DC Power Module', 'Steering feel, power assistance', 'LM-4000'),
      (8, 'FIU v4.2', 'DS2230 I/O', 'CAN FD, Ethernet', 'DC Power Supply', 'Display rendering, haptic feedback', 'LM-4200')
    `;
    await dbUtils.run(techSql); // Use await
    console.log('Additional technology information added');
    
    // Add more operation info
    const operationSql = `
      INSERT INTO hil_operation (
        bench_id, possible_tests, vehicle_datasets, 
        scenarios, controldesk_projects
      ) VALUES
      (4, 'Lane detection, object recognition', 'Vehicle G, Vehicle H', 'Urban intersections, highway merging', 'CD-AD-v1, CD-AD-v2'),
      (5, 'Cell balancing, thermal runaway prevention', 'Vehicle I, Vehicle J', 'Fast charging, deep discharge', 'CD-BMS-v1, CD-BMS-v2'),
      (6, 'Ride comfort, body control', 'Vehicle K, Vehicle L', 'Rough road, speed bumps', 'CD-Suspension-v1, CD-Suspension-v2'),
      (7, 'Steering response, torque overlay', 'Vehicle M, Vehicle N', 'Parking, high-speed maneuvering', 'CD-Steering-v1, CD-Steering-v2'),
      (8, 'Display performance, user interaction', 'Vehicle O, Vehicle P', 'Menu navigation, alert response', 'CD-HMI-v1, CD-HMI-v2')
    `;
    await dbUtils.run(operationSql); // Use await
    console.log('Additional operation information added');
    
    // Add more hardware installations
    const hardwareSql = `
      INSERT INTO hardware_installation (
        bench_id, ecu_info, sensors, additional_periphery
      ) VALUES
      (4, 'Autonomous Driving ECU v3.0', 'Camera array, LiDAR, radar sensors', 'GPS simulator, traffic scenario generator'),
      (5, 'Battery Management ECU v2.0', 'Temperature sensors, voltage monitors', 'Cell simulators, load generators'),
      (6, 'Suspension Control ECU v1.5', 'Position sensors, accelerometers', 'Hydraulic actuators, road profile generator'),
      (7, 'EPS ECU v2.2', 'Torque sensors, position encoders', 'Steering force feedback system'),
      (8, 'HMI Control ECU v3.1', 'Touch sensors, optical sensors', 'Display units, haptic feedback generators')
    `;
    await dbUtils.run(hardwareSql); // Use await
    console.log('Additional hardware installation information added');
    
    // Add more PC information
    const pcSql = `
      INSERT INTO pc_overview (
        bench_id, pc_name, purchase_year, inventory_number, 
        pc_role, pc_model, special_equipment, mac_address,
        ip_address, active_licenses, installed_tools
      ) VALUES
      (4, 'PC-AD-01', 2022, 'PC-2022-005', 'Host-PC', 'Dell Precision 7560', 'RTI Card, NVIDIA RTX GPU', '00:1A:2B:3C:4D:8E', '192.168.1.40', 'MATLAB, TensorFlow', 'Matlab, Python, TensorFlow'),
      (4, 'PC-AD-02', 2022, 'PC-2022-006', 'SiL-PC', 'HP Z8 Workstation', 'NVIDIA A6000 GPU', '00:1A:2B:3C:4D:8F', '192.168.1.41', 'NVIDIA CUDA, PyTorch', 'Python, PyTorch, OpenCV'),
      (5, 'PC-BMS-01', 2022, 'PC-2022-007', 'Host-PC', 'Dell Precision 7760', 'RTI Card', '00:1A:2B:3C:4D:9E', '192.168.1.50', 'MATLAB, Simulink', 'Matlab, Simulink'),
      (6, 'PC-SUS-01', 2022, 'PC-2022-008', 'Host-PC', 'HP Z6 Workstation', 'RTI Card', '00:1A:2B:3C:4D:AE', '192.168.1.60', 'MATLAB, CarSim', 'Matlab, CarSim'),
      (7, 'PC-EPS-01', 2022, 'PC-2022-009', 'Host-PC', 'Dell Precision 5820', 'RTI Card', '00:1A:2B:3C:4D:BE', '192.168.1.70', 'MATLAB, Simulink', 'Matlab, Simulink'),
      (8, 'PC-HMI-01', 2022, 'PC-2022-010', 'Host-PC', 'HP Z4 Workstation', 'RTI Card, GPU', '00:1A:2B:3C:4D:CE', '192.168.1.80', 'Qt, LabVIEW', 'Qt Creator, LabVIEW')
    `;
    await dbUtils.run(pcSql); // Use await
    console.log('Additional PC information added');
    
    // Add more wetbenches
    const wetbenchSql = `
      INSERT INTO wetbenches (
        wetbench_name, pp_number, owner, system_type,
        platform, system_supplier, linked_bench_id,
        actuator_info, hardware_components, inventory_number
      ) VALUES
      ('WB-AutoDrive-04', 'WB4567', 'IAV', 'SCLX', 'Platform D', 'Supplier W', 4, 'Robotics actuators', 'Cameras, lidars, radars', 'WB-2022-004'),
      ('WB-Battery-05', 'WB5678', 'VW', 'PHS', 'Platform E', 'Supplier V', 5, 'Thermal actuators', 'Battery modules, cooling systems', 'WB-2022-005'),
      ('WB-Suspension-06', 'WB6789', 'IAV', 'SCLX', 'Platform F', 'Supplier U', 6, 'Hydraulic cylinders', 'Dampers, springs, control arms', 'WB-2022-006'),
      ('WB-Steering-07', 'WB7890', 'BMW', 'PHS', 'Platform G', 'Supplier T', 7, 'Electric motors', 'Steering columns, racks', 'WB-2022-007'),
      ('WB-HMI-08', 'WB8901', 'Audi', 'SCLX', 'Platform H', 'Supplier S', 8, 'Touch simulators', 'Displays, buttons, dials', 'WB-2022-008')
    `;
    await dbUtils.run(wetbenchSql); // Use await
    console.log('Additional wetbench information added');
    
    // Add more model stands
    const modelStandsSql = `
      INSERT INTO model_stands (
        model_name, svn_link, features
      ) VALUES
      ('ADM-1000', 'svn://models/adm1000', 'Camera perception, object detection, path planning'),
      ('BMS-2000', 'svn://models/bms2000', 'Cell balancing, thermal management, state estimation'),
      ('SUS-3000', 'svn://models/sus3000', 'Damper control, active suspension, ride height control'),
      ('EPS-4000', 'svn://models/eps4000', 'Power assist curves, return-to-center, dampening'),
      ('HMI-5000', 'svn://models/hmi5000', 'Display rendering, touch response, haptic feedback')
    `;
    await dbUtils.run(modelStandsSql); // Use await
    console.log('Model stands information added');
    
    // Add more licenses
    const licensesSql = `
      INSERT INTO licenses (
        tool_name, license_number, maintenance_end, owner, assigned_pc_id
      ) VALUES
      ('MATLAB R2022b', 'ML-12345-67890', '2023-12-31', 'IAV', 1),
      ('CarMaker 10.0', 'CM-23456-78901', '2023-11-30', 'IAV', 2),
      ('ControlDesk 7.2', 'CD-34567-89012', '2023-10-31', 'IAV', 3),
      ('dSPACE ASM 2022', 'ASM-45678-90123', '2023-09-30', 'IAV', 4),
      ('TensorFlow Enterprise', 'TF-56789-01234', '2023-08-31', 'IAV', 5),
      ('Simulink 2022b', 'SL-67890-12345', '2023-07-31', 'IAV', 6),
      ('CarSim 2022.1', 'CS-78901-23456', '2023-06-30', 'IAV', 7),
      ('LabVIEW 2022', 'LV-89012-34567', '2023-05-31', 'IAV', 8),
      ('Qt Enterprise', 'QT-90123-45678', '2023-04-30', 'IAV', 9),
      ('Visual Studio 2022', 'VS-01234-56789', '2023-03-31', 'IAV', 10)
    `;
    await dbUtils.run(licensesSql); // Use await
    console.log('License information added');
    
    // Add VM instances
    const vmInstancesSql = `
      INSERT INTO vm_instances (
        vm_name, vm_address, installed_tools
      ) VALUES
      ('SVN-Server', '192.168.10.10', 'Subversion, Apache'),
      ('Build-Server', '192.168.10.20', 'Jenkins, Docker, GCC'),
      ('DOORS-Server', '192.168.10.30', 'IBM DOORS, DOORS Web Access'),
      ('CANoe-Server', '192.168.10.40', 'Vector CANoe, CANalyzer'),
      ('Simulation-Server', '192.168.10.50', 'CARLA, Gazebo, SUMO')
    `;
    await dbUtils.run(vmInstancesSql); // Use await
    console.log('VM instances information added');

    console.log('Additional data added successfully!');
  } catch (err) {
    console.error('Error adding more data:', err);
    throw err;
  }
  // Removed finally block here, closing is handled in the main block
}

// Run directly if this script is executed - make wrapper async
if (require.main === module) {
  (async () => {
    try {
        await addMoreData();
        console.log('Database enhancement completed.');
    } catch (err) {
        console.error("Adding more data failed:", err);
    } finally {
        // Close the pool after adding data is attempted
        await dbUtils.closePool();
        console.log("AddMoreData script finished, pool closed.");
    }
  })();
}

module.exports = { addMoreData }; 