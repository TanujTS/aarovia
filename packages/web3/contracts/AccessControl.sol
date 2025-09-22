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
    
    // General provider access: patientId => providerAddress => expiry
    mapping(bytes32 => mapping(address => uint256)) public generalProviderAccess;
    
    // Record access with expiry: recordId => providerAddress => expiry
    mapping(bytes32 => mapping(address => uint256)) public recordAccess;
    
    // Track providers with access to a patient (for efficient querying)
    mapping(bytes32 => address[]) public patientProviders;
    mapping(bytes32 => mapping(address => uint256)) public patientProviderIndex;
    
    // Track patients that granted access to a provider (for efficient querying)
    mapping(address => bytes32[]) public providerPatients;
    mapping(address => mapping(bytes32 => uint256)) public providerPatientIndex;

    // Events
    event RoleAssigned(address indexed user, Role role);
    event ConsentGranted(bytes32 indexed patientId, address indexed grantedTo, ConsentType consentType);
    event ConsentRevoked(bytes32 indexed patientId, address indexed revokedFrom);
    event EmergencyAccessGranted(address indexed provider);
    event EmergencyAccessRevoked(address indexed provider);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    
    // New events for the requested functionality
    event AccessGranted(bytes32 indexed recordId, bytes32 indexed patientId, address indexed providerAddress, uint256 expiryTimestamp);
    event AccessRevoked(bytes32 indexed recordId, bytes32 indexed patientId, address indexed providerAddress);
    event GeneralAccessGranted(bytes32 indexed patientId, address indexed providerAddress, uint256 expiryTimestamp);
    event GeneralAccessRevoked(bytes32 indexed patientId, address indexed providerAddress);

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

    // =============================================
    // NEW ACCESS CONTROL FUNCTIONS
    // =============================================

    /**
     * @dev Patient grants access to a specific record for a provider
     * @param _recordId The record ID
     * @param _providerAddress The provider's address
     * @param _durationInSeconds Duration of access in seconds (0 for permanent)
     */
    function grantAccessToRecord(
        bytes32 _recordId, 
        address _providerAddress, 
        uint256 _durationInSeconds
    ) external {
        require(roles[msg.sender] == Role.Patient, "Only patients can grant record access");
        require(_providerAddress != address(0), "Invalid provider address");
        
        // Calculate expiry timestamp
        uint256 expiryTimestamp = _durationInSeconds == 0 ? 0 : block.timestamp + _durationInSeconds;
        
        // Grant access
        recordAccess[_recordId][_providerAddress] = expiryTimestamp;
        
        // Emit event - we need to derive patientId, for now we'll use a hash of msg.sender
        bytes32 patientId = keccak256(abi.encodePacked(msg.sender));
        emit AccessGranted(_recordId, patientId, _providerAddress, expiryTimestamp);
    }

    /**
     * @dev Patient revokes access to a specific record
     * @param _recordId The record ID
     * @param _providerAddress The provider's address
     */
    function revokeAccessToRecord(bytes32 _recordId, address _providerAddress) external {
        require(roles[msg.sender] == Role.Patient, "Only patients can revoke record access");
        require(recordAccess[_recordId][_providerAddress] > 0, "No access granted");
        
        // Revoke access
        delete recordAccess[_recordId][_providerAddress];
        
        // Emit event
        bytes32 patientId = keccak256(abi.encodePacked(msg.sender));
        emit AccessRevoked(_recordId, patientId, _providerAddress);
    }

    /**
     * @dev Patient grants a provider access to all current and future records
     * @param _patientId The patient's ID
     * @param _providerAddress The provider's address
     * @param _durationInSeconds Duration of access in seconds (0 for permanent)
     */
    function grantGeneralAccessToProvider(
        bytes32 _patientId,
        address _providerAddress,
        uint256 _durationInSeconds
    ) external onlyPatient(_patientId) {
        require(_providerAddress != address(0), "Invalid provider address");
        
        // Calculate expiry timestamp
        uint256 expiryTimestamp = _durationInSeconds == 0 ? 0 : block.timestamp + _durationInSeconds;
        
        // Grant general access
        generalProviderAccess[_patientId][_providerAddress] = expiryTimestamp;
        
        // Add to tracking arrays if not already present
        if (patientProviderIndex[_patientId][_providerAddress] == 0) {
            patientProviders[_patientId].push(_providerAddress);
            patientProviderIndex[_patientId][_providerAddress] = patientProviders[_patientId].length;
        }
        
        if (providerPatientIndex[_providerAddress][_patientId] == 0) {
            providerPatients[_providerAddress].push(_patientId);
            providerPatientIndex[_providerAddress][_patientId] = providerPatients[_providerAddress].length;
        }
        
        emit GeneralAccessGranted(_patientId, _providerAddress, expiryTimestamp);
    }

    /**
     * @dev Patient revokes general access from a provider
     * @param _patientId The patient's ID
     * @param _providerAddress The provider's address
     */
    function revokeGeneralAccessToProvider(bytes32 _patientId, address _providerAddress) external onlyPatient(_patientId) {
        require(generalProviderAccess[_patientId][_providerAddress] > 0, "No general access granted");
        
        // Revoke general access
        delete generalProviderAccess[_patientId][_providerAddress];
        
        // Remove from tracking arrays
        _removeProviderFromPatient(_patientId, _providerAddress);
        _removePatientFromProvider(_providerAddress, _patientId);
        
        emit GeneralAccessRevoked(_patientId, _providerAddress);
    }

    /**
     * @dev Checks if an accessor has access to a specific record
     * @param _recordId The record ID
     * @param _accessorAddress The accessor's address
     * @return hasAccess Whether access is granted
     */
    function checkAccess(bytes32 _recordId, address _accessorAddress) external view returns (bool hasAccess) {
        // Admin always has access
        if (admins[_accessorAddress]) {
            return true;
        }

        // Emergency providers have access to all records
        if (emergencyProviders[_accessorAddress]) {
            return true;
        }

        // Check record-specific access
        uint256 recordAccessExpiry = recordAccess[_recordId][_accessorAddress];
        if (recordAccessExpiry > 0) {
            return recordAccessExpiry == 0 || block.timestamp <= recordAccessExpiry;
        }

        // Check record-specific legacy access
        if (recordSpecificAccess[_recordId][_accessorAddress]) {
            return true;
        }

        return false;
    }

    /**
     * @dev Returns list of providers with access to a patient's records
     * @param _patientId The patient's ID
     * @return providers Array of provider addresses
     */
    function getProvidersWithAccess(bytes32 _patientId) external view returns (address[] memory providers) {
        address[] memory allProviders = patientProviders[_patientId];
        uint256 activeCount = 0;
        
        // Count active providers
        for (uint256 i = 0; i < allProviders.length; i++) {
            uint256 expiry = generalProviderAccess[_patientId][allProviders[i]];
            if (expiry > 0 && (expiry == 0 || block.timestamp <= expiry)) {
                activeCount++;
            }
        }
        
        // Create result array
        providers = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allProviders.length; i++) {
            uint256 expiry = generalProviderAccess[_patientId][allProviders[i]];
            if (expiry > 0 && (expiry == 0 || block.timestamp <= expiry)) {
                providers[index] = allProviders[i];
                index++;
            }
        }
        
        return providers;
    }

    /**
     * @dev Returns list of patients who have granted access to a provider
     * @param _providerAddress The provider's address
     * @return patients Array of patient IDs
     */
    function getPatientsGrantedAccessTo(address _providerAddress) external view returns (bytes32[] memory patients) {
        bytes32[] memory allPatients = providerPatients[_providerAddress];
        uint256 activeCount = 0;
        
        // Count active patients
        for (uint256 i = 0; i < allPatients.length; i++) {
            uint256 expiry = generalProviderAccess[allPatients[i]][_providerAddress];
            if (expiry > 0 && (expiry == 0 || block.timestamp <= expiry)) {
                activeCount++;
            }
        }
        
        // Create result array
        patients = new bytes32[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPatients.length; i++) {
            uint256 expiry = generalProviderAccess[allPatients[i]][_providerAddress];
            if (expiry > 0 && (expiry == 0 || block.timestamp <= expiry)) {
                patients[index] = allPatients[i];
                index++;
            }
        }
        
        return patients;
    }

    // =============================================
    // INTERNAL HELPER FUNCTIONS
    // =============================================

    /**
     * @dev Remove provider from patient's provider list
     */
    function _removeProviderFromPatient(bytes32 _patientId, address _providerAddress) internal {
        uint256 index = patientProviderIndex[_patientId][_providerAddress];
        if (index > 0) {
            address[] storage providers = patientProviders[_patientId];
            uint256 lastIndex = providers.length - 1;
            
            if (index - 1 != lastIndex) {
                providers[index - 1] = providers[lastIndex];
                patientProviderIndex[_patientId][providers[lastIndex]] = index;
            }
            
            providers.pop();
            delete patientProviderIndex[_patientId][_providerAddress];
        }
    }

    /**
     * @dev Remove patient from provider's patient list
     */
    function _removePatientFromProvider(address _providerAddress, bytes32 _patientId) internal {
        uint256 index = providerPatientIndex[_providerAddress][_patientId];
        if (index > 0) {
            bytes32[] storage patients = providerPatients[_providerAddress];
            uint256 lastIndex = patients.length - 1;
            
            if (index - 1 != lastIndex) {
                patients[index - 1] = patients[lastIndex];
                providerPatientIndex[_providerAddress][patients[lastIndex]] = index;
            }
            
            patients.pop();
            delete providerPatientIndex[_providerAddress][_patientId];
        }
    }
}