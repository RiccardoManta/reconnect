/* ---------- core entities ---------- */
CREATE TABLE permissions (
    permission_id   INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(50) NOT NULL UNIQUE -- e.g., 'Default', 'Read', 'Edit', 'Admin'
);

CREATE TABLE user_groups (
    user_group_id   INT PRIMARY KEY AUTO_INCREMENT, -- Renamed from group_id
    user_group_name VARCHAR(100) NOT NULL UNIQUE,
    permission_id   INT NOT NULL, -- Added column for permission level
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) -- Added FK constraint
    -- Consider adding ON DELETE RESTRICT or SET DEFAULT if needed, depends on policy
);

-- Dedicated platforms table
CREATE TABLE platforms (
    platform_id   INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    platform_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id           INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    user_name         VARCHAR(255) NOT NULL,
    company_username  VARCHAR(255) NULL,  -- Renamed from contact_info, assuming it can be NULL
    email             VARCHAR(255) NOT NULL UNIQUE, -- Added email, must be unique and required
    password_hash     VARCHAR(255) NOT NULL, -- Ensure defined and required
    salt              VARCHAR(64) NOT NULL,   -- Ensure defined and required
    user_group_id     INT NULL, -- Renamed from group_id
    FOREIGN KEY (user_group_id) REFERENCES user_groups(user_group_id) ON DELETE SET NULL -- Updated FK
);

CREATE TABLE projects (
    project_id     INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    project_number VARCHAR(50),
    project_name   VARCHAR(255)
);

CREATE TABLE test_benches (
    bench_id          INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    hil_name          VARCHAR(255) NOT NULL,
    pp_number         VARCHAR(50),
    system_type       VARCHAR(50),          -- SCLX / PHS
    bench_type        VARCHAR(100),         -- Bremssystem, Fullsize, Midsize …
    acquisition_date  DATE,
    usage_period      VARCHAR(50),
    user_id           INT,
    project_id        INT,
    location          VARCHAR(100),
    inventory_number  VARCHAR(100),
    eplan             VARCHAR(100),
    FOREIGN KEY (user_id)    REFERENCES users(user_id)       ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL
);

CREATE TABLE test_bench_project_overview (
    overview_id     INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    bench_id        INT NOT NULL,
    platform_id     INT,          -- Changed from platform VARCHAR(100)
    system_supplier VARCHAR(100),
    wetbench_info   TEXT,
    actuator_info   TEXT,
    hardware        VARCHAR(255),
    software        VARCHAR(255),
    model_version   VARCHAR(50),
    ticket_notes    TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES platforms(platform_id) ON DELETE SET NULL -- Added FK
);

CREATE TABLE model_stands (
    model_id   INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    model_name VARCHAR(255) NOT NULL,
    svn_link   VARCHAR(500),
    features   TEXT
);

CREATE TABLE wetbenches (
    wetbench_id         INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    wetbench_name       VARCHAR(255) NOT NULL,
    pp_number           VARCHAR(50),
    owner               VARCHAR(100),      -- IAV, VW …
    system_type         VARCHAR(50),
    platform            VARCHAR(100),
    system_supplier     VARCHAR(100),
    linked_bench_id     INT,
    actuator_info       TEXT,
    hardware_components TEXT,
    inventory_number    VARCHAR(100),
    FOREIGN KEY (linked_bench_id) REFERENCES test_benches(bench_id) ON DELETE SET NULL
);

CREATE TABLE hil_technology (
    tech_id          INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    bench_id         INT NOT NULL,
    fiu_info         VARCHAR(255),
    io_info          VARCHAR(255),
    can_interface    VARCHAR(255),
    power_interface  VARCHAR(255),
    possible_tests   TEXT,
    leakage_module   VARCHAR(100),
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE hil_operation (
    operation_id     INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    bench_id         INT NOT NULL,
    possible_tests   TEXT,
    vehicle_datasets TEXT,
    scenarios        TEXT,
    controldesk_projects TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

CREATE TABLE hardware_installation (
    install_id            INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    bench_id              INT NOT NULL,
    ecu_info              TEXT,
    sensors               TEXT,
    additional_periphery  TEXT,
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE CASCADE
);

/* ---------- physical & virtual machines ---------- */
CREATE TABLE pc_overview (
    pc_id            INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    bench_id         INT,
    pc_name          VARCHAR(100),
    casual_name      VARCHAR(100),          -- friendly/local name
    purchase_year    INT,
    inventory_number VARCHAR(100),
    pc_role          VARCHAR(100),          -- Host-PC, Compiler-PC, …
    pc_model         VARCHAR(100),
    special_equipment TEXT,
    mac_address      VARCHAR(17),
    ip_address       VARCHAR(45),
    pc_info_text     TEXT,
    status           VARCHAR(50),
    active_user      VARCHAR(100),
    FOREIGN KEY (bench_id) REFERENCES test_benches(bench_id) ON DELETE SET NULL
);

CREATE TABLE vm_instances (
    vm_id      INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    vm_name    VARCHAR(255) NOT NULL,
    vm_address VARCHAR(255)
);

/* ---------- software catalogue & installs ---------- */
CREATE TABLE software (
    software_id   INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    software_name VARCHAR(255) NOT NULL,
    major_version VARCHAR(50),
    vendor        VARCHAR(255),
    UNIQUE KEY uk_software_version (software_name, major_version)
);

CREATE TABLE pc_software (
    pc_id       INT NOT NULL,
    software_id INT NOT NULL,
    install_date DATE,
    PRIMARY KEY (pc_id, software_id),
    FOREIGN KEY (pc_id)       REFERENCES pc_overview(pc_id) ON DELETE CASCADE,
    FOREIGN KEY (software_id) REFERENCES software(software_id) ON DELETE CASCADE
);

CREATE TABLE vm_software (
    vm_id       INT NOT NULL,
    software_id INT NOT NULL,
    install_date DATE,
    PRIMARY KEY (vm_id, software_id),
    FOREIGN KEY (vm_id)       REFERENCES vm_instances(vm_id) ON DELETE CASCADE,
    FOREIGN KEY (software_id) REFERENCES software(software_id) ON DELETE CASCADE
);

/* ---------- licensing ---------- */
CREATE TABLE licenses (
    license_id        INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    software_id       INT NOT NULL,
    license_name      VARCHAR(255),        -- e.g. "dSPACE ControlDesk"
    license_description TEXT,
    license_number    VARCHAR(255),
    dongle_number     VARCHAR(100),
    activation_key    VARCHAR(255),
    system_id         VARCHAR(255),        -- IPG SystemID, etc.
    license_user      VARCHAR(100),        -- MathWorks user, …
    maintenance_end   DATE,
    owner             VARCHAR(100),        -- cost-center / project
    license_type      VARCHAR(50),         -- node-locked, floating, dongle …
    remarks           TEXT,
    FOREIGN KEY (software_id) REFERENCES software(software_id) ON DELETE CASCADE
);

CREATE TABLE license_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT, -- MySQL syntax
    license_id  INT NOT NULL,
    pc_id       INT NULL,
    vm_id       INT NULL,
    assigned_on DATE,
    FOREIGN KEY (license_id) REFERENCES licenses(license_id) ON DELETE CASCADE,
    FOREIGN KEY (pc_id)      REFERENCES pc_overview(pc_id) ON DELETE CASCADE,
    FOREIGN KEY (vm_id)      REFERENCES vm_instances(vm_id) ON DELETE CASCADE,
    CHECK ((pc_id IS NOT NULL) OR (vm_id IS NOT NULL)),
    UNIQUE KEY uk_license_assignment (license_id, pc_id, vm_id)
);

/* ---------- group-specific platform access ---------- */
CREATE TABLE group_platform_access (
    user_group_id     INT NOT NULL, -- Renamed from group_id
    platform_id  INT NOT NULL,
    PRIMARY KEY (user_group_id, platform_id), -- Updated PK
    FOREIGN KEY (user_group_id) REFERENCES user_groups(user_group_id) ON DELETE CASCADE, -- Updated FK
    FOREIGN KEY (platform_id) REFERENCES platforms(platform_id) ON DELETE CASCADE
);