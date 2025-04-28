export interface TestBench {
  benchId: number;
  hilName: string;
  ppNumber: string | null;
  systemType: string | null;
  benchType: string | null;
  acquisitionDate: string | null;
  usagePeriod: string | null;
  userId: number | null;
  projectId: number | null;
  location: string | null;
  inventoryNumber: string | null;
  eplan: string | null;
}

export interface Project {
  projectId: number;
  projectNumber: string;
  projectName: string;
}

export interface User {
  userId: number;
  userName: string;
  companyUsername?: string | null;
  email: string;
  password_hash: string;
  salt: string;
}

export interface License {
  licenseId: number;
  softwareId: number;
  licenseName: string | null;
  licenseDescription: string | null;
  licenseNumber: string | null;
  dongleNumber: string | null;
  activationKey: string | null;
  systemId: string | null;
  licenseUser: string | null;
  maintenanceEnd: string | null;
  owner: string | null;
  licenseType: string | null;
  remarks: string | null;
}

export interface VmInstance {
  vmId: number;
  vmName: string;
  vmAddress: string | null;
}

export interface ModelStand {
  modelId: number;
  modelName: string;
  svnLink: string | null;
  features: string | null;
}

export interface Wetbench {
  wetbenchId: number;
  wetbenchName: string;
  ppNumber: string | null;
  owner: string | null;
  systemType: string | null;
  platform: string | null;
  systemSupplier: string | null;
  linkedBenchId: number | null;
  actuatorInfo: string | null;
  hardwareComponents: string | null;
  inventoryNumber: string | null;
}

export interface HilTechnology {
  techId: number;
  benchId: number;
  fiuInfo: string | null;
  ioInfo: string | null;
  canInterface: string | null;
  powerInterface: string | null;
  possibleTests: string | null;
  leakageModule: string | null;
}

export interface HilOperation {
  operationId: number;
  benchId: number;
  possibleTests: string | null;
  vehicleDatasets: string | null;
  scenarios: string | null;
  controldeskProjects: string | null;
}

export interface HardwareInstallation {
  installId: number;
  benchId: number;
  ecuInfo: string | null;
  sensors: string | null;
  additionalPeriphery: string | null;
}

export interface PcOverview {
  pcId: number;
  benchId: number | null;
  pcName: string | null;
  casualName: string | null;
  purchaseYear: number | null;
  inventoryNumber: string | null;
  pcRole: string | null;
  pcModel: string | null;
  specialEquipment: string | null;
  macAddress: string | null;
  ipAddress: string | null;
  pcInfoText: string | null;
  status: string | null;
  activeUser: string | null;
}

export interface ProjectOverview {
  overviewId: number;
  benchId: number;
  platform: string | null;
  systemSupplier: string | null;
  wetbenchInfo: string | null;
  actuatorInfo: string | null;
  hardware: string | null;
  software: string | null;
  modelVersion: string | null;
  ticketNotes: string | null;
}

export interface Software {
  softwareId: number;
  softwareName: string;
  majorVersion: string | null;
  vendor: string | null;
} 