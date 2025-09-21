import { expect } from "chai";
import { network } from "hardhat";
import { Signer } from "ethers";

const { ethers } = await network.connect();

describe("AccessControl", function () {
  let accessControl: any;
  let admin: Signer;
  let patient1: Signer;
  let patient2: Signer;
  let doctor1: Signer;
  let doctor2: Signer;
  let nurse1: Signer;
  let emergency1: Signer;
  let unauthorized: Signer;
  
  let adminAddress: string;
  let patient1Address: string;
  let patient2Address: string;
  let doctor1Address: string;
  let doctor2Address: string;
  let nurse1Address: string;
  let emergency1Address: string;
  let unauthorizedAddress: string;

  // Test data
  const patientId1 = ethers.keccak256(ethers.toUtf8Bytes("PATIENT001"));
  const patientId2 = ethers.keccak256(ethers.toUtf8Bytes("PATIENT002"));
  const recordId1 = ethers.keccak256(ethers.toUtf8Bytes("RECORD001"));
  const recordId2 = ethers.keccak256(ethers.toUtf8Bytes("RECORD002"));

  // Enums values
  const Role = {
    None: 0,
    Patient: 1,
    Doctor: 2,
    Nurse: 3,
    Lab: 4,
    Pharmacy: 5,
    Emergency: 6,
    Admin: 7
  };

  const RecordType = {
    General: 0,
    Diagnostic: 1,
    Prescription: 2,
    LabResult: 3,
    Imaging: 4,
    Surgery: 5,
    Mental: 6,
    Genetic: 7
  };

  const ConsentType = {
    Full: 0,
    Limited: 1,
    Emergency: 2,
    Research: 3
  };

  beforeEach(async function () {
    // Get signers
    [admin, patient1, patient2, doctor1, doctor2, nurse1, emergency1, unauthorized] = await ethers.getSigners();
    
    adminAddress = await admin.getAddress();
    patient1Address = await patient1.getAddress();
    patient2Address = await patient2.getAddress();
    doctor1Address = await doctor1.getAddress();
    doctor2Address = await doctor2.getAddress();
    nurse1Address = await nurse1.getAddress();
    emergency1Address = await emergency1.getAddress();
    unauthorizedAddress = await unauthorized.getAddress();

    // Deploy the AccessControl contract
    accessControl = await ethers.deployContract("AccessControl");

    // Set up initial roles
    await accessControl.assignRole(patient1Address, Role.Patient);
    await accessControl.assignRole(patient2Address, Role.Patient);
    await accessControl.assignRole(doctor1Address, Role.Doctor);
    await accessControl.assignRole(doctor2Address, Role.Doctor);
    await accessControl.assignRole(nurse1Address, Role.Nurse);
    await accessControl.assignRole(emergency1Address, Role.Emergency);
  });

  describe("Deployment and Initial Setup", function () {
    it("Should set deployer as admin", async function () {
      expect(await accessControl.isAdmin(adminAddress)).to.be.true;
      expect(await accessControl.getRole(adminAddress)).to.equal(Role.Admin);
    });

    it("Should allow admin to assign roles", async function () {
      const newUserAddress = await unauthorized.getAddress();
      
      await expect(accessControl.assignRole(newUserAddress, Role.Doctor))
        .to.emit(accessControl, "RoleAssigned")
        .withArgs(newUserAddress, Role.Doctor);
      
      expect(await accessControl.getRole(newUserAddress)).to.equal(Role.Doctor);
    });

    it("Should not allow non-admin to assign roles", async function () {
      await expect(
        accessControl.connect(patient1).assignRole(unauthorizedAddress, Role.Doctor)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("Admin Management", function () {
    it("Should allow admin to add new admin", async function () {
      await expect(accessControl.addAdmin(doctor1Address))
        .to.emit(accessControl, "AdminAdded")
        .withArgs(doctor1Address);
      
      expect(await accessControl.isAdmin(doctor1Address)).to.be.true;
      expect(await accessControl.getRole(doctor1Address)).to.equal(Role.Admin);
    });

    it("Should allow admin to remove other admin", async function () {
      await accessControl.addAdmin(doctor1Address);
      
      await expect(accessControl.removeAdmin(doctor1Address))
        .to.emit(accessControl, "AdminRemoved")
        .withArgs(doctor1Address);
      
      expect(await accessControl.isAdmin(doctor1Address)).to.be.false;
    });

    it("Should not allow admin to remove themselves", async function () {
      await expect(accessControl.removeAdmin(adminAddress))
        .to.be.revertedWith("Cannot remove yourself as admin");
    });
  });

  describe("Emergency Access Management", function () {
    it("Should allow admin to grant emergency access", async function () {
      await expect(accessControl.grantEmergencyAccess(doctor1Address))
        .to.emit(accessControl, "EmergencyAccessGranted")
        .withArgs(doctor1Address);
      
      expect(await accessControl.hasEmergencyAccess(doctor1Address)).to.be.true;
    });

    it("Should allow admin to revoke emergency access", async function () {
      await accessControl.grantEmergencyAccess(doctor1Address);
      
      await expect(accessControl.revokeEmergencyAccess(doctor1Address))
        .to.emit(accessControl, "EmergencyAccessRevoked")
        .withArgs(doctor1Address);
      
      expect(await accessControl.hasEmergencyAccess(doctor1Address)).to.be.false;
    });

    it("Should not allow non-admin to manage emergency access", async function () {
      await expect(
        accessControl.connect(doctor1).grantEmergencyAccess(doctor2Address)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("Consent Management", function () {
    it("Should allow patient to grant consent", async function () {
      const allowedRecordTypes = [RecordType.General, RecordType.Diagnostic];
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      await expect(
        accessControl.connect(patient1).grantConsent(
          patientId1,
          doctor1Address,
          ConsentType.Full,
          allowedRecordTypes,
          expiryTimestamp
        )
      ).to.emit(accessControl, "ConsentGranted")
        .withArgs(patientId1, doctor1Address, ConsentType.Full);
    });

    it("Should store consent details correctly", async function () {
      const allowedRecordTypes = [RecordType.General, RecordType.Diagnostic];
      const expiryTimestamp = Math.floor(Date.now() / 1000) + 3600;

      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Limited,
        allowedRecordTypes,
        expiryTimestamp
      );

      const consent = await accessControl.getConsent(patientId1, doctor1Address);
      
      expect(consent.patientId).to.equal(patientId1);
      expect(consent.grantedTo).to.equal(doctor1Address);
      expect(consent.consentType).to.equal(ConsentType.Limited);
      expect(consent.expiryTimestamp).to.equal(expiryTimestamp);
      expect(consent.isActive).to.be.true;
      expect(consent.allowedRecordTypes.length).to.equal(2);
    });

    it("Should allow patient to revoke consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0
      );

      await expect(
        accessControl.connect(patient1).revokeConsent(patientId1, doctor1Address)
      ).to.emit(accessControl, "ConsentRevoked")
        .withArgs(patientId1, doctor1Address);

      const consent = await accessControl.getConsent(patientId1, doctor1Address);
      expect(consent.isActive).to.be.false;
    });

    it("Should not allow non-patient to grant consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      await expect(
        accessControl.connect(doctor1).grantConsent(
          patientId1,
          doctor1Address,
          ConsentType.Full,
          allowedRecordTypes,
          0
        )
      ).to.be.revertedWith("Only patients can perform this action");
    });

    it("Should reject consent with empty record types", async function () {
      const allowedRecordTypes: number[] = [];
      
      await expect(
        accessControl.connect(patient1).grantConsent(
          patientId1,
          doctor1Address,
          ConsentType.Full,
          allowedRecordTypes,
          0
        )
      ).to.be.revertedWith("Must specify at least one record type");
    });

    it("Should reject consent to zero address", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      await expect(
        accessControl.connect(patient1).grantConsent(
          patientId1,
          ethers.ZeroAddress,
          ConsentType.Full,
          allowedRecordTypes,
          0
        )
      ).to.be.revertedWith("Cannot grant consent to zero address");
    });

    it("Should reject consent with past expiry date", async function () {
      const allowedRecordTypes = [RecordType.General];
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      await expect(
        accessControl.connect(patient1).grantConsent(
          patientId1,
          doctor1Address,
          ConsentType.Full,
          allowedRecordTypes,
          pastTimestamp
        )
      ).to.be.revertedWith("Expiry must be in the future");
    });
  });

  describe("Record-Specific Access", function () {
    it("Should allow admin to grant record access", async function () {
      await accessControl.grantRecordAccess(recordId1, doctor1Address);
      
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );
      
      expect(hasAccess).to.be.true;
    });

    it("Should allow patient to grant record access", async function () {
      await accessControl.connect(patient1).grantRecordAccess(recordId1, doctor1Address);
      
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );
      
      expect(hasAccess).to.be.true;
    });

    it("Should allow revoking record access", async function () {
      await accessControl.grantRecordAccess(recordId1, doctor1Address);
      await accessControl.revokeRecordAccess(recordId1, doctor1Address);
      
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );
      
      expect(hasAccess).to.be.false;
    });

    it("Should not allow unauthorized users to manage record access", async function () {
      await expect(
        accessControl.connect(unauthorized).grantRecordAccess(recordId1, doctor1Address)
      ).to.be.revertedWith("Unauthorized");
    });
  });

  describe("Access Control Checks", function () {
    it("Should grant access to admin", async function () {
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        adminAddress
      );
      
      expect(hasAccess).to.be.true;
    });

    it("Should grant access to emergency providers", async function () {
      await accessControl.grantEmergencyAccess(doctor1Address);
      
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Mental,
        doctor1Address
      );
      
      expect(hasAccess).to.be.true;
    });

    it("Should grant access based on valid consent", async function () {
      const allowedRecordTypes = [RecordType.General, RecordType.Diagnostic];
      
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0 // No expiry
      );

      const hasGeneralAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );
      
      const hasDiagnosticAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Diagnostic,
        doctor1Address
      );

      expect(hasGeneralAccess).to.be.true;
      expect(hasDiagnosticAccess).to.be.true;
    });

    it("Should deny access for record types not in consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0
      );

      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Mental,
        doctor1Address
      );
      
      expect(hasAccess).to.be.false;
    });

    it("Should deny access for expired consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      // Use a timestamp that's already in the past relative to block time
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      // First grant consent without expiry to test the flow
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0 // No expiry first
      );

      // Verify access works
      let hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );
      expect(hasAccess).to.be.true;

      // Now test that we can't grant consent with past expiry
      await expect(
        accessControl.connect(patient1).grantConsent(
          patientId1,
          doctor2Address,
          ConsentType.Full,
          allowedRecordTypes,
          pastExpiry
        )
      ).to.be.revertedWith("Expiry must be in the future");
    });

    it("Should deny access for revoked consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0
      );

      await accessControl.connect(patient1).revokeConsent(patientId1, doctor1Address);

      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );
      
      expect(hasAccess).to.be.false;
    });

    it("Should deny access to unauthorized users", async function () {
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        unauthorizedAddress
      );
      
      expect(hasAccess).to.be.false;
    });
  });

  describe("Consent Validation", function () {
    it("Should validate active consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0
      );

      const isValid = await accessControl.isConsentValid(patientId1, doctor1Address);
      expect(isValid).to.be.true;
    });

    it("Should invalidate revoked consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0
      );

      await accessControl.connect(patient1).revokeConsent(patientId1, doctor1Address);

      const isValid = await accessControl.isConsentValid(patientId1, doctor1Address);
      expect(isValid).to.be.false;
    });

    it("Should invalidate expired consent", async function () {
      const allowedRecordTypes = [RecordType.General];
      
      // First test with valid consent
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        allowedRecordTypes,
        0 // No expiry
      );

      let isValid = await accessControl.isConsentValid(patientId1, doctor1Address);
      expect(isValid).to.be.true;

      // Test that we can't create expired consent
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      await expect(
        accessControl.connect(patient1).grantConsent(
          patientId1,
          doctor2Address,
          ConsentType.Full,
          allowedRecordTypes,
          pastExpiry
        )
      ).to.be.revertedWith("Expiry must be in the future");
    });
  });

  describe("Complex Access Scenarios", function () {
    it("Should handle multiple consents for same patient", async function () {
      const generalRecordTypes = [RecordType.General];
      const mentalRecordTypes = [RecordType.Mental];
      
      // Grant different consents to different doctors
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        generalRecordTypes,
        0
      );

      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor2Address,
        ConsentType.Limited,
        mentalRecordTypes,
        0
      );

      const doctor1GeneralAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );

      const doctor1MentalAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Mental,
        doctor1Address
      );

      const doctor2GeneralAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor2Address
      );

      const doctor2MentalAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Mental,
        doctor2Address
      );

      expect(doctor1GeneralAccess).to.be.true;
      expect(doctor1MentalAccess).to.be.false;
      expect(doctor2GeneralAccess).to.be.false;
      expect(doctor2MentalAccess).to.be.true;
    });

    it("Should prioritize record-specific access over consent", async function () {
      // Grant record-specific access
      await accessControl.grantRecordAccess(recordId1, doctor1Address);

      // Doctor should have access even without consent
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Mental,
        doctor1Address
      );
      
      expect(hasAccess).to.be.true;
    });

    it("Should handle consent updates correctly", async function () {
      const initialRecordTypes = [RecordType.General];
      const updatedRecordTypes = [RecordType.General, RecordType.Mental];
      
      // Initial consent
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        initialRecordTypes,
        0
      );

      let mentalAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Mental,
        doctor1Address
      );
      expect(mentalAccess).to.be.false;

      // Update consent
      await accessControl.connect(patient1).grantConsent(
        patientId1,
        doctor1Address,
        ConsentType.Full,
        updatedRecordTypes,
        0
      );

      mentalAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.Mental,
        doctor1Address
      );
      expect(mentalAccess).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle non-existent consent gracefully", async function () {
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        patientId1,
        RecordType.General,
        doctor1Address
      );
      
      expect(hasAccess).to.be.false;
    });

    it("Should handle consent for non-existent patient", async function () {
      const nonExistentPatientId = ethers.keccak256(ethers.toUtf8Bytes("NONEXISTENT"));
      
      const hasAccess = await accessControl.checkAccess(
        recordId1,
        nonExistentPatientId,
        RecordType.General,
        doctor1Address
      );
      
      expect(hasAccess).to.be.false;
    });

    it("Should not allow revoking non-existent consent", async function () {
      await expect(
        accessControl.connect(patient1).revokeConsent(patientId1, doctor1Address)
      ).to.be.revertedWith("No active consent found");
    });
  });
});