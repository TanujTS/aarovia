import { expect } from "chai";
import { network } from "hardhat";
import { Signer } from "ethers";

const { ethers } = await network.connect();

describe("MedicalRecords", function () {
  let medicalRecords: any;
  let owner: Signer;
  let patient1: Signer;
  let patient2: Signer;
  let provider1: Signer;
  let provider2: Signer;
  let unauthorized: Signer;
  
  let ownerAddress: string;
  let patient1Address: string;
  let patient2Address: string;
  let provider1Address: string;
  let provider2Address: string;
  let unauthorizedAddress: string;

  // Test data
  const sampleRecordId = ethers.keccak256(ethers.toUtf8Bytes("RECORD001"));
  const samplePatientId = ethers.keccak256(ethers.toUtf8Bytes("PATIENT001"));
  const sampleProviderId = ethers.keccak256(ethers.toUtf8Bytes("PROVIDER001"));
  const sampleCID = "QmXoYPCVmRVWGJKgKG4Qg9Kq2nHvB2xr3j8k3q8XaHbRdX";
  const sampleTitle = "Annual Physical Examination";
  const updatedCID = "QmYpZPCVmRVWGJKgKG4Qg9Kq2nHvB2xr3j8k3q8XaHbRdY";

  beforeEach(async function () {
    // Get signers
    [owner, patient1, patient2, provider1, provider2, unauthorized] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    patient1Address = await patient1.getAddress();
    patient2Address = await patient2.getAddress();
    provider1Address = await provider1.getAddress();
    provider2Address = await provider2.getAddress();
    unauthorizedAddress = await unauthorized.getAddress();

    // Deploy the MedicalRecords contract
    medicalRecords = await ethers.deployContract("MedicalRecords");
  });

  describe("Contract Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await medicalRecords.owner()).to.equal(ownerAddress);
    });
  });

  describe("Medical Record Addition", function () {
    it("Should add a new medical record successfully", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          samplePatientId,
          patient1Address,
          sampleProviderId,
          provider1Address,
          1, // RecordType.Encounter
          sampleCID,
          sampleTitle,
          false
        )
      )
        .to.emit(medicalRecords, "MedicalRecordAdded")
        .withArgs(
          sampleRecordId,
          samplePatientId,
          sampleProviderId,
          1, // RecordType.Encounter
          sampleCID,
          ownerAddress
        );
    });

    it("Should store medical record information correctly", async function () {
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        2, // RecordType.LabResult
        sampleCID,
        sampleTitle,
        true
      );

      const [
        recordId,
        patientId,
        patientWallet,
        providerId,
        providerWallet,
        recordType,
        recordCID,
        timestamp,
        title,
        isSensitive,
        ownerAddr
      ] = await medicalRecords.getMedicalRecord(sampleRecordId);

      expect(recordId).to.equal(sampleRecordId);
      expect(patientId).to.equal(samplePatientId);
      expect(patientWallet).to.equal(patient1Address);
      expect(providerId).to.equal(sampleProviderId);
      expect(providerWallet).to.equal(provider1Address);
      expect(recordType).to.equal(2); // LabResult
      expect(recordCID).to.equal(sampleCID);
      expect(title).to.equal(sampleTitle);
      expect(isSensitive).to.be.true;
      expect(ownerAddr).to.equal(ownerAddress);
      expect(timestamp).to.be.gt(0);
    });

    it("Should add record ID to patient's record list", async function () {
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        sampleTitle,
        false
      );

      const patientRecordIds = await medicalRecords.getPatientRecordIds(samplePatientId);
      expect(patientRecordIds).to.have.lengthOf(1);
      expect(patientRecordIds[0]).to.equal(sampleRecordId);
    });

    it("Should allow multiple records for the same patient", async function () {
      const recordId2 = ethers.keccak256(ethers.toUtf8Bytes("RECORD002"));
      const title2 = "Blood Test Results";

      // Add first record
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        sampleTitle,
        false
      );

      // Add second record
      await medicalRecords.addMedicalRecord(
        recordId2,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        2, // RecordType.LabResult
        "QmDifferentCID",
        title2,
        true
      );

      const patientRecordIds = await medicalRecords.getPatientRecordIds(samplePatientId);
      expect(patientRecordIds).to.have.lengthOf(2);
      expect(patientRecordIds).to.include(sampleRecordId);
      expect(patientRecordIds).to.include(recordId2);
    });

    it("Should not allow duplicate record IDs", async function () {
      // Add first record
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        sampleTitle,
        false
      );

      // Attempt to add record with same ID
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          ethers.keccak256(ethers.toUtf8Bytes("PATIENT002")),
          patient2Address,
          ethers.keccak256(ethers.toUtf8Bytes("PROVIDER002")),
          provider2Address,
          2, // RecordType.LabResult
          "QmDifferentCID",
          "Different Title",
          true
        )
      ).to.be.revertedWith("Record with this ID already exists.");
    });
  });

  describe("Input Validation", function () {
    it("Should reject empty record ID", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          samplePatientId,
          patient1Address,
          sampleProviderId,
          provider1Address,
          1, // RecordType.Encounter
          sampleCID,
          sampleTitle,
          false
        )
      ).to.be.revertedWith("Record ID cannot be empty.");
    });

    it("Should reject empty patient ID", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          patient1Address,
          sampleProviderId,
          provider1Address,
          1, // RecordType.Encounter
          sampleCID,
          sampleTitle,
          false
        )
      ).to.be.revertedWith("Patient ID cannot be empty.");
    });

    it("Should reject zero patient wallet address", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          samplePatientId,
          ethers.ZeroAddress,
          sampleProviderId,
          provider1Address,
          1, // RecordType.Encounter
          sampleCID,
          sampleTitle,
          false
        )
      ).to.be.revertedWith("Patient wallet address cannot be empty.");
    });

    it("Should reject empty provider ID", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          samplePatientId,
          patient1Address,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          provider1Address,
          1, // RecordType.Encounter
          sampleCID,
          sampleTitle,
          false
        )
      ).to.be.revertedWith("Provider ID cannot be empty.");
    });

    it("Should reject zero provider wallet address", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          samplePatientId,
          patient1Address,
          sampleProviderId,
          ethers.ZeroAddress,
          1, // RecordType.Encounter
          sampleCID,
          sampleTitle,
          false
        )
      ).to.be.revertedWith("Provider wallet address cannot be empty.");
    });

    it("Should reject None record type", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          samplePatientId,
          patient1Address,
          sampleProviderId,
          provider1Address,
          0, // RecordType.None
          sampleCID,
          sampleTitle,
          false
        )
      ).to.be.revertedWith("Invalid record type.");
    });

    it("Should reject empty record CID", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          samplePatientId,
          patient1Address,
          sampleProviderId,
          provider1Address,
          1, // RecordType.Encounter
          "",
          sampleTitle,
          false
        )
      ).to.be.revertedWith("Record CID cannot be empty.");
    });

    it("Should reject empty title", async function () {
      await expect(
        medicalRecords.addMedicalRecord(
          sampleRecordId,
          samplePatientId,
          patient1Address,
          sampleProviderId,
          provider1Address,
          1, // RecordType.Encounter
          sampleCID,
          "",
          false
        )
      ).to.be.revertedWith("Record title cannot be empty.");
    });
  });

  describe("Record Types", function () {
    it("Should support all record types", async function () {
      const recordTypes = [
        { type: 1, name: "Encounter" },
        { type: 2, name: "LabResult" },
        { type: 3, name: "ImagingReport" },
        { type: 4, name: "Prescription" },
        { type: 5, name: "Vaccination" },
        { type: 6, name: "Procedure" },
        { type: 7, name: "Consultation" }
      ];

      for (let i = 0; i < recordTypes.length; i++) {
        const recordId = ethers.keccak256(ethers.toUtf8Bytes(`RECORD${i + 1}`));
        
        await medicalRecords.addMedicalRecord(
          recordId,
          samplePatientId,
          patient1Address,
          sampleProviderId,
          provider1Address,
          recordTypes[i].type,
          `QmRecord${i + 1}CID`,
          `${recordTypes[i].name} Record`,
          false
        );

        const [, , , , , recordType] = await medicalRecords.getMedicalRecord(recordId);
        expect(recordType).to.equal(recordTypes[i].type);
      }
    });
  });

  describe("Medical Record Retrieval", function () {
    beforeEach(async function () {
      // Add a sample record before each test
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        sampleTitle,
        false
      );
    });

    it("Should return correct medical record information", async function () {
      const [
        recordId,
        patientId,
        patientWallet,
        providerId,
        providerWallet,
        recordType,
        recordCID,
        timestamp,
        title,
        isSensitive,
        ownerAddr
      ] = await medicalRecords.getMedicalRecord(sampleRecordId);

      expect(recordId).to.equal(sampleRecordId);
      expect(patientId).to.equal(samplePatientId);
      expect(patientWallet).to.equal(patient1Address);
      expect(providerId).to.equal(sampleProviderId);
      expect(providerWallet).to.equal(provider1Address);
      expect(recordType).to.equal(1); // Encounter
      expect(recordCID).to.equal(sampleCID);
      expect(title).to.equal(sampleTitle);
      expect(isSensitive).to.be.false;
      expect(ownerAddr).to.equal(ownerAddress);
      expect(timestamp).to.be.gt(0);
    });

    it("Should revert when trying to get non-existent record", async function () {
      const nonExistentId = ethers.keccak256(ethers.toUtf8Bytes("NONEXISTENT"));
      
      await expect(
        medicalRecords.getMedicalRecord(nonExistentId)
      ).to.be.revertedWith("Record not found.");
    });

    it("Should return correct patient record IDs", async function () {
      const recordIds = await medicalRecords.getPatientRecordIds(samplePatientId);
      
      expect(recordIds).to.have.lengthOf(1);
      expect(recordIds[0]).to.equal(sampleRecordId);
    });

    it("Should return empty array for patient with no records", async function () {
      const noRecordsPatientId = ethers.keccak256(ethers.toUtf8Bytes("NORECORDS"));
      const recordIds = await medicalRecords.getPatientRecordIds(noRecordsPatientId);
      
      expect(recordIds).to.have.lengthOf(0);
    });
  });

  describe("Medical Record CID Update", function () {
    beforeEach(async function () {
      // Add a sample record before each test
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        sampleTitle,
        false
      );
    });

    it("Should update medical record CID successfully", async function () {
      await expect(
        medicalRecords.updateMedicalRecordCID(sampleRecordId, updatedCID)
      )
        .to.emit(medicalRecords, "MedicalRecordCIDUpdated")
        .withArgs(sampleRecordId, updatedCID, ownerAddress);
    });

    it("Should store updated CID correctly", async function () {
      await medicalRecords.updateMedicalRecordCID(sampleRecordId, updatedCID);

      const [, , , , , , recordCID] = await medicalRecords.getMedicalRecord(sampleRecordId);
      expect(recordCID).to.equal(updatedCID);
    });

    it("Should preserve other record information during CID update", async function () {
      const [
        originalRecordId,
        originalPatientId,
        originalPatientWallet,
        originalProviderId,
        originalProviderWallet,
        originalRecordType,
        ,
        originalTimestamp,
        originalTitle,
        originalIsSensitive,
        originalOwner
      ] = await medicalRecords.getMedicalRecord(sampleRecordId);

      await medicalRecords.updateMedicalRecordCID(sampleRecordId, updatedCID);

      const [
        newRecordId,
        newPatientId,
        newPatientWallet,
        newProviderId,
        newProviderWallet,
        newRecordType,
        newRecordCID,
        newTimestamp,
        newTitle,
        newIsSensitive,
        newOwner
      ] = await medicalRecords.getMedicalRecord(sampleRecordId);

      expect(newRecordId).to.equal(originalRecordId);
      expect(newPatientId).to.equal(originalPatientId);
      expect(newPatientWallet).to.equal(originalPatientWallet);
      expect(newProviderId).to.equal(originalProviderId);
      expect(newProviderWallet).to.equal(originalProviderWallet);
      expect(newRecordType).to.equal(originalRecordType);
      expect(newRecordCID).to.equal(updatedCID);
      expect(newTimestamp).to.equal(originalTimestamp); // Timestamp should not change
      expect(newTitle).to.equal(originalTitle);
      expect(newIsSensitive).to.equal(originalIsSensitive);
      expect(newOwner).to.equal(originalOwner);
    });

    it("Should reject update for non-existent record", async function () {
      const nonExistentId = ethers.keccak256(ethers.toUtf8Bytes("NONEXISTENT"));
      
      await expect(
        medicalRecords.updateMedicalRecordCID(nonExistentId, updatedCID)
      ).to.be.revertedWith("Record not found.");
    });

    it("Should reject empty CID update", async function () {
      await expect(
        medicalRecords.updateMedicalRecordCID(sampleRecordId, "")
      ).to.be.revertedWith("New record CID cannot be empty.");
    });
  });

  describe("Sensitive Records", function () {
    it("Should handle sensitive flag correctly", async function () {
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        4, // RecordType.Prescription
        sampleCID,
        "Psychiatric Medication Prescription",
        true // Sensitive
      );

      const [, , , , , , , , , isSensitive] = await medicalRecords.getMedicalRecord(sampleRecordId);
      expect(isSensitive).to.be.true;
    });

    it("Should handle non-sensitive flag correctly", async function () {
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        5, // RecordType.Vaccination
        sampleCID,
        "COVID-19 Vaccination",
        false // Not Sensitive
      );

      const [, , , , , , , , , isSensitive] = await medicalRecords.getMedicalRecord(sampleRecordId);
      expect(isSensitive).to.be.false;
    });
  });

  describe("Edge Cases and Complex Scenarios", function () {
    it("Should handle very long CID strings", async function () {
      const longCID = "Qm" + "a".repeat(1000);

      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        longCID,
        sampleTitle,
        false
      );

      const [, , , , , , recordCID] = await medicalRecords.getMedicalRecord(sampleRecordId);
      expect(recordCID).to.equal(longCID);
    });

    it("Should handle very long titles", async function () {
      const longTitle = "A".repeat(500);

      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        longTitle,
        false
      );

      const [, , , , , , , , title] = await medicalRecords.getMedicalRecord(sampleRecordId);
      expect(title).to.equal(longTitle);
    });

    it("Should maintain separate record lists for different patients", async function () {
      const patient2Id = ethers.keccak256(ethers.toUtf8Bytes("PATIENT002"));
      const record1Id = ethers.keccak256(ethers.toUtf8Bytes("RECORD001"));
      const record2Id = ethers.keccak256(ethers.toUtf8Bytes("RECORD002"));

      // Add record for patient 1
      await medicalRecords.addMedicalRecord(
        record1Id,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        "Patient 1 Record",
        false
      );

      // Add record for patient 2
      await medicalRecords.addMedicalRecord(
        record2Id,
        patient2Id,
        patient2Address,
        sampleProviderId,
        provider1Address,
        2, // RecordType.LabResult
        "QmPatient2CID",
        "Patient 2 Record",
        true
      );

      const patient1Records = await medicalRecords.getPatientRecordIds(samplePatientId);
      const patient2Records = await medicalRecords.getPatientRecordIds(patient2Id);

      expect(patient1Records).to.have.lengthOf(1);
      expect(patient2Records).to.have.lengthOf(1);
      expect(patient1Records[0]).to.equal(record1Id);
      expect(patient2Records[0]).to.equal(record2Id);
    });

    it("Should handle timestamp consistency", async function () {
      await medicalRecords.addMedicalRecord(
        sampleRecordId,
        samplePatientId,
        patient1Address,
        sampleProviderId,
        provider1Address,
        1, // RecordType.Encounter
        sampleCID,
        sampleTitle,
        false
      );

      const [, , , , , , , timestamp] = await medicalRecords.getMedicalRecord(sampleRecordId);
      
      expect(Number(timestamp)).to.be.gt(0);
      
      // Ensure timestamp is within reasonable range (not too far in the past or future)
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(Number(timestamp) - currentTime);
      expect(timeDiff).to.be.lt(300); // Within 5 minutes
    });
  });
});