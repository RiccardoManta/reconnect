const db = require('./dbUtils');
const { initializeDatabase } = require('./initDb');

// Seed sample data
function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');
    
    // Add sample users
    const usersSql = `
      INSERT INTO users (user_name, contact_info) VALUES
      ('John Doe', 'john.doe@example.com'),
      ('Jane Smith', 'jane.smith@example.com'),
      ('Bob Johnson', 'bob.johnson@example.com')
    `;
    db.run(usersSql);
    console.log('Users added');
    
    // Add sample projects
    const projectsSql = `
      INSERT INTO projects (project_number, project_name) VALUES
      ('P2023-001', 'Brake System Test'),
      ('P2023-002', 'Advanced Driver Assistance'),
      ('P2023-003', 'Vehicle Dynamics')
    `;
    db.run(projectsSql);
    console.log('Projects added');
    
    // Add sample test benches
    const benchesSql = `
      INSERT INTO test_benches (
        hil_name, pp_number, system_type, bench_type, 
        acquisition_date, usage_period, user_id, project_id, 
        location, inventory_number, eplan
      ) VALUES
      ('HIL-BS-01', 'PP1234', 'SCLX', 'Bremssystem', '2022-01-15', '24 months', 1, 1, 'Lab A', 'INV-2022-001', 'EP-BS-01'),
      ('HIL-ADAS-02', 'PP2345', 'PHS', 'Fullsize', '2022-03-20', '36 months', 2, 2, 'Lab B', 'INV-2022-002', 'EP-ADAS-02'),
      ('HIL-VD-03', 'PP3456', 'SCLX', 'Midsize', '2022-05-10', '24 months', 3, 3, 'Lab C', 'INV-2022-003', 'EP-VD-03')
    `;
    db.run(benchesSql);
    console.log('Test benches added');
    
    // Add sample test bench project overviews
    const overviewSql = `
      INSERT INTO test_bench_project_overview (
        bench_id, platform, system_supplier, wetbench_info, 
        actuator_info, hardware, software, model_version, ticket_notes
      ) VALUES
      (1, 'Platform A', 'Supplier X', 'Wetbench 1', 'Actuator System 1', 'Hardware v1.0', 'Software v2.3', 'Model v1.2', 'Regular maintenance required'),
      (2, 'Platform B', 'Supplier Y', 'Wetbench 2', 'Actuator System 2', 'Hardware v2.0', 'Software v3.1', 'Model v2.1', 'Updated calibration needed'),
      (3, 'Platform C', 'Supplier Z', 'Wetbench 3', 'Actuator System 3', 'Hardware v1.5', 'Software v2.7', 'Model v1.5', 'New sensors installed')
    `;
    db.run(overviewSql);
    console.log('Project overviews added');
    
    // Add sample technology info
    const techSql = `
      INSERT INTO hil_technology (
        bench_id, fiu_info, io_info, can_interface, 
        power_interface, possible_tests, leakage_module
      ) VALUES
      (1, 'FIU v2.1', 'DS2211 I/O', 'CAN FD', 'DC Power Module', 'Brake performance, ABS testing', 'LM-2000'),
      (2, 'FIU v3.0', 'DS2215 I/O', 'CAN FD, FlexRay', 'AC/DC Power Module', 'ADAS algorithm testing, radar simulation', 'LM-3000'),
      (3, 'FIU v2.5', 'DS2213 I/O', 'CAN, LIN', 'DC Power Supply', 'Vehicle dynamics, stability testing', 'LM-2500')
    `;
    db.run(techSql);
    console.log('Technology information added');
    
    // Add sample operation info
    const operationSql = `
      INSERT INTO hil_operation (
        bench_id, possible_tests, vehicle_datasets, 
        scenarios, controldesk_projects
      ) VALUES
      (1, 'ABS, ESP, TCS', 'Vehicle A, Vehicle B', 'Emergency braking, Slippery surface', 'CD-Brake-v1, CD-Brake-v2'),
      (2, 'ACC, LKA, AEB', 'Vehicle C, Vehicle D', 'Highway driving, Urban environment', 'CD-ADAS-v1, CD-ADAS-v2'),
      (3, 'ESP, TCS, RSC', 'Vehicle E, Vehicle F', 'Cornering, Lane change', 'CD-Dynamics-v1, CD-Dynamics-v2')
    `;
    db.run(operationSql);
    console.log('Operation information added');
    
    // Add sample hardware installations
    const hardwareSql = `
      INSERT INTO hardware_installation (
        bench_id, ecu_info, sensors, additional_periphery
      ) VALUES
      (1, 'Brake ECU v2.1', 'Wheel speed sensors, pressure sensors', 'HV battery simulator'),
      (2, 'ADAS ECU v3.0', 'Camera, radar, lidar sensors', 'GPS simulator, traffic simulator'),
      (3, 'Chassis Control ECU v2.5', 'Acceleration sensors, gyroscopes', 'Steering actuator, load simulators')
    `;
    db.run(hardwareSql);
    console.log('Hardware installation information added');
    
    // Add sample PC information
    const pcSql = `
      INSERT INTO pc_overview (
        bench_id, pc_name, purchase_year, inventory_number, 
        pc_role, pc_model, special_equipment, mac_address,
        ip_address, active_licenses, installed_tools
      ) VALUES
      (1, 'PC-BS-01', 2022, 'PC-2022-001', 'Host-PC', 'Dell Precision', 'RTI Card', '00:1A:2B:3C:4D:5E', '192.168.1.10', 'CM, MBD', 'Matlab, CarMaker'),
      (1, 'PC-BS-02', 2022, 'PC-2022-002', 'Compiler-PC', 'HP Workstation', 'NVIDIA GPU', '00:1A:2B:3C:4D:5F', '192.168.1.11', 'MSVC, Intel', 'Visual Studio, Intel Compiler'),
      (2, 'PC-ADAS-01', 2022, 'PC-2022-003', 'Host-PC', 'Dell Precision', 'RTI Card, FPGA', '00:1A:2B:3C:4D:6E', '192.168.1.20', 'MATLAB, Simulink', 'Matlab, Simulink, CarSim'),
      (3, 'PC-VD-01', 2022, 'PC-2022-004', 'Host-PC', 'HP Workstation', 'RTI Card', '00:1A:2B:3C:4D:7E', '192.168.1.30', 'IPG, ASM', 'CarMaker, ASM')
    `;
    db.run(pcSql);
    console.log('PC information added');
    
    // Add sample wetbenches
    const wetbenchSql = `
      INSERT INTO wetbenches (
        wetbench_name, pp_number, owner, system_type,
        platform, system_supplier, linked_bench_id,
        actuator_info, hardware_components, inventory_number
      ) VALUES
      ('WB-Brake-01', 'WB1234', 'IAV', 'SCLX', 'Platform A', 'Supplier X', 1, 'Hydraulic actuators', 'Pressure sensors, valves', 'WB-2022-001'),
      ('WB-ADAS-02', 'WB2345', 'VW', 'PHS', 'Platform B', 'Supplier Y', 2, 'Electric actuators', 'Cameras, radar units', 'WB-2022-002'),
      ('WB-Dynamics-03', 'WB3456', 'IAV', 'SCLX', 'Platform C', 'Supplier Z', 3, 'Hydro-pneumatic actuators', 'Load cells, motion sensors', 'WB-2022-003')
    `;
    db.run(wetbenchSql);
    console.log('Wetbench information added');
    
    console.log('Database seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  // Initialize database first
  const database = initializeDatabase();
  database.close();
  
  // Then seed it with data
  seedDatabase();
  console.log('Database setup and seeding completed.');
}

module.exports = { seedDatabase }; 