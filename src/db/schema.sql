CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    user_name TEXT NOT NULL,
    contact_info TEXT
);

CREATE TABLE projects (
    project_id INTEGER PRIMARY KEY,
    project_number TEXT,
    project_name TEXT
);

CREATE TABLE test_benches (
    bench_id INTEGER PRIMARY KEY,
    hil_name TEXT NOT NULL,
    pp_number TEXT,
    system_type TEXT,        -- (SCLX / PHS)
    bench_type TEXT,         -- (Bremssystem, Fullsize, Midsize)
    acquisition_date DATE,
    usage_period TEXT,
    user_id INTEGER,
    project_id INTEGER,
    location TEXT,
    inventory_number TEXT,
    eplan TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

CREATE TABLE test_bench_project_overview (
    overview_id INTEGER PRIMARY KEY,
    bench_id INTEGER NOT NULL,
    platform TEXT,
    system_supplier TEXT,
    wetbench_info TEXT,      -- references or details if multiple
    actuator_info TEXT,      -- references or details if multiple
    hardware TEXT,
    software TEXT,
    model_version TEXT,
    ticket_notes TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id)
);

CREATE TABLE model_stands (
    model_id INTEGER PRIMARY KEY,
    model_name TEXT NOT NULL,
    svn_link TEXT,
    features TEXT
);

CREATE TABLE wetbenches (
    wetbench_id INTEGER PRIMARY KEY,
    wetbench_name TEXT NOT NULL,
    pp_number TEXT,
    owner TEXT,             -- (IAV, VW, etc.)
    system_type TEXT,       -- optional SCLX / PHS
    platform TEXT,
    system_supplier TEXT,
    linked_bench_id INTEGER, -- references test_benches
    actuator_info TEXT,
    hardware_components TEXT,
    inventory_number TEXT,
    FOREIGN KEY (linked_bench_id) REFERENCES test_benches(bench_id)
);

CREATE TABLE hil_technology (
    tech_id INTEGER PRIMARY KEY,
    bench_id INTEGER NOT NULL,
    fiu_info TEXT,
    io_info TEXT,
    can_interface TEXT,
    power_interface TEXT,
    possible_tests TEXT,
    leakage_module TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id)
);

CREATE TABLE hil_operation (
    operation_id INTEGER PRIMARY KEY,
    bench_id INTEGER NOT NULL,
    possible_tests TEXT,
    vehicle_datasets TEXT,
    scenarios TEXT,
    controldesk_projects TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id)
);

CREATE TABLE hardware_installation (
    install_id INTEGER PRIMARY KEY,
    bench_id INTEGER NOT NULL,
    ecu_info TEXT,
    sensors TEXT,
    additional_periphery TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id)
);

CREATE TABLE pc_overview (
    pc_id INTEGER PRIMARY KEY,
    bench_id INTEGER,
    pc_name TEXT,
    purchase_year INTEGER,
    inventory_number TEXT,
    pc_role TEXT,               -- (Host-PC, Compiler-PC, SiL, etc.)
    pc_model TEXT,
    special_equipment TEXT,
    mac_address TEXT,
    ip_address TEXT,
    active_licenses TEXT,       -- references or stored
    installed_tools TEXT,
    pc_info_text TEXT,          -- Additional information about the PC
    status TEXT,                -- Status of the PC (offline, online, in use)
    active_user TEXT,           -- Name of the user currently logged in
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id)
);

CREATE TABLE licenses (
    license_id INTEGER PRIMARY KEY,
    tool_name TEXT NOT NULL,    -- (CarMaker, Matlab, etc.)
    license_number TEXT,
    maintenance_end DATE,
    owner TEXT,                 -- if different from current project
    assigned_pc_id INTEGER,
    FOREIGN KEY (assigned_pc_id) REFERENCES pc_overview(pc_id)
);

CREATE TABLE vm_instances (
    vm_id INTEGER PRIMARY KEY,
    vm_name TEXT NOT NULL,
    vm_address TEXT,
    installed_tools TEXT        -- (EXAM, DOORs-Sync, etc.)
);