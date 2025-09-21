pragma solidity ^0.8.0;

contract PatientRegistry {
    struct Patient {
        string name;
        uint age;
        string diagnosis;
        address patientAddress; 
    }

    mapping(address => Patient) public patients;


    event PatientRegistered(
        address indexed patientAddress,
        string name,
        uint age,
        string diagnosis
    );

 
    function registerPatient(
        address _patientAddress,
        string calldata _name,
        uint _age,
        string calldata _diagnosis
    ) public {
        //check to see whether patient is already registered
        require(
            patients[_patientAddress].patientAddress == address(0),
            "Patient already registered."
        );

        patients[_patientAddress] = Patient(
            _name,
            _age,
            _diagnosis,
            _patientAddress
        );

        emit PatientRegistered(_patientAddress, _name, _age, _diagnosis);
    }

    function getPatient(
        address _patientAddress
    ) public view returns (string memory, uint, string memory) {
        require(
            patients[_patientAddress].patientAddress != address(0),
            "Patient not found."
        );
        Patient storage patient = patients[_patientAddress];
        return (patient.name, patient.age, patient.diagnosis);
    }

    function updatePatientDiagnosis(
        address _patientAddress,
        string calldata _newDiagnosis
    ) public {
        require(
            patients[_patientAddress].patientAddress != address(0),
            "Patient not found."
        );
        patients[_patientAddress].diagnosis = _newDiagnosis;
    }
}