pragma solidity ^0.8.0;

contract ProviderRegistry {


    enum ProviderType {
        None, // Default value, useful for checking if a type has been set
        Doctor,
        Clinic,
        Lab,
        Hospital,
        Pharmacy,
        Specialist // Added an example for a more specific type
    }

    // Struct to hold a provider's profile information
    struct ProviderProfile {
        bytes32 providerId; // Unique ID for the provider (e.g., hash of some identifier)
        string providerDetailsCID; // IPFS CID for JSON file containing name, specialty, contact info, license, NPI
        ProviderType providerType; // Type of provider (e.g., Doctor, Clinic)
        uint256 createdAt; // Timestamp of creation
        uint256 updatedAt; // Timestamp of last update
        address providerAddress; // The blockchain address associated with the provider
    }

    // Mapping from provider's wallet address to their full profile
    mapping(address => ProviderProfile) public providers;

    // Mapping to quickly check if a provider address is registered
    mapping(address => bool) public isProviderRegistered;

    // Mapping for a future verification mechanism
    mapping(address => bool) public isVerifiedProvider;

    // Event to be emitted when a new provider is registered
    event ProviderRegistered(
        address indexed providerAddress,
        bytes32 indexed providerId,
        ProviderType providerType,
        string providerDetailsCID
    );

    // Event to be emitted when a provider's details are updated
    event ProviderDetailsUpdated(
        address indexed providerAddress,
        string newProviderDetailsCID
    );

    // Event for when a provider's verification status changes (future use)
    event ProviderVerificationStatusChanged(
        address indexed providerAddress,
        bool isVerified
    );

    // Function to register a new provider
    // This function can be called by anyone for now, but access control is crucial for real apps.
    function registerProvider(
        address _providerAddress,
        bytes32 _providerId, // Consider how this ID is generated (e.g., keccak256 hash)
        string calldata _providerDetailsCID,
        ProviderType _providerType
    ) public {
        // Ensure the provider address is not already registered
        require(!isProviderRegistered[_providerAddress], "Provider already registered.");
        // Ensure the provider type is not 'None'
        require(_providerType != ProviderType.None, "Invalid provider type.");
        // Ensure providerId is not empty
        require(_providerId != bytes32(0), "Provider ID cannot be empty.");
        // Ensure CID is not empty, though an empty string is technically valid,
        // you might want a more robust check in practice.
        require(bytes(_providerDetailsCID).length > 0, "Provider details CID cannot be empty.");


        providers[_providerAddress] = ProviderProfile(
            _providerId,
            _providerDetailsCID,
            _providerType,
            block.timestamp, // Set creation timestamp
            block.timestamp, // Set update timestamp
            _providerAddress // Store the address within the struct as well
        );

        isProviderRegistered[_providerAddress] = true;

        emit ProviderRegistered(
            _providerAddress,
            _providerId,
            _providerType,
            _providerDetailsCID
        );
    }

    // Function to update a provider's IPFS CID for their details
    // Only the registered provider themselves should be able to call this.
    function updateProviderDetailsCID(
        string calldata _newProviderDetailsCID
    ) public {
        // Ensure the caller is a registered provider
        require(isProviderRegistered[msg.sender], "Caller is not a registered provider.");
        require(bytes(_newProviderDetailsCID).length > 0, "New provider details CID cannot be empty.");


        ProviderProfile storage provider = providers[msg.sender];
        provider.providerDetailsCID = _newProviderDetailsCID;
        provider.updatedAt = block.timestamp; // Update timestamp

        emit ProviderDetailsUpdated(msg.sender, _newProviderDetailsCID);
    }

    // Function to get a provider's full profile
    // The public mapping `providers` already creates a getter, but this allows a specific lookup.
    function getProviderProfile(
        address _providerAddress
    ) public view returns (bytes32, string memory, ProviderType, uint256, uint256, address) {
        require(isProviderRegistered[_providerAddress], "Provider not found.");

        ProviderProfile storage provider = providers[_providerAddress];
        return (
            provider.providerId,
            provider.providerDetailsCID,
            provider.providerType,
            provider.createdAt,
            provider.updatedAt,
            provider.providerAddress
        );
    }

    // --- Admin-only functions for verification (Future mechanism) ---
    // In a real application, these would have strong access control (e.g., Ownable, AccessControl)

    // Function to verify a provider (e.g., by an administrator)
    function setProviderVerificationStatus(
        address _providerAddress,
        bool _isVerified
    ) public {
        // In a real app, add require(msg.sender == adminAddress, "Only admin can verify.");
        require(isProviderRegistered[_providerAddress], "Provider not found.");

        isVerifiedProvider[_providerAddress] = _isVerified;

        emit ProviderVerificationStatusChanged(_providerAddress, _isVerified);
    }

    // Function to check if a provider is verified
    function getIsVerifiedProvider(address _providerAddress) public view returns (bool) {
        return isVerifiedProvider[_providerAddress];
    }
}