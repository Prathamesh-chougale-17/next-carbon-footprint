# Migration Guide: From Ethers.js to Wagmi

This guide explains how to migrate from the current ethers.js-based smart contract service to the new wagmi-based implementation.

## Overview

The new wagmi implementation provides:
- Better React integration with hooks
- Built-in caching and error handling
- Type safety improvements
- Modern transaction management
- Automatic network switching

## Key Changes

### 1. Service Class → React Hooks

**Before (Ethers.js):**
```typescript
const service = new SmartContractService();
await service.initialize();
const result = await service.mintBatch(params);
```

**After (Wagmi):**
```typescript
const { mintBatch, isLoading, error } = useMintBatch();
await mintBatch(params);
```

### 2. Available Hooks

| Old Method | New Hook | Description |
|------------|----------|-------------|
| `service.initialize()` | `useSmartContract()` | Wallet connection and network status |
| `service.mintBatch()` | `useMintBatch()` | Mint batch tokens |
| `service.getBatchInfo()` | `useBatchInfo()` | Get batch information |
| `service.getCurrentTokenId()` | `useCurrentTokenId()` | Get current token ID |
| `service.batchExists()` | `useBatchExists()` | Check if batch exists |
| `service.getUserTokenBalances()` | `useAllUserTokenBalances()` | Get user token balances |
| `service.transferTokens()` | `useTransferTokens()` | Transfer tokens |
| `service.getAllMintedTokens()` | `useAllMintedTokens()` | Get all minted tokens |

### 3. Component Migration

**Before:**
```typescript
function MintComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMint = async () => {
    setIsLoading(true);
    try {
      const service = new SmartContractService();
      await service.initialize();
      const result = await service.mintBatch(params);
      // Handle success
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleMint} disabled={isLoading}>
      {isLoading ? 'Minting...' : 'Mint'}
    </button>
  );
}
```

**After:**
```typescript
function MintComponent() {
  const { mintBatch, isLoading, error } = useMintBatch();

  const handleMint = async () => {
    try {
      await mintBatch(params);
      // Success is handled automatically
    } catch (err) {
      // Error is handled automatically
    }
  };

  return (
    <button onClick={handleMint} disabled={isLoading}>
      {isLoading ? 'Minting...' : 'Mint'}
    </button>
  );
}
```

## Migration Steps

### Step 1: Update Imports

Replace:
```typescript
import { smartContractService } from '@/lib/smart-contract';
```

With:
```typescript
import { useMintBatch, useBatchInfo, useSmartContract } from '@/lib/smart-contract-wagmi';
```

### Step 2: Convert Class Components to Functional Components

If you have class components using the smart contract service, convert them to functional components to use hooks.

### Step 3: Replace Service Calls with Hooks

For each smart contract interaction:
1. Import the appropriate hook
2. Call the hook in your component
3. Use the returned values and functions

### Step 4: Update Error Handling

Wagmi hooks provide built-in error handling. You can access errors through the hook's return value:

```typescript
const { mintBatch, error, isLoading } = useMintBatch();

// Error is automatically available
if (error) {
  console.error('Minting failed:', error);
}
```

### Step 5: Update Loading States

Loading states are handled automatically:

```typescript
const { mintBatch, isLoading, isConfirming } = useMintBatch();

// isLoading: transaction is being sent
// isConfirming: transaction is being confirmed
// Both are false when complete
```

## Benefits of Migration

1. **Better Performance**: Built-in caching reduces unnecessary network calls
2. **Automatic Retries**: Failed requests are automatically retried
3. **Real-time Updates**: Data updates automatically when blockchain state changes
4. **Type Safety**: Better TypeScript support with generated types
5. **Error Handling**: Consistent error handling across all operations
6. **Loading States**: Built-in loading states for better UX

## Backward Compatibility

The old service is still available for gradual migration. You can:

1. Keep both implementations running side by side
2. Migrate components one by one
3. Remove the old service once all components are migrated

## Example: Complete Component Migration

**Before:**
```typescript
function BatchMintingForm() {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const service = new SmartContractService();
      await service.initialize();
      const result = await service.mintBatch(formData);
      toast.success('Batch minted successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Minting...' : 'Mint Batch'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

**After:**
```typescript
function BatchMintingForm() {
  const [formData, setFormData] = useState({});
  const { mintBatch, isLoading, error, isConfirmed } = useMintBatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await mintBatch(formData);
      toast.success('Batch minted successfully!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Minting...' : 'Mint Batch'}
      </button>
      {error && <div className="error">{error.message}</div>}
      {isConfirmed && <div className="success">Transaction confirmed!</div>}
    </form>
  );
}
```

## API Routes

The new implementation includes API routes for server-side contract interactions:

- `POST /api/contract/balance` - Get token balance
- `POST /api/contract/batch-info` - Get batch information

These routes use viem for server-side contract calls and are used by the `useAllUserTokenBalances` and `useAllMintedTokens` hooks.

## Testing

When testing components that use wagmi hooks, you'll need to wrap them with the wagmi provider:

```typescript
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/wagmi-config';

function TestWrapper({ children }) {
  return (
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  );
}

// Use TestWrapper in your tests
```

## Troubleshooting

### Common Issues

1. **"Hook called outside of component"**: Make sure you're calling wagmi hooks inside React components
2. **Network errors**: Ensure the wallet is connected to the correct network
3. **Transaction failures**: Check gas fees and wallet balance

### Getting Help

- Check the wagmi documentation: https://wagmi.sh
- Review the example components in `components/smart-contract-examples.tsx`
- Check the API routes in `app/api/contract/`

## Next Steps

1. Start migrating simple components first
2. Test thoroughly in development
3. Gradually migrate more complex components
4. Remove the old service once migration is complete
5. Update documentation and examples
