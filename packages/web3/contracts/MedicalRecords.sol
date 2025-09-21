// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// You would typically import interfaces for external contracts if you needed
// to call functions on them to verify IDs. For simplicity, we'll assume
// the IDs are valid when passed in.
// import "./PatientRegistry.sol"; // If you had a deployed PatientRegistry
// import "./ProviderRegistry.sol"; // If you had a deployed ProviderRegistry


contract MedicalRecords {

    // Enum to define different types of medical records
    enum RecordType {
        None, // Default value
        Encounter,
        LabResult,
        ImagingReport,
        Prescription,
        Vaccination,
        Procedure,
        Consultation
    }

    // Struct to hold metadata for each medical record
    struct MedicalRecordMetadata {
        bytes32 recordId; // Unique ID for this specific record (e.g., keccak256 hash)
        bytes32 patientId; // Foreign Key to PatientRegistry, use PatientProfile.patientId
        address patientWallet; // The patient's controlling wallet
        bytes32 providerId; // Foreign Key to ProviderRegistry, use ProviderProfile.providerId
        address providerWallet; // The provider's controlling wallet
        RecordType recordType; // Type of record (e.g., Encounter, LabResult)
        string recordCID; // IPFS CID for the actual record's JSON metadata + file CIDs
        uint256 timestamp; // Creation timestamp
        string title; // Brief title for display on dashboard
        bool isSensitive; // Flag for extra privacy considerations (future access control)
        address owner; // The entity who initially created this record (e.g., provider, or patient for self-reported)
    }

    // Mapping from record ID to its full metadata
    mapping(bytes32 => MedicalRecordMetadata) public records;

    // Mapping from patientId to an array of their record IDs
    mapping(bytes32 => bytes32[]) public patientRecords;

    // Event to be emitted when a new medical record is added
    event MedicalRecordAdded(
        bytes32 indexed recordId,
        bytes32 indexed patientId,
        bytes32 indexed providerId,
        RecordType recordType,
        string recordCID,
        address owner
    );

    // Event for when a record's CID is updated
    event MedicalRecordCIDUpdated(
        bytes32 indexed recordId,
        string newRecordCID,
        address updater
    );

    // Constructor (optional, but good for setting an admin if needed later)
    address public owner; // Contract deployer

    constructor() {
        owner = msg.sender;
    }

    // Modifier to restrict functions to the contract owner/admin (future use)
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function.");
        _;
    }

    /**
     * @dev Adds a new medical record.
     * This function should ideally be called by a registered provider or the patient themselves.
     * For simplicity, no specific access control is enforced beyond parameter validation for now.
     * Access control (e.g., requiring msg.sender to be providerWallet or patientWallet, or a verified provider)
     * would be crucial here.
     *
     * @param _recordId A unique ID for this record. Recommend `keccak256(abi.encodePacked(_patientId, _providerId, block.timestamp, _title))` or similar.
     * @param _patientId The unique ID of the patient.
     * @param _patientWallet The wallet address of the patient.
     * @param _providerId The unique ID of the provider.
     * @param _providerWallet The wallet address of the provider.
     * @param _recordType The type of medical record (e.g., Encounter, LabResult).
     * @param _recordCID The IPFS CID for the actual record's content.
     * @param _title A brief title for the record.
     * @param _isSensitive Flag if the record contains sensitive information.
     */
    function addMedicalRecord(
        bytes32 _recordId,
        bytes32 _patientId,
        address _patientWallet,
        bytes32 _providerId,
        address _providerWallet,
        RecordType _recordType,
        string calldata _recordCID,
        string calldata _title,
        bool _isSensitive
    ) public {
        // --- Input Validations ---
        require(_recordId != bytes32(0), "Record ID cannot be empty.");
        require(records[_recordId].recordId == bytes32(0), "Record with this ID already exists.");
        require(_patientId != bytes32(0), "Patient ID cannot be empty.");
        require(_patientWallet != address(0), "Patient wallet address cannot be empty.");
        require(_providerId != bytes32(0), "Provider ID cannot be empty.");
        require(_providerWallet != address(0), "Provider wallet address cannot be empty.");
        require(_recordType != RecordType.None, "Invalid record type.");
        require(bytes(_recordCID).length > 0, "Record CID cannot be empty.");
        require(bytes(_title).length > 0, "Record title cannot be empty.");

        // --- Store the metadata ---
        records[_recordId] = MedicalRecordMetadata(
            _recordId,
            _patientId,
            _patientWallet,
            _providerId,
            _providerWallet,
            _recordType,
            _recordCID,
            block.timestamp,
            _title,
            _isSensitive,
            msg.sender // The address that initiated this transaction
        );

        // Add the recordId to the patient's list of records
        patientRecords[_patientId].push(_recordId);

        // Emit event
        emit MedicalRecordAdded(
            _recordId,
            _patientId,
            _providerId,
            _recordType,
            _recordCID,
            msg.sender
        );
    }

    /**
     * @dev Retrieves the full metadata of a specific medical record.
     * This function should ideally have access control based on patient/provider relationship.
     * For simplicity, it's public for now.
     *
     * @param _recordId The unique ID of the medical record.
     * @return recordId The unique ID of the medical record
     * @return patientId The patient's unique ID
     * @return patientWallet The patient's wallet address
     * @return providerId The provider's unique ID
     * @return providerWallet The provider's wallet address
     * @return recordType The type of medical record
     * @return recordCID The IPFS CID containing the record data
     * @return timestamp The creation timestamp
     * @return title The record title
     * @return isSensitive Whether the record is sensitive
     * @return ownerAddr The owner's address
     */
    function getMedicalRecord(
        bytes32 _recordId
    ) public view returns (
        bytes32 recordId,
        bytes32 patientId,
        address patientWallet,
        bytes32 providerId,
        address providerWallet,
        RecordType recordType,
        string memory recordCID,
        uint256 timestamp,
        string memory title,
        bool isSensitive,
        address ownerAddr
    ) {
        require(records[_recordId].recordId != bytes32(0), "Record not found.");
        MedicalRecordMetadata storage record = records[_recordId];
        return (
            record.recordId,
            record.patientId,
            record.patientWallet,
            record.providerId,
            record.providerWallet,
            record.recordType,
            record.recordCID,
            record.timestamp,
            record.title,
            record.isSensitive,
            record.owner
        );
    }

    /**
     * @dev Retrieves a list of all record IDs associated with a given patient ID.
     * Access control (only patient, or authorized providers) would be critical here.
     *
     * @param _patientId The unique ID of the patient.
     * @return An array of `bytes32` representing the record IDs.
     */
    function getPatientRecordIds(bytes32 _patientId) public view returns (bytes32[] memory) {
        // You might want to add a check here to ensure msg.sender is authorized to view these records.
        // For example: require(msg.sender == records[_patientId].patientWallet || isAuthorizedProvider(msg.sender), "Unauthorized access.");
        return patientRecords[_patientId];
    }

    /**
     * @dev Allows updating the IPFS CID of an existing medical record.
     * This function would require strong access control (e.g., only the original provider or a patient with consent).
     *
     * @param _recordId The ID of the record to update.
     * @param _newRecordCID The new IPFS CID.
     */
    function updateMedicalRecordCID(
        bytes32 _recordId,
        string calldata _newRecordCID
    ) public {
        require(records[_recordId].recordId != bytes32(0), "Record not found.");
        require(bytes(_newRecordCID).length > 0, "New record CID cannot be empty.");

        // --- Access Control Example (commented out, but essential for real app) ---
        // require(msg.sender == records[_recordId].providerWallet, "Only the original provider can update this record.");
        // Or: require(msg.sender == records[_recordId].patientWallet, "Only the patient can update this record.");
        // Or: require(msg.sender == records[_recordId].owner, "Only the original creator can update this record.");
        // A more complex access control system might allow specific providers with patient consent.

        records[_recordId].recordCID = _newRecordCID;
        // Optionally update timestamp if you want to track when the CID itself was updated
        // records[_recordId].timestamp = block.timestamp;

        emit MedicalRecordCIDUpdated(_recordId, _newRecordCID, msg.sender);
    }

    // --- Potential future functions and considerations ---

    // function grantAccess(bytes32 _recordId, address _grantee, uint256 _duration) public {}
    // function revokeAccess(bytes32 _recordId, address _grantee) public {}
    // function getAuthorizedAccess(bytes32 _recordId) public view returns (address[] memory) {}

    // A function to "deactivate" a record instead of deleting it (blockchain is immutable)
    // function deactivateRecord(bytes32 _recordId) public {}
}