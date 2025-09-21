// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MedicalRecords
 * @dev Smart contract for managing decentralized medical records
 */
contract MedicalRecords is Ownable, ReentrancyGuard, Pausable {
    
    // User profile structure
    struct UserProfile {
        string name;
        string email;
        string publicKey;
        uint256 createdAt;
        bool isActive;
        string profileIPFSHash;
    }
    
    // Medical record structure
    struct MedicalRecord {
        uint256 id;
        address owner;
        string title;
        string description;
        string category;
        string ipfsHash;
        string encryptedKey;
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
        string[] tags;
    }
    
    // Access control structure
    struct AccessGrant {
        address grantee;
        uint256 recordId;
        uint256 expiresAt;
        bool isActive;
        string encryptedKeyForGrantee;
    }
    
    // Mappings
    mapping(address => UserProfile) public userProfiles;
    mapping(uint256 => MedicalRecord) public records;
    mapping(uint256 => mapping(address => AccessGrant)) public accessGrants;
    mapping(address => uint256[]) public patientRecords;
    
    // Counters
    uint256 public recordCounter;
    uint256 public userCounter;
    
    // Events
    event UserRegistered(address indexed user, string name, uint256 timestamp);
    event RecordCreated(uint256 indexed recordId, address indexed owner, string title, uint256 timestamp);
    event AccessGranted(uint256 indexed recordId, address indexed owner, address indexed grantee, uint256 timestamp);
    
    constructor() {
        recordCounter = 0;
        userCounter = 0;
    }
    
    /**
     * @dev Register a new user profile
     */
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _publicKey,
        string memory _profileIPFSHash
    ) external {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        require(!userProfiles[msg.sender].isActive, "User already registered");
        
        userProfiles[msg.sender] = UserProfile({
            name: _name,
            email: _email,
            publicKey: _publicKey,
            createdAt: block.timestamp,
            isActive: true,
            profileIPFSHash: _profileIPFSHash
        });
        
        userCounter++;
        emit UserRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Get user profile
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        require(userProfiles[_user].isActive, "User not found or inactive");
        return userProfiles[_user];
    }
    
    /**
     * @dev Add a new medical record
     */
    function addRecord(
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _ipfsHash,
        string memory _encryptedKey,
        string[] memory _tags
    ) external whenNotPaused nonReentrant {
        require(userProfiles[msg.sender].isActive, "User not registered");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_encryptedKey).length > 0, "Encrypted key cannot be empty");
        
        recordCounter++;
        
        records[recordCounter] = MedicalRecord({
            id: recordCounter,
            owner: msg.sender,
            title: _title,
            description: _description,
            category: _category,
            ipfsHash: _ipfsHash,
            encryptedKey: _encryptedKey,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true,
            tags: _tags
        });
        
        patientRecords[msg.sender].push(recordCounter);
        emit RecordCreated(recordCounter, msg.sender, _title, block.timestamp);
    }
    
    /**
     * @dev Get a medical record (only owner or authorized users)
     */
    function getRecord(uint256 _recordId) external view returns (MedicalRecord memory) {
        require(_recordId > 0 && _recordId <= recordCounter, "Record does not exist");
        require(records[_recordId].isActive, "Record is not active");
        
        MedicalRecord memory record = records[_recordId];
        
        // Check if caller is owner or has access
        require(
            record.owner == msg.sender || 
            (accessGrants[_recordId][msg.sender].isActive && 
             (accessGrants[_recordId][msg.sender].expiresAt == 0 || 
              accessGrants[_recordId][msg.sender].expiresAt > block.timestamp)),
            "Access denied"
        );
        
        return record;
    }
    
    /**
     * @dev Grant access to a medical record
     */
    function grantAccess(
        uint256 _recordId,
        address _grantee,
        uint256 _expiresAt,
        string memory _encryptedKeyForGrantee
    ) external whenNotPaused nonReentrant {
        require(_recordId > 0 && _recordId <= recordCounter, "Record does not exist");
        require(records[_recordId].owner == msg.sender, "Only owner can grant access");
        require(_grantee != address(0), "Invalid grantee address");
        require(_grantee != msg.sender, "Cannot grant access to yourself");
        require(userProfiles[_grantee].isActive, "Grantee not registered");
        require(bytes(_encryptedKeyForGrantee).length > 0, "Encrypted key for grantee required");
        
        accessGrants[_recordId][_grantee] = AccessGrant({
            grantee: _grantee,
            recordId: _recordId,
            expiresAt: _expiresAt,
            isActive: true,
            encryptedKeyForGrantee: _encryptedKeyForGrantee
        });
        
        emit AccessGranted(_recordId, msg.sender, _grantee, block.timestamp);
    }
    
    /**
     * @dev Get patient's records
     */
    function getPatientRecords(address _patient) external view returns (uint256[] memory) {
        require(_patient == msg.sender, "Access denied");
        return patientRecords[_patient];
    }
}
