// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AccessControl
 * @dev Manages access permissions for medical records with role-based access control
 * and patient consent management
 */
contract AccessControl {
    // Record types for different levels of access control
    enum RecordType {
        General,
        Diagnostic,
        Prescription,
        LabResult,
        Imaging,
        Surgery,
        Mental,
        Genetic
    }

    // Roles in the healthcare system
    enum Role {
        None,
        Patient,
        Doctor,
        Nurse,
        Lab,
        Pharmacy,
        Emergency,
        Admin
    }

    // Consent types
    enum ConsentType {
        Full,      // Full access to all record details
        Limited,   // Limited access (metadata only)
        Emergency, // Emergency access override
        Research   // Research access (anonymized)
    }

    // Consent structure
    struct Consent {
        bytes32 patientId;
        address grantedTo;
        ConsentType consentType;
        RecordType[] allowedRecordTypes;
        uint256 expiryTimestamp;
        bool isActive;
        uint256 createdAt;
    }

    // Role assignments
    mapping(address => Role) public roles;
    
    // Patient consent mapping: patientId => grantedTo => Consent
    mapping(bytes32 => mapping(address => Consent)) public consents;
    
    // Emergency access overrides
    mapping(address => bool) public emergencyProviders;
    
    // Admin addresses
    mapping(address => bool) public admins;
    
    // Record-specific access permissions
    mapping(bytes32 => mapping(address => bool)) public recordSpecificAccess;

    // Events
    event RoleAssigned(address indexed user, Role role);
    event ConsentGranted(bytes32 indexed patientId, address indexed grantedTo, ConsentType consentType);
    event ConsentRevoked(bytes32 indexed patientId, address indexed revokedFrom);
    event EmergencyAccessGranted(address indexed provider);
    event EmergencyAccessRevoked(address indexed provider);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    // Modifiers
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }

    modifier onlyPatient(bytes32 _patientId) {
        require(roles[msg.sender] == Role.Patient, "Only patients can perform this action");
        // Additional check could be added to verify the patient owns this patientId
        _;
    }

    constructor() {
        admins[msg.sender] = true;
        roles[msg.sender] = Role.Admin;
        emit AdminAdded(msg.sender);
    }

    /**
     * @dev Assigns a role to a user
     * @param _user The address to assign the role to
     * @param _role The role to assign
     */
    function assignRole(address _user, Role _role) external onlyAdmin {
        roles[_user] = _role;
        emit RoleAssigned(_user, _role);
    }

    /**
     * @dev Adds an admin
     * @param _admin The address to add as admin
     */
    function addAdmin(address _admin) external onlyAdmin {
        admins[_admin] = true;
        roles[_admin] = Role.Admin;
        emit AdminAdded(_admin);
    }

    /**
     * @dev Removes an admin
     * @param _admin The address to remove as admin
     */
    function removeAdmin(address _admin) external onlyAdmin {
        require(_admin != msg.sender, "Cannot remove yourself as admin");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    /**
     * @dev Grants emergency access to a provider
     * @param _provider The provider address
     */
    function grantEmergencyAccess(address _provider) external onlyAdmin {
        emergencyProviders[_provider] = true;
        emit EmergencyAccessGranted(_provider);
    }

    /**
     * @dev Revokes emergency access from a provider
     * @param _provider The provider address
     */
    function revokeEmergencyAccess(address _provider) external onlyAdmin {
        emergencyProviders[_provider] = false;
        emit EmergencyAccessRevoked(_provider);
    }

    /**
     * @dev Patient grants consent to a provider
     * @param _patientId The patient's ID
     * @param _grantedTo The address being granted access
     * @param _consentType Type of consent being granted
     * @param _allowedRecordTypes Array of record types the consent covers
     * @param _expiryTimestamp When the consent expires (0 for no expiry)
     */
    function grantConsent(
        bytes32 _patientId,
        address _grantedTo,
        ConsentType _consentType,
        RecordType[] calldata _allowedRecordTypes,
        uint256 _expiryTimestamp
    ) external onlyPatient(_patientId) {
        require(_grantedTo != address(0), "Cannot grant consent to zero address");
        require(_allowedRecordTypes.length > 0, "Must specify at least one record type");
        
        if (_expiryTimestamp > 0) {
            require(_expiryTimestamp > block.timestamp, "Expiry must be in the future");
        }

        consents[_patientId][_grantedTo] = Consent({
            patientId: _patientId,
            grantedTo: _grantedTo,
            consentType: _consentType,
            allowedRecordTypes: _allowedRecordTypes,
            expiryTimestamp: _expiryTimestamp,
            isActive: true,
            createdAt: block.timestamp
        });

        emit ConsentGranted(_patientId, _grantedTo, _consentType);
    }

    /**
     * @dev Patient revokes consent from a provider
     * @param _patientId The patient's ID
     * @param _revokeFrom The address to revoke consent from
     */
    function revokeConsent(bytes32 _patientId, address _revokeFrom) external onlyPatient(_patientId) {
        require(consents[_patientId][_revokeFrom].isActive, "No active consent found");
        
        consents[_patientId][_revokeFrom].isActive = false;
        emit ConsentRevoked(_patientId, _revokeFrom);
    }

    /**
     * @dev Grants specific access to a record
     * @param _recordId The record ID
     * @param _grantedTo The address being granted access
     */
    function grantRecordAccess(bytes32 _recordId, address _grantedTo) external {
        // This could be called by the record owner or admin
        require(admins[msg.sender] || roles[msg.sender] == Role.Patient, "Unauthorized");
        recordSpecificAccess[_recordId][_grantedTo] = true;
    }

    /**
     * @dev Revokes specific access to a record
     * @param _recordId The record ID
     * @param _revokeFrom The address to revoke access from
     */
    function revokeRecordAccess(bytes32 _recordId, address _revokeFrom) external {
        require(admins[msg.sender] || roles[msg.sender] == Role.Patient, "Unauthorized");
        recordSpecificAccess[_recordId][_revokeFrom] = false;
    }

    /**
     * @dev Main access control check function
     * @param _recordId The ID of the medical record
     * @param _patientId The patient's ID
     * @param _recordType The type of medical record
     * @param _accessor The address trying to access the record
     * @return hasAccess Whether access is granted
     */
    function checkAccess(
        bytes32 _recordId,
        bytes32 _patientId,
        RecordType _recordType,
        address _accessor
    ) external view returns (bool hasAccess) {
        // Admin always has access
        if (admins[_accessor]) {
            return true;
        }

        // Emergency providers have access to all records
        if (emergencyProviders[_accessor]) {
            return true;
        }

        // Record-specific access
        if (recordSpecificAccess[_recordId][_accessor]) {
            return true;
        }

        // Check consent-based access
        Consent memory consent = consents[_patientId][_accessor];
        
        if (!consent.isActive) {
            return false;
        }

        // Check expiry
        if (consent.expiryTimestamp > 0 && block.timestamp > consent.expiryTimestamp) {
            return false;
        }

        // Check if the record type is allowed
        for (uint i = 0; i < consent.allowedRecordTypes.length; i++) {
            if (consent.allowedRecordTypes[i] == _recordType) {
                return true;
            }
        }

        return false;
    }

    /**
     * @dev Gets consent details
     * @param _patientId The patient's ID
     * @param _grantedTo The address the consent was granted to
     * @return The consent struct
     */
    function getConsent(bytes32 _patientId, address _grantedTo) external view returns (Consent memory) {
        return consents[_patientId][_grantedTo];
    }

    /**
     * @dev Checks if a consent is valid and active
     * @param _patientId The patient's ID
     * @param _grantedTo The address to check
     * @return isValid Whether the consent is valid and active
     */
    function isConsentValid(bytes32 _patientId, address _grantedTo) external view returns (bool isValid) {
        Consent memory consent = consents[_patientId][_grantedTo];
        
        if (!consent.isActive) {
            return false;
        }

        if (consent.expiryTimestamp > 0 && block.timestamp > consent.expiryTimestamp) {
            return false;
        }

        return true;
    }

    /**
     * @dev Gets the role of an address
     * @param _user The address to check
     * @return The role of the user
     */
    function getRole(address _user) external view returns (Role) {
        return roles[_user];
    }

    /**
     * @dev Checks if an address has emergency access
     * @param _provider The address to check
     * @return Whether the address has emergency access
     */
    function hasEmergencyAccess(address _provider) external view returns (bool) {
        return emergencyProviders[_provider];
    }

    /**
     * @dev Checks if an address is an admin
     * @param _user The address to check
     * @return Whether the address is an admin
     */
    function isAdmin(address _user) external view returns (bool) {
        return admins[_user];
    }
}