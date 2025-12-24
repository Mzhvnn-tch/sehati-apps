// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SEHATIRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");

    struct MedicalRecord {
        string ipfsCID;
        bytes32 contentHash;
        address patient;
        address doctor;
        string recordType;
        uint256 timestamp;
        bool exists;
    }

    struct AccessGrant {
        address patient;
        address doctor;
        bytes32 accessToken;
        uint256 expiresAt;
        bool isActive;
    }

    mapping(bytes32 => MedicalRecord) public records;
    mapping(address => bytes32[]) public patientRecords;
    mapping(bytes32 => AccessGrant) public accessGrants;
    mapping(address => bytes32[]) public patientAccessGrants;

    uint256 public recordCount;
    uint256 public grantCount;

    event UserRegistered(address indexed user, string role, uint256 timestamp);
    event RecordCreated(
        bytes32 indexed recordId,
        address indexed patient,
        address indexed doctor,
        string ipfsCID,
        bytes32 contentHash,
        string recordType,
        uint256 timestamp
    );
    event AccessGrantCreated(
        bytes32 indexed grantId,
        address indexed patient,
        bytes32 accessToken,
        uint256 expiresAt,
        uint256 timestamp
    );
    event AccessGrantUsed(
        bytes32 indexed grantId,
        address indexed doctor,
        uint256 timestamp
    );
    event AccessGrantRevoked(
        bytes32 indexed grantId,
        address indexed patient,
        uint256 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerAsPatient() external {
        require(!hasRole(PATIENT_ROLE, msg.sender) && !hasRole(DOCTOR_ROLE, msg.sender), "Already registered");
        _grantRole(PATIENT_ROLE, msg.sender);
        emit UserRegistered(msg.sender, "patient", block.timestamp);
    }

    function registerAsDoctor() external {
        require(!hasRole(PATIENT_ROLE, msg.sender) && !hasRole(DOCTOR_ROLE, msg.sender), "Already registered");
        _grantRole(DOCTOR_ROLE, msg.sender);
        emit UserRegistered(msg.sender, "doctor", block.timestamp);
    }

    function createRecord(
        address _patient,
        string calldata _ipfsCID,
        bytes32 _contentHash,
        string calldata _recordType,
        bytes32 _accessToken
    ) external onlyRole(DOCTOR_ROLE) nonReentrant returns (bytes32) {
        require(hasRole(PATIENT_ROLE, _patient), "Patient not registered");
        require(_verifyAccess(_patient, _accessToken), "Invalid or expired access");

        bytes32 recordId = keccak256(
            abi.encodePacked(
                _patient,
                msg.sender,
                _ipfsCID,
                block.timestamp,
                recordCount
            )
        );

        records[recordId] = MedicalRecord({
            ipfsCID: _ipfsCID,
            contentHash: _contentHash,
            patient: _patient,
            doctor: msg.sender,
            recordType: _recordType,
            timestamp: block.timestamp,
            exists: true
        });

        patientRecords[_patient].push(recordId);
        recordCount++;

        emit RecordCreated(
            recordId,
            _patient,
            msg.sender,
            _ipfsCID,
            _contentHash,
            _recordType,
            block.timestamp
        );

        return recordId;
    }

    function createAccessGrant(
        bytes32 _accessToken,
        uint256 _durationMinutes
    ) external onlyRole(PATIENT_ROLE) returns (bytes32) {
        require(_durationMinutes > 0 && _durationMinutes <= 1440, "Duration must be 1-1440 minutes");

        bytes32 grantId = keccak256(
            abi.encodePacked(
                msg.sender,
                _accessToken,
                block.timestamp,
                grantCount
            )
        );

        uint256 expiresAt = block.timestamp + (_durationMinutes * 1 minutes);

        accessGrants[grantId] = AccessGrant({
            patient: msg.sender,
            doctor: address(0),
            accessToken: _accessToken,
            expiresAt: expiresAt,
            isActive: true
        });

        patientAccessGrants[msg.sender].push(grantId);
        grantCount++;

        emit AccessGrantCreated(
            grantId,
            msg.sender,
            _accessToken,
            expiresAt,
            block.timestamp
        );

        return grantId;
    }

    function useAccessGrant(bytes32 _grantId) external onlyRole(DOCTOR_ROLE) {
        AccessGrant storage grant = accessGrants[_grantId];
        require(grant.isActive, "Grant not active");
        require(block.timestamp < grant.expiresAt, "Grant expired");
        
        grant.doctor = msg.sender;
        
        emit AccessGrantUsed(_grantId, msg.sender, block.timestamp);
    }

    function revokeAccessGrant(bytes32 _grantId) external {
        AccessGrant storage grant = accessGrants[_grantId];
        require(grant.patient == msg.sender, "Not grant owner");
        require(grant.isActive, "Already revoked");

        grant.isActive = false;

        emit AccessGrantRevoked(_grantId, msg.sender, block.timestamp);
    }

    function getPatientRecords(address _patient) external view returns (bytes32[] memory) {
        return patientRecords[_patient];
    }

    function getRecord(bytes32 _recordId) external view returns (
        string memory ipfsCID,
        bytes32 contentHash,
        address patient,
        address doctor,
        string memory recordType,
        uint256 timestamp
    ) {
        MedicalRecord storage record = records[_recordId];
        require(record.exists, "Record not found");
        return (
            record.ipfsCID,
            record.contentHash,
            record.patient,
            record.doctor,
            record.recordType,
            record.timestamp
        );
    }

    function getPatientAccessGrants(address _patient) external view returns (bytes32[] memory) {
        return patientAccessGrants[_patient];
    }

    function getAccessGrant(bytes32 _grantId) external view returns (
        address patient,
        address doctor,
        uint256 expiresAt,
        bool isActive
    ) {
        AccessGrant storage grant = accessGrants[_grantId];
        return (grant.patient, grant.doctor, grant.expiresAt, grant.isActive);
    }

    function _verifyAccess(address _patient, bytes32 _accessToken) internal view returns (bool) {
        bytes32[] storage grants = patientAccessGrants[_patient];
        for (uint256 i = 0; i < grants.length; i++) {
            AccessGrant storage grant = accessGrants[grants[i]];
            if (
                grant.accessToken == _accessToken &&
                grant.isActive &&
                block.timestamp < grant.expiresAt
            ) {
                return true;
            }
        }
        return false;
    }

    function verifyAccessToken(address _patient, bytes32 _accessToken) external view returns (bool) {
        return _verifyAccess(_patient, _accessToken);
    }

    function isPatient(address _user) external view returns (bool) {
        return hasRole(PATIENT_ROLE, _user);
    }

    function isDoctor(address _user) external view returns (bool) {
        return hasRole(DOCTOR_ROLE, _user);
    }
}
