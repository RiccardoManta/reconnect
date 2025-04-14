export interface TestBench {
  benchId: number;
  hilName: string;
  ppNumber: string;
  systemType: string;
  benchType: string;
  acquisitionDate: string;
  location: string;
  userName: string;
  projectName: string;
}

export interface Project {
  projectId: number;
  projectNumber: string;
  projectName: string;
}

export interface User {
  userId: number;
  userName: string;
  contactInfo: string;
}

export interface License {
  licenseId: number;
  toolName: string;
  licenseNumber: string;
  maintenanceEnd: string;
  owner: string;
}

export interface VmInstance {
  vmId: number;
  vmName: string;
  vmAddress: string;
  installedTools: string;
}

export interface ModelStand {
  modelId: number;
  modelName: string;
  svnLink: string;
  features: string;
}

export interface Wetbench {
  wetbenchId: number;
  wetbenchName: string;
  ppNumber: string;
  owner: string;
  systemType: string;
  platform: string;
  systemSupplier: string;
  linkedBenchId: number;
  actuatorInfo: string;
  hardwareComponents: string;
  inventoryNumber: string;
}

export interface HilTechnology {
  techId: number;
  benchId: number;
  hilName: string;
  fiuInfo: string;
  ioInfo: string;
  canInterface: string;
  powerInterface: string;
  possibleTests: string;
  leakageModule: string;
}

export interface HilOperation {
  operationId: number;
  benchId: number;
  hilName: string;
  possibleTests: string;
  vehicleDatasets: string;
  scenarios: string;
  controldeskProjects: string;
}

export interface HardwareInstallation {
  installId: number;
  benchId: number;
  hilName: string;
  ecuInfo: string;
  sensors: string;
  additionalPeriphery: string;
}

export interface PcOverview {
  pcId: number;
  benchId: number;
  pcName: string;
  purchaseYear: number;
  inventoryNumber: string;
  pcRole: string;
  pcModel: string;
  specialEquipment: string;
  macAddress: string;
  ipAddress: string;
  activeLicenses: string;
  installedTools: string;
  pcInfoText: string;
  status: string;
  activeUser: string;
}

export interface ProjectOverview {
  overviewId: number;
  benchId: number;
  hilName: string;
  platform: string;
  systemSupplier: string;
  wetbenchInfo: string;
  actuatorInfo: string;
  hardware: string;
  software: string;
  modelVersion: string;
  ticketNotes: string;
} 