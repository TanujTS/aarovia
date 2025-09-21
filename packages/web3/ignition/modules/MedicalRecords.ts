import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MedicalRecordsModule = buildModule("MedicalRecordsModule", (m) => {
  const medicalRecords = m.contract("MedicalRecords");

  return { medicalRecords };
});

export default MedicalRecordsModule;
