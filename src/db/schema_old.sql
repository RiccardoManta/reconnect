CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(255)
);

CREATE TABLE projects (
    project_id INT PRIMARY KEY AUTO_INCREMENT,
    project_number VARCHAR(50),
    project_name VARCHAR(255)
);

CREATE TABLE test_benches (
    bench_id INT PRIMARY KEY AUTO_INCREMENT,
    hil_name VARCHAR(255) NOT NULL,
    pp_number VARCHAR(50),
    system_type VARCHAR(50),        -- (SCLX / PHS)
    bench_type VARCHAR(100),         -- (Bremssystem, Fullsize, Midsize)
    acquisition_date DATE,
    usage_period VARCHAR(50),
    user_id INT,
    project_id INT,
    location VARCHAR(100),
    inventory_number VARCHAR(100),
    eplan VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
);

CREATE TABLE test_bench_project_overview (
    overview_id INT PRIMARY KEY AUTO_INCREMENT,
    bench_id INT NOT NULL,
    platform VARCHAR(100),
    system_supplier VARCHAR(100),
    wetbench_info TEXT,      -- references or details if multiple
    actuator_info TEXT,      -- references or details if multiple
    hardware VARCHAR(255),
    software VARCHAR(255),
    model_version VARCHAR(50),
    ticket_notes TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE model_stands (
    model_id INT PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(255) NOT NULL,
    svn_link VARCHAR(500),
    features TEXT
);

CREATE TABLE wetbenches (
    wetbench_id INT PRIMARY KEY AUTO_INCREMENT,
    wetbench_name VARCHAR(255) NOT NULL,
    pp_number VARCHAR(50),
    owner VARCHAR(100),             -- (IAV, VW, etc.)
    system_type VARCHAR(50),       -- optional SCLX / PHS
    platform VARCHAR(100),
    system_supplier VARCHAR(100),
    linked_bench_id INT, -- references test_benches
    actuator_info TEXT,
    hardware_components TEXT,
    inventory_number VARCHAR(100),
    FOREIGN KEY (linked_bench_id) REFERENCES test_benches(bench_id) ON DELETE SET NULL
);

CREATE TABLE hil_technology (
    tech_id INT PRIMARY KEY AUTO_INCREMENT,
    bench_id INT NOT NULL,
    fiu_info VARCHAR(255),
    io_info VARCHAR(255),
    can_interface VARCHAR(255),
    power_interface VARCHAR(255),
    possible_tests TEXT,
    leakage_module VARCHAR(100),
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE hil_operation (
    operation_id INT PRIMARY KEY AUTO_INCREMENT,
    bench_id INT NOT NULL,
    possible_tests TEXT,
    vehicle_datasets TEXT,
    scenarios TEXT,
    controldesk_projects TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE hardware_installation (
    install_id INT PRIMARY KEY AUTO_INCREMENT,
    bench_id INT NOT NULL,
    ecu_info TEXT,
    sensors TEXT,
    additional_periphery TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE pc_overview (
    pc_id INT PRIMARY KEY AUTO_INCREMENT,
    bench_id INT,
    pc_name VARCHAR(100),
    purchase_year INT,
    inventory_number VARCHAR(100),
    pc_role VARCHAR(100),               -- (Host-PC, Compiler-PC, SiL, etc.)
    pc_model VARCHAR(100),
    special_equipment TEXT,
    mac_address VARCHAR(17),
    ip_address VARCHAR(45),
    active_licenses TEXT,       -- references or stored
    installed_tools TEXT,
    pc_info_text TEXT,          -- Additional information about the PC
    status VARCHAR(50),                -- Status of the PC (offline, online, in use)
    active_user VARCHAR(100),           -- Name of the user currently logged in
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE SET NULL
);

CREATE TABLE licenses (
    license_id INT PRIMARY KEY AUTO_INCREMENT,
    tool_name VARCHAR(100) NOT NULL,    -- (CarMaker, Matlab, etc.)
    license_number VARCHAR(255),
    maintenance_end DATE,
    owner VARCHAR(100),                 -- if different from current project
    assigned_pc_id INT,
    FOREIGN KEY (assigned_pc_id) REFERENCES pc_overview(pc_id) ON DELETE SET NULL
);

CREATE TABLE vm_instances (
    vm_id INT PRIMARY KEY AUTO_INCREMENT,
    vm_name VARCHAR(255) NOT NULL,
    vm_address VARCHAR(255),
    installed_tools TEXT        -- (EXAM, DOORs-Sync, etc.)
);