import { expect } from "chai";
import { network } from "hardhat";
import { Signer } from "ethers";

const { ethers } = await network.connect();

describe("ProviderRegistry", function () {
  let providerRegistry: any;
  let owner: Signer;
  let provider1: Signer;
  let provider2: Signer;
  let admin: Signer;
  let provider1Address: string;
  let provider2Address: string;
  let adminAddress: string;

  // Test data
  const sampleProviderId = ethers.keccak256(ethers.toUtf8Bytes("PROVIDER001"));
  const sampleCID = "QmXoYPCVmRVWGJKgKG4Qg9Kq2nHvB2xr3j8k3q8XaHbRdX";
  const updatedCID = "QmYpZPCVmRVWGJKgKG4Qg9Kq2nHvB2xr3j8k3q8XaHbRdY";

  beforeEach(async function () {
    // Get signers
    [owner, provider1, provider2, admin] = await ethers.getSigners();
    provider1Address = await provider1.getAddress();
    provider2Address = await provider2.getAddress();
    adminAddress = await admin.getAddress();

    // Deploy the ProviderRegistry contract
    providerRegistry = await ethers.deployContract("ProviderRegistry");
  });

  describe("Provider Registration", function () {
    it("Should register a new provider successfully", async function () {
      await expect(
        providerRegistry.registerProvider(
          provider1Address,
          sampleProviderId,
          sampleCID,
          1 // ProviderType.Doctor
        )
      )
        .to.emit(providerRegistry, "ProviderRegistered")
        .withArgs(provider1Address, sampleProviderId, 1, sampleCID);
    });

    it("Should store provider information correctly", async function () {
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        2 // ProviderType.Clinic
      );

      const [
        providerId,
        providerDetailsCID,
        providerType,
        createdAt,
        updatedAt,
        providerAddress
      ] = await providerRegistry.getProviderProfile(provider1Address);

      expect(providerId).to.equal(sampleProviderId);
      expect(providerDetailsCID).to.equal(sampleCID);
      expect(providerType).to.equal(2); // ProviderType.Clinic
      expect(providerAddress).to.equal(provider1Address);
      expect(createdAt).to.equal(updatedAt); // Should be same on creation
      expect(createdAt).to.be.gt(0); // Should have a timestamp
    });

    it("Should mark provider as registered", async function () {
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );

      expect(await providerRegistry.isProviderRegistered(provider1Address)).to.be.true;
    });

    it("Should not allow registering the same provider twice", async function () {
      // Register provider first time
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );

      // Attempt to register same provider again
      await expect(
        providerRegistry.registerProvider(
          provider1Address,
          ethers.keccak256(ethers.toUtf8Bytes("PROVIDER002")),
          "QmDifferentCID",
          2 // ProviderType.Clinic
        )
      ).to.be.revertedWith("Provider already registered.");
    });

    it("Should allow registering multiple different providers", async function () {
      const provider2Id = ethers.keccak256(ethers.toUtf8Bytes("PROVIDER002"));
      const provider2CID = "QmProvider2CID";

      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );

      await providerRegistry.registerProvider(
        provider2Address,
        provider2Id,
        provider2CID,
        3 // ProviderType.Lab
      );

      expect(await providerRegistry.isProviderRegistered(provider1Address)).to.be.true;
      expect(await providerRegistry.isProviderRegistered(provider2Address)).to.be.true;

      const [, , type1] = await providerRegistry.getProviderProfile(provider1Address);
      const [, , type2] = await providerRegistry.getProviderProfile(provider2Address);

      expect(type1).to.equal(1); // Doctor
      expect(type2).to.equal(3); // Lab
    });

    it("Should reject registration with None provider type", async function () {
      await expect(
        providerRegistry.registerProvider(
          provider1Address,
          sampleProviderId,
          sampleCID,
          0 // ProviderType.None
        )
      ).to.be.revertedWith("Invalid provider type.");
    });

    it("Should reject registration with empty provider ID", async function () {
      await expect(
        providerRegistry.registerProvider(
          provider1Address,
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          sampleCID,
          1 // ProviderType.Doctor
        )
      ).to.be.revertedWith("Provider ID cannot be empty.");
    });

    it("Should reject registration with empty CID", async function () {
      await expect(
        providerRegistry.registerProvider(
          provider1Address,
          sampleProviderId,
          "",
          1 // ProviderType.Doctor
        )
      ).to.be.revertedWith("Provider details CID cannot be empty.");
    });
  });

  describe("Provider Types", function () {
    it("Should register different provider types correctly", async function () {
      const providerTypes = [
        { type: 1, name: "Doctor" },
        { type: 2, name: "Clinic" },
        { type: 3, name: "Lab" },
        { type: 4, name: "Hospital" },
        { type: 5, name: "Pharmacy" },
        { type: 6, name: "Specialist" }
      ];

      for (let i = 0; i < providerTypes.length; i++) {
        const signers = await ethers.getSigners();
        const providerAddress = await signers[i + 1].getAddress();
        const providerId = ethers.keccak256(ethers.toUtf8Bytes(`PROVIDER${i + 1}`));

        await providerRegistry.registerProvider(
          providerAddress,
          providerId,
          `QmProvider${i + 1}CID`,
          providerTypes[i].type
        );

        const [, , storedType] = await providerRegistry.getProviderProfile(providerAddress);
        expect(storedType).to.equal(providerTypes[i].type);
      }
    });
  });

  describe("Provider Details Update", function () {
    beforeEach(async function () {
      // Register a provider before each test
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );
    });

    it("Should allow registered provider to update their details CID", async function () {
      await expect(
        providerRegistry.connect(provider1).updateProviderDetailsCID(updatedCID)
      )
        .to.emit(providerRegistry, "ProviderDetailsUpdated")
        .withArgs(provider1Address, updatedCID);
    });

    it("Should update CID and timestamp correctly", async function () {
      const [, , , , initialUpdatedAt] = await providerRegistry.getProviderProfile(provider1Address);

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      await providerRegistry.connect(provider1).updateProviderDetailsCID(updatedCID);

      const [, newCID, , , newUpdatedAt] = await providerRegistry.getProviderProfile(provider1Address);

      expect(newCID).to.equal(updatedCID);
      expect(newUpdatedAt).to.be.gt(initialUpdatedAt);
    });

    it("Should not allow non-registered address to update details", async function () {
      await expect(
        providerRegistry.connect(provider2).updateProviderDetailsCID(updatedCID)
      ).to.be.revertedWith("Caller is not a registered provider.");
    });

    it("Should reject empty CID update", async function () {
      await expect(
        providerRegistry.connect(provider1).updateProviderDetailsCID("")
      ).to.be.revertedWith("New provider details CID cannot be empty.");
    });

    it("Should preserve other provider information during update", async function () {
      const [
        originalProviderId,
        ,
        originalProviderType,
        originalCreatedAt,
        ,
        originalProviderAddress
      ] = await providerRegistry.getProviderProfile(provider1Address);

      await providerRegistry.connect(provider1).updateProviderDetailsCID(updatedCID);

      const [
        newProviderId,
        newCID,
        newProviderType,
        newCreatedAt,
        ,
        newProviderAddress
      ] = await providerRegistry.getProviderProfile(provider1Address);

      expect(newProviderId).to.equal(originalProviderId);
      expect(newCID).to.equal(updatedCID);
      expect(newProviderType).to.equal(originalProviderType);
      expect(newCreatedAt).to.equal(originalCreatedAt);
      expect(newProviderAddress).to.equal(originalProviderAddress);
    });
  });

  describe("Provider Information Retrieval", function () {
    it("Should return correct provider profile", async function () {
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        4 // ProviderType.Hospital
      );

      const [
        providerId,
        providerDetailsCID,
        providerType,
        createdAt,
        updatedAt,
        providerAddress
      ] = await providerRegistry.getProviderProfile(provider1Address);

      expect(providerId).to.equal(sampleProviderId);
      expect(providerDetailsCID).to.equal(sampleCID);
      expect(providerType).to.equal(4); // Hospital
      expect(providerAddress).to.equal(provider1Address);
      expect(createdAt).to.be.gt(0);
      expect(updatedAt).to.be.gt(0);
    });

    it("Should revert when trying to get non-existent provider", async function () {
      await expect(
        providerRegistry.getProviderProfile(provider1Address)
      ).to.be.revertedWith("Provider not found.");
    });

    it("Should return correct registration status", async function () {
      expect(await providerRegistry.isProviderRegistered(provider1Address)).to.be.false;

      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );

      expect(await providerRegistry.isProviderRegistered(provider1Address)).to.be.true;
    });
  });

  describe("Provider Verification", function () {
    beforeEach(async function () {
      // Register a provider before each test
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );
    });

    it("Should set provider verification status", async function () {
      await expect(
        providerRegistry.setProviderVerificationStatus(provider1Address, true)
      )
        .to.emit(providerRegistry, "ProviderVerificationStatusChanged")
        .withArgs(provider1Address, true);
    });

    it("Should update verification status correctly", async function () {
      expect(await providerRegistry.getIsVerifiedProvider(provider1Address)).to.be.false;

      await providerRegistry.setProviderVerificationStatus(provider1Address, true);
      expect(await providerRegistry.getIsVerifiedProvider(provider1Address)).to.be.true;

      await providerRegistry.setProviderVerificationStatus(provider1Address, false);
      expect(await providerRegistry.getIsVerifiedProvider(provider1Address)).to.be.false;
    });

    it("Should not allow verification of non-existent provider", async function () {
      await expect(
        providerRegistry.setProviderVerificationStatus(provider2Address, true)
      ).to.be.revertedWith("Provider not found.");
    });

    it("Should return false for unverified providers", async function () {
      expect(await providerRegistry.getIsVerifiedProvider(provider1Address)).to.be.false;
    });

    it("Should return false for non-existent providers", async function () {
      expect(await providerRegistry.getIsVerifiedProvider(provider2Address)).to.be.false;
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle very long CID strings", async function () {
      const longCID = "Qm" + "a".repeat(1000);

      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        longCID,
        1 // ProviderType.Doctor
      );

      const [, storedCID] = await providerRegistry.getProviderProfile(provider1Address);
      expect(storedCID).to.equal(longCID);
    });

    it("Should handle different provider ID formats", async function () {
      const customId = ethers.keccak256(ethers.toUtf8Bytes("CUSTOM_PROVIDER_ID_123"));

      await providerRegistry.registerProvider(
        provider1Address,
        customId,
        sampleCID,
        1 // ProviderType.Doctor
      );

      const [storedId] = await providerRegistry.getProviderProfile(provider1Address);
      expect(storedId).to.equal(customId);
    });

    it("Should handle timestamps correctly", async function () {
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );

      const [, , , createdAt, updatedAt] = await providerRegistry.getProviderProfile(provider1Address);

      // Check that timestamps are reasonable (greater than 0 and not too far in the future)
      expect(Number(createdAt)).to.be.gt(0);
      expect(Number(updatedAt)).to.be.gt(0);
      expect(createdAt).to.equal(updatedAt);
      
      // Ensure timestamp is within a reasonable range (not too far in the past or future)
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(Number(createdAt) - currentTime);
      expect(timeDiff).to.be.lt(300); // Within 5 minutes
    });

    it("Should maintain separate verification states for different providers", async function () {
      const provider2Id = ethers.keccak256(ethers.toUtf8Bytes("PROVIDER002"));

      // Register two providers
      await providerRegistry.registerProvider(
        provider1Address,
        sampleProviderId,
        sampleCID,
        1 // ProviderType.Doctor
      );

      await providerRegistry.registerProvider(
        provider2Address,
        provider2Id,
        "QmProvider2CID",
        2 // ProviderType.Clinic
      );

      // Verify only one provider
      await providerRegistry.setProviderVerificationStatus(provider1Address, true);

      expect(await providerRegistry.getIsVerifiedProvider(provider1Address)).to.be.true;
      expect(await providerRegistry.getIsVerifiedProvider(provider2Address)).to.be.false;
    });
  });
});