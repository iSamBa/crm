# GitHub Secrets Setup for CI/CD Pipeline

This document explains how to configure GitHub repository secrets for the CI/CD pipeline to work properly.

## Required Secrets

### 1. **CODECOV_TOKEN** (Optional)
- **Purpose**: Upload test coverage reports to Codecov
- **Where to get**: [codecov.io](https://codecov.io) → Your repository → Settings → Copy token
- **Status**: Optional - CI will continue without it
- **Fallback**: Coverage upload will be skipped if not provided

### 2. **Test Database Secrets** (Optional)
For integration tests with a real test database:

#### **TEST_SUPABASE_URL**
- **Purpose**: URL for test Supabase instance
- **Example**: `https://your-test-project.supabase.co`
- **Fallback**: `https://demo.supabase.co` (will use mocked responses)

#### **TEST_SUPABASE_ANON_KEY**
- **Purpose**: Anonymous key for test Supabase instance
- **Where to get**: Supabase Dashboard → Settings → API → anon public key
- **Fallback**: `demo-anon-key` (will use mocked responses)

#### **TEST_SUPABASE_SERVICE_KEY**
- **Purpose**: Service role key for test Supabase instance
- **Where to get**: Supabase Dashboard → Settings → API → service_role secret key
- **Fallback**: `demo-service-key` (will use mocked responses)

## How to Set Up Secrets

### In GitHub Repository:

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the name and value

### Secret Names to Add:

```
CODECOV_TOKEN=your_codecov_token_here
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your_test_anon_key_here
TEST_SUPABASE_SERVICE_KEY=your_test_service_key_here
```

## CI/CD Behavior

### **With Secrets Configured:**
- ✅ Full integration testing with real test database
- ✅ Coverage reports uploaded to Codecov
- ✅ Complete CI/CD pipeline functionality

### **Without Secrets (Default):**
- ✅ All tests still pass using MSW mocks
- ✅ Build and deployment works
- ⚠️ Coverage upload skipped (continues without error)
- ⚠️ Integration tests use mocked responses

## Recommended Setup

### **For Open Source Projects:**
- Configure **CODECOV_TOKEN** for coverage reporting
- Leave database secrets empty (use mocks)

### **For Production Projects:**
- Configure **all secrets** for full integration testing
- Use dedicated test Supabase instance
- Set up proper test data isolation

## Test Database Setup (Optional)

If you want real integration testing:

1. **Create Test Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project (separate from production)
   - Name it clearly (e.g., "yourapp-test")

2. **Configure Test Database:**
   - Run the same migrations as production
   - Use test data or empty database
   - Ensure proper cleanup between test runs

3. **Security Considerations:**
   - Never use production database for testing
   - Use separate credentials for test environment
   - Limit test database access appropriately

## Troubleshooting

### **Coverage Upload Fails:**
```
Error: Codecov token not found
```
**Solution**: Add `CODECOV_TOKEN` secret or ignore (CI continues)

### **Integration Tests Fail:**
```
Error: Invalid API key
```
**Solution**: Check test database secrets or rely on mocks

### **Build Fails:**
```
Error: Environment variables missing
```
**Solution**: CI should work with fallback values - check workflow syntax

## Current Status

✅ **CI works without any secrets** (uses fallbacks and mocks)  
✅ **Tests pass with mock data**  
✅ **Build process works**  
✅ **Coverage generation works** (upload optional)  

The pipeline is designed to be robust and work out-of-the-box without requiring any secrets configuration.