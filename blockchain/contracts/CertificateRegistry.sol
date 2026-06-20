// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateRegistry {
    address public admin;

    // Mapping to track addresses authorized to issue certificates
    mapping(address => bool) public authorizedIssuers;

    struct Certificate {
        string studentName;
        string matricule;
        string course;
        string universityName;
        uint256 issueDate;
        bool exists;
        bool revoked; // Status flag
    }

    // Maps the unique IPFS CID v1 string to its respective Certificate struct
    mapping(string => Certificate) public certificates;

    event CertificateIssued(string indexed certHash, string studentName, address indexed issuer);
    event CertificateRevoked(string indexed certHash);
    event IssuerAuthorized(address indexed university);
    event IssuerRevoked(address indexed university);

    constructor() {
        admin = msg.sender;
    }

    // --- Modifiers ---
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Not an authorized issuer");
        _;
    }

    // --- Admin Functions ---
    function authorizeIssuer(address _university) public onlyAdmin {
        authorizedIssuers[_university] = true;
        emit IssuerAuthorized(_university);
    }

    function revokeIssuer(address _university) public onlyAdmin {
        authorizedIssuers[_university] = false;
        emit IssuerRevoked(_university);
    }

    // --- Core Functions ---
    
    /**
     * @dev Issues a certificate. Explicitly initializes exists and revoked status.
     */
    function issueCertificate(
        string memory _certHash, 
        string memory _name, 
        string memory _matricule,
        string memory _course,
        string memory _university
    ) public onlyAuthorizedIssuer {
        require(!certificates[_certHash].exists, "Certificate already registered");

        certificates[_certHash] = Certificate({
            studentName: _name,
            matricule: _matricule,
            course: _course,
            universityName: _university,
            issueDate: block.timestamp,
            exists: true,
            revoked: false // Explicitly set to false upon issuance
        });

        emit CertificateIssued(_certHash, _name, msg.sender);
    }

    /**
     * @dev Revokes a certificate. Only callable by authorized issuers.
     */
    function revokeCertificate(string memory _certHash) public onlyAuthorizedIssuer {
        require(certificates[_certHash].exists, "Certificate does not exist");
        require(!certificates[_certHash].revoked, "Certificate already revoked");
        
        certificates[_certHash].revoked = true;
        emit CertificateRevoked(_certHash);
    }

    /**
     * @dev Retrieves certificate details for verification.
     * Returns isValid only if exists is true AND revoked is false.
     */
    function getCertificate(string memory _certHash) public view returns (
        string memory name, 
        string memory matricule,
        string memory course,
        string memory university, 
        uint256 date,
        bool isValid
    ) {
        Certificate memory cert = certificates[_certHash];
        
        // A certificate is valid only if it exists AND has not been revoked
        bool validStatus = cert.exists && !cert.revoked;
        
        return (
            cert.studentName, 
            cert.matricule,
            cert.course,
            cert.universityName, 
            cert.issueDate, 
            validStatus
        );
    }
}