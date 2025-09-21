import { expect } from "chai";
import { network } from "hardhat";
import { Signer } from "ethers";

const { ethers } = await network.connect();

describe("PatientRegistry", function () {
  let patientRegistry: any;
  let owner: Signer;
  let patient1: Signer;
  let patient2: Signer;
  let patient1Address: string;
  let patient2Address: string;

  beforeEach(async function () {
    // Get signers
    [owner, patient1, patient2] = await ethers.getSigners();
    patient1Address = await patient1.getAddress();
    patient2Address = await patient2.getAddress();

    // Deploy the PatientRegistry contract
    patientRegistry = await ethers.deployContract("PatientRegistry");
  });

  describe("Patient Registration", function () {
    it("Should register a new patient successfully", async function () {
      const name = "John Doe";
      const age = 30;
      const diagnosis = "Hypertension";

      await expect(
        patientRegistry.registerPatient(patient1Address, name, age, diagnosis)
      )
        .to.emit(patientRegistry, "PatientRegistered")
        .withArgs(patient1Address, name, age, diagnosis);
    });

    it("Should store patient information correctly", async function () {
      const name = "Jane Smith";
      const age = 25;
      const diagnosis = "Diabetes";

      await patientRegistry.registerPatient(patient1Address, name, age, diagnosis);

      const [storedName, storedAge, storedDiagnosis] = await patientRegistry.getPatient(patient1Address);
      
      expect(storedName).to.equal(name);
      expect(storedAge).to.equal(age);
      expect(storedDiagnosis).to.equal(diagnosis);
    });

    it("Should not allow registering the same patient twice", async function () {
      const name = "John Doe";
      const age = 30;
      const diagnosis = "Hypertension";

      // Register patient first time
      await patientRegistry.registerPatient(patient1Address, name, age, diagnosis);

      // Attempt to register same patient again
      await expect(
        patientRegistry.registerPatient(patient1Address, "Different Name", 35, "Different Diagnosis")
      ).to.be.revertedWith("Patient already registered.");
    });

    it("Should allow registering multiple different patients", async function () {
      const patient1Name = "John Doe";
      const patient2Name = "Jane Smith";

      await patientRegistry.registerPatient(patient1Address, patient1Name, 30, "Hypertension");
      await patientRegistry.registerPatient(patient2Address, patient2Name, 25, "Diabetes");

      const [name1] = await patientRegistry.getPatient(patient1Address);
      const [name2] = await patientRegistry.getPatient(patient2Address);

      expect(name1).to.equal(patient1Name);
      expect(name2).to.equal(patient2Name);
    });
  });

  describe("Patient Information Retrieval", function () {
    it("Should return correct patient information", async function () {
      const name = "Alice Johnson";
      const age = 28;
      const diagnosis = "Asthma";

      await patientRegistry.registerPatient(patient1Address, name, age, diagnosis);

      const [retrievedName, retrievedAge, retrievedDiagnosis] = await patientRegistry.getPatient(patient1Address);

      expect(retrievedName).to.equal(name);
      expect(retrievedAge).to.equal(age);
      expect(retrievedDiagnosis).to.equal(diagnosis);
    });

    it("Should revert when trying to get non-existent patient", async function () {
      await expect(
        patientRegistry.getPatient(patient1Address)
      ).to.be.revertedWith("Patient not found.");
    });
  });

  describe("Patient Diagnosis Update", function () {
    beforeEach(async function () {
      // Register a patient before each test
      await patientRegistry.registerPatient(patient1Address, "Test Patient", 30, "Initial Diagnosis");
    });

    it("Should update patient diagnosis successfully", async function () {
      const newDiagnosis = "Updated Diagnosis";

      await patientRegistry.updatePatientDiagnosis(patient1Address, newDiagnosis);

      const [, , updatedDiagnosis] = await patientRegistry.getPatient(patient1Address);
      expect(updatedDiagnosis).to.equal(newDiagnosis);
    });

    it("Should not affect other patient information when updating diagnosis", async function () {
      const originalName = "Test Patient";
      const originalAge = 30;
      const newDiagnosis = "Updated Diagnosis";

      await patientRegistry.updatePatientDiagnosis(patient1Address, newDiagnosis);

      const [name, age, diagnosis] = await patientRegistry.getPatient(patient1Address);
      
      expect(name).to.equal(originalName);
      expect(age).to.equal(originalAge);
      expect(diagnosis).to.equal(newDiagnosis);
    });

    it("Should revert when trying to update diagnosis for non-existent patient", async function () {
      await expect(
        patientRegistry.updatePatientDiagnosis(patient2Address, "Some Diagnosis")
      ).to.be.revertedWith("Patient not found.");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty strings for name and diagnosis", async function () {
      const name = "";
      const diagnosis = "";
      const age = 0;

      await expect(
        patientRegistry.registerPatient(patient1Address, name, age, diagnosis)
      ).to.emit(patientRegistry, "PatientRegistered");

      const [storedName, storedAge, storedDiagnosis] = await patientRegistry.getPatient(patient1Address);
      
      expect(storedName).to.equal(name);
      expect(storedAge).to.equal(age);
      expect(storedDiagnosis).to.equal(diagnosis);
    });

    it("Should handle very long strings for name and diagnosis", async function () {
      const longName = "A".repeat(1000);
      const longDiagnosis = "B".repeat(1000);
      const age = 50;

      await patientRegistry.registerPatient(patient1Address, longName, age, longDiagnosis);

      const [storedName, storedAge, storedDiagnosis] = await patientRegistry.getPatient(patient1Address);
      
      expect(storedName).to.equal(longName);
      expect(storedAge).to.equal(age);
      expect(storedDiagnosis).to.equal(longDiagnosis);
    });

    it("Should handle maximum uint256 age", async function () {
      const maxAge = ethers.MaxUint256;

      await patientRegistry.registerPatient(patient1Address, "Old Patient", maxAge, "Age-related condition");

      const [, storedAge] = await patientRegistry.getPatient(patient1Address);
      expect(storedAge).to.equal(maxAge);
    });
  });
});