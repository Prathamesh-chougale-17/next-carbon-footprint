// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SupplyChainTokens
 * @dev ERC-1155 contract for supply chain traceability
 * @notice This contract manages product batches as tokens with full traceability
 */
contract SupplyChainTokens is ERC1155, Ownable, Pausable, ReentrancyGuard {
    // Token ID counter for unique batch identification
    uint256 private _tokenIdCounter = 1;

    // Batch information structure
    struct BatchInfo {
        uint256 batchNumber;
        address manufacturer;
        string templateId;
        uint256 quantity;
        uint256 productionDate;
        uint256 expiryDate;
        uint256 carbonFootprint;
        string plantId;
        string metadataURI;
        bool isActive;
    }

    // Transfer record for traceability
    struct TransferRecord {
        address from;
        address to;
        uint256 quantity;
        uint256 timestamp;
        string reason;
        string metadata;
    }

    // Mapping from token ID to batch information
    mapping(uint256 => BatchInfo) public batches;

    // Mapping from token ID to transfer history
    mapping(uint256 => TransferRecord[]) public transferHistory;

    // Mapping to check if token ID exists
    mapping(uint256 => bool) public tokenExists;

    // Mapping from batch number + manufacturer to token ID (for uniqueness)
    mapping(bytes32 => uint256) public batchToTokenId;

    // Events
    event BatchMinted(
        uint256 indexed tokenId,
        uint256 indexed batchNumber,
        address indexed manufacturer,
        string templateId,
        uint256 quantity,
        uint256 carbonFootprint
    );

    event BatchTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 quantity,
        string reason
    );

    event BatchUpdated(
        uint256 indexed tokenId,
        uint256 newQuantity,
        uint256 newCarbonFootprint
    );

    constructor(string memory _uri) ERC1155(_uri) Ownable(msg.sender) {
        // Token ID counter starts from 1 (already initialized above)
    }

    /**
     * @dev Mint a new batch as ERC-1155 tokens
     * @param batchNumber Unique batch number
     * @param templateId Product template identifier
     * @param quantity Number of units in the batch
     * @param productionDate Unix timestamp of production date
     * @param expiryDate Unix timestamp of expiry date (0 if no expiry)
     * @param carbonFootprint Total carbon footprint for the batch
     * @param plantId Manufacturing plant identifier
     * @param metadataURI IPFS URI containing batch metadata
     * @param data Additional data for ERC-1155 minting
     */
    function mintBatch(
        uint256 batchNumber,
        string memory templateId,
        uint256 quantity,
        uint256 productionDate,
        uint256 expiryDate,
        uint256 carbonFootprint,
        string memory plantId,
        string memory metadataURI,
        bytes memory data
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(
            quantity > 0,
            "SupplyChainTokens: Quantity must be greater than 0"
        );
        require(
            carbonFootprint > 0,
            "SupplyChainTokens: Carbon footprint must be greater than 0"
        );

        // Create unique key for batch number + manufacturer
        bytes32 batchKey = keccak256(abi.encodePacked(batchNumber, msg.sender));
        require(
            batchToTokenId[batchKey] == 0,
            "SupplyChainTokens: Batch already exists for this manufacturer"
        );

        // Get next token ID
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Store batch information
        batches[tokenId] = BatchInfo({
            batchNumber: batchNumber,
            manufacturer: msg.sender,
            templateId: templateId,
            quantity: quantity,
            productionDate: productionDate,
            expiryDate: expiryDate,
            carbonFootprint: carbonFootprint,
            plantId: plantId,
            metadataURI: metadataURI,
            isActive: true
        });

        // Mark token as existing and store batch mapping
        tokenExists[tokenId] = true;
        batchToTokenId[batchKey] = tokenId;

        // Mint tokens to the manufacturer
        _mint(msg.sender, tokenId, quantity, data);

        // Record initial transfer (minting)
        transferHistory[tokenId].push(
            TransferRecord({
                from: address(0),
                to: msg.sender,
                quantity: quantity,
                timestamp: block.timestamp,
                reason: "Batch Creation",
                metadata: ""
            })
        );

        emit BatchMinted(
            tokenId,
            batchNumber,
            msg.sender,
            templateId,
            quantity,
            carbonFootprint
        );

        return tokenId;
    }

    /**
     * @dev Transfer tokens to a partner with traceability
     * @param to Partner address
     * @param tokenId Token ID of the batch
     * @param quantity Amount to transfer
     * @param reason Reason for transfer
     * @param metadata Additional transfer metadata
     */
    function transferToPartner(
        address to,
        uint256 tokenId,
        uint256 quantity,
        string memory reason,
        string memory metadata
    ) external whenNotPaused nonReentrant {
        require(
            tokenExists[tokenId],
            "SupplyChainTokens: Token does not exist"
        );
        require(
            quantity > 0,
            "SupplyChainTokens: Quantity must be greater than 0"
        );
        require(
            balanceOf(msg.sender, tokenId) >= quantity,
            "SupplyChainTokens: Insufficient balance"
        );
        require(
            to != address(0),
            "SupplyChainTokens: Cannot transfer to zero address"
        );
        require(to != msg.sender, "SupplyChainTokens: Cannot transfer to self");

        // Perform the transfer
        safeTransferFrom(msg.sender, to, tokenId, quantity, "");

        // Record the transfer
        transferHistory[tokenId].push(
            TransferRecord({
                from: msg.sender,
                to: to,
                quantity: quantity,
                timestamp: block.timestamp,
                reason: reason,
                metadata: metadata
            })
        );

        emit BatchTransferred(tokenId, msg.sender, to, quantity, reason);
    }

    /**
     * @dev Burn component tokens during batch creation
     * @param tokenId Token ID of the component to burn
     * @param quantity Amount to burn
     * @param reason Reason for burning (e.g., "Component Consumption")
     */
    function burnComponentTokens(
        uint256 tokenId,
        uint256 quantity,
        string memory reason
    ) external whenNotPaused nonReentrant {
        require(
            tokenExists[tokenId],
            "SupplyChainTokens: Token does not exist"
        );
        require(
            quantity > 0,
            "SupplyChainTokens: Quantity must be greater than 0"
        );
        require(
            balanceOf(msg.sender, tokenId) >= quantity,
            "SupplyChainTokens: Insufficient balance"
        );

        // Burn the tokens
        _burn(msg.sender, tokenId, quantity);

        // Record the burn in transfer history
        transferHistory[tokenId].push(
            TransferRecord({
                from: msg.sender,
                to: address(0), // Zero address indicates burning
                quantity: quantity,
                timestamp: block.timestamp,
                reason: reason,
                metadata: ""
            })
        );

        emit BatchTransferred(
            tokenId,
            msg.sender,
            address(0),
            quantity,
            reason
        );
    }

    /**
     * @dev Get batch information
     * @param tokenId Token ID
     * @return BatchInfo struct containing all batch details
     */
    function getBatchInfo(
        uint256 tokenId
    ) external view returns (BatchInfo memory) {
        require(
            tokenExists[tokenId],
            "SupplyChainTokens: Token does not exist"
        );
        return batches[tokenId];
    }

    /**
     * @dev Get transfer history for a batch
     * @param tokenId Token ID
     * @return Array of TransferRecord structs
     */
    function getTransferHistory(
        uint256 tokenId
    ) external view returns (TransferRecord[] memory) {
        require(
            tokenExists[tokenId],
            "SupplyChainTokens: Token does not exist"
        );
        return transferHistory[tokenId];
    }

    /**
     * @dev Returns the URI for a given token ID
     * @param tokenId Token ID
     * @return URI string for the token metadata
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        require(
            tokenExists[tokenId],
            "SupplyChainTokens: Token does not exist"
        );
        return batches[tokenId].metadataURI;
    }

    /**
     * @dev Get total number of transfers for a batch
     * @param tokenId Token ID
     * @return Number of transfers
     */
    function getTransferCount(uint256 tokenId) external view returns (uint256) {
        require(
            tokenExists[tokenId],
            "SupplyChainTokens: Token does not exist"
        );
        return transferHistory[tokenId].length;
    }

    /**
     * @dev Get token ID for a specific batch
     * @param batchNumber Batch number
     * @param manufacturer Manufacturer address
     * @return Token ID (0 if not found)
     */
    function getTokenIdByBatch(
        uint256 batchNumber,
        address manufacturer
    ) external view returns (uint256) {
        bytes32 batchKey = keccak256(
            abi.encodePacked(batchNumber, manufacturer)
        );
        return batchToTokenId[batchKey];
    }

    /**
     * @dev Check if a batch exists
     * @param batchNumber Batch number
     * @param manufacturer Manufacturer address
     * @return True if batch exists
     */
    function batchExists(
        uint256 batchNumber,
        address manufacturer
    ) external view returns (bool) {
        bytes32 batchKey = keccak256(
            abi.encodePacked(batchNumber, manufacturer)
        );
        return batchToTokenId[batchKey] != 0;
    }

    /**
     * @dev Update batch information (only manufacturer can update)
     * @param tokenId Token ID
     * @param newQuantity New quantity (must be <= current quantity)
     * @param newCarbonFootprint New carbon footprint
     */
    function updateBatch(
        uint256 tokenId,
        uint256 newQuantity,
        uint256 newCarbonFootprint
    ) external whenNotPaused nonReentrant {
        require(
            tokenExists[tokenId],
            "SupplyChainTokens: Token does not exist"
        );
        require(
            batches[tokenId].manufacturer == msg.sender,
            "SupplyChainTokens: Only manufacturer can update"
        );
        require(
            newQuantity > 0,
            "SupplyChainTokens: Quantity must be greater than 0"
        );
        require(
            newCarbonFootprint > 0,
            "SupplyChainTokens: Carbon footprint must be greater than 0"
        );
        require(
            newQuantity <= batches[tokenId].quantity,
            "SupplyChainTokens: Cannot increase quantity"
        );

        uint256 currentBalance = balanceOf(msg.sender, tokenId);
        require(
            newQuantity <= currentBalance,
            "SupplyChainTokens: New quantity exceeds current balance"
        );

        // Update batch information
        batches[tokenId].quantity = newQuantity;
        batches[tokenId].carbonFootprint = newCarbonFootprint;

        // If quantity is reduced, burn excess tokens
        if (newQuantity < currentBalance) {
            uint256 burnAmount = currentBalance - newQuantity;
            _burn(msg.sender, tokenId, burnAmount);
        }

        emit BatchUpdated(tokenId, newQuantity, newCarbonFootprint);
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Update base URI (only owner)
     * @param newuri New base URI
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Get current token ID counter
     * @return Current counter value
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Override supportsInterface to include custom interfaces
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
