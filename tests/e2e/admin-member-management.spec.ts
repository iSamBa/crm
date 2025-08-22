import { test, expect } from '@playwright/test'

test.describe('Admin Member Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login')
    
    // Login as admin
    await page.fill('[data-testid="email-input"]', 'admin@fitness.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for navigation to admin dashboard
    await page.waitForURL('/admin/dashboard')
  })

  test('should display member list', async ({ page }) => {
    // Navigate to members page
    await page.click('[data-testid="sidebar-members"]')
    await page.waitForURL('/admin/members')

    // Check that member list is displayed
    await expect(page.locator('[data-testid="members-table"]')).toBeVisible()
    
    // Check for member list items
    const memberRows = page.locator('[data-testid="member-row"]')
    expect(await memberRows.count()).toBeGreaterThan(0)

    // Verify table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Email")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("Join Date")')).toBeVisible()
  })

  test('should search for members', async ({ page }) => {
    await page.goto('/admin/members')

    // Use the search functionality
    const searchInput = page.locator('[data-testid="member-search"]')
    await searchInput.fill('John')
    
    // Wait for search results
    await page.waitForTimeout(500) // Give time for debounced search
    
    // Verify filtered results
    const memberRows = page.locator('[data-testid="member-row"]')
    const firstMemberName = memberRows.first().locator('[data-testid="member-name"]')
    await expect(firstMemberName).toContainText('John')
  })

  test('should filter members by status', async ({ page }) => {
    await page.goto('/admin/members')

    // Open status filter
    await page.click('[data-testid="status-filter"]')
    
    // Select 'Active' status
    await page.click('[data-testid="status-active"]')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Verify all displayed members have 'Active' status
    const statusBadges = page.locator('[data-testid="member-status"]')
    const count = await statusBadges.count()
    
    for (let i = 0; i < count; i++) {
      await expect(statusBadges.nth(i)).toContainText('Active')
    }
  })

  test('should create a new member', async ({ page }) => {
    await page.goto('/admin/members')

    // Click create member button
    await page.click('[data-testid="create-member-button"]')
    
    // Wait for form modal to open
    await expect(page.locator('[data-testid="member-form-modal"]')).toBeVisible()

    // Fill in member information
    await page.fill('[data-testid="first-name-input"]', 'Test')
    await page.fill('[data-testid="last-name-input"]', 'User')
    await page.fill('[data-testid="email-input"]', 'test.user@example.com')
    await page.fill('[data-testid="phone-input"]', '+1-555-0123')
    
    // Select membership status
    await page.click('[data-testid="membership-status-select"]')
    await page.click('[data-testid="status-option-active"]')

    // Add emergency contact
    await page.click('[data-testid="emergency-contact-toggle"]')
    await page.fill('[data-testid="emergency-name-input"]', 'Emergency Contact')
    await page.fill('[data-testid="emergency-phone-input"]', '+1-555-0124')
    await page.fill('[data-testid="emergency-relationship-input"]', 'Friend')

    // Submit the form
    await page.click('[data-testid="submit-member-form"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Member created successfully')
    
    // Verify the new member appears in the list
    await expect(page.locator('[data-testid="member-row"]:has-text("Test User")')).toBeVisible()
  })

  test('should edit an existing member', async ({ page }) => {
    await page.goto('/admin/members')

    // Click on the first member's edit button
    const firstMemberRow = page.locator('[data-testid="member-row"]').first()
    await firstMemberRow.locator('[data-testid="edit-member-button"]').click()
    
    // Wait for edit form to open
    await expect(page.locator('[data-testid="member-form-modal"]')).toBeVisible()
    
    // Verify form is pre-populated (check that first name field has a value)
    const firstNameInput = page.locator('[data-testid="first-name-input"]')
    await expect(firstNameInput).not.toHaveValue('')
    
    // Update the phone number
    const phoneInput = page.locator('[data-testid="phone-input"]')
    await phoneInput.clear()
    await phoneInput.fill('+1-555-9999')
    
    // Submit the form
    await page.click('[data-testid="submit-member-form"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Member updated successfully')
  })

  test('should view member details', async ({ page }) => {
    await page.goto('/admin/members')

    // Click on the first member's name to view details
    const firstMemberName = page.locator('[data-testid="member-name"]').first()
    await firstMemberName.click()
    
    // Wait for member detail page
    await page.waitForURL('**/admin/members/**')
    
    // Verify member detail sections are visible
    await expect(page.locator('[data-testid="member-info-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="member-sessions-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="member-subscription-info"]')).toBeVisible()
    
    // Verify key information is displayed
    await expect(page.locator('[data-testid="member-email"]')).toBeVisible()
    await expect(page.locator('[data-testid="member-phone"]')).toBeVisible()
    await expect(page.locator('[data-testid="member-status"]')).toBeVisible()
  })

  test('should freeze a member account', async ({ page }) => {
    await page.goto('/admin/members')

    // Find an active member and click freeze
    const activeMemberRow = page.locator('[data-testid="member-row"]:has([data-testid="member-status"]:has-text("Active"))').first()
    await activeMemberRow.locator('[data-testid="member-actions-menu"]').click()
    await page.click('[data-testid="freeze-member-action"]')
    
    // Confirm the freeze action
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible()
    await page.click('[data-testid="confirm-freeze"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Member account frozen')
    
    // Verify status changed to Frozen
    await expect(activeMemberRow.locator('[data-testid="member-status"]')).toContainText('Frozen')
  })

  test('should delete a member', async ({ page }) => {
    await page.goto('/admin/members')

    // Get the initial count of members
    const initialMemberRows = page.locator('[data-testid="member-row"]')
    const initialCount = await initialMemberRows.count()

    // Click on the first member's delete button
    const firstMemberRow = initialMemberRows.first()
    await firstMemberRow.locator('[data-testid="member-actions-menu"]').click()
    await page.click('[data-testid="delete-member-action"]')
    
    // Confirm deletion
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="confirm-dialog"]')).toContainText('Are you sure you want to delete this member?')
    await page.click('[data-testid="confirm-delete"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Member deleted successfully')
    
    // Verify member count decreased
    const finalMemberRows = page.locator('[data-testid="member-row"]')
    await expect(finalMemberRows).toHaveCount(initialCount - 1)
  })

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/admin/members')

    // Open create member form
    await page.click('[data-testid="create-member-button"]')
    await expect(page.locator('[data-testid="member-form-modal"]')).toBeVisible()

    // Try to submit empty form
    await page.click('[data-testid="submit-member-form"]')
    
    // Verify validation errors are shown
    await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name is required')
    await expect(page.locator('[data-testid="last-name-error"]')).toContainText('Last name is required')

    // Fill invalid email
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.click('[data-testid="submit-member-form"]')
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')

    // Fill invalid phone
    await page.fill('[data-testid="phone-input"]', 'abc-123')
    await page.click('[data-testid="submit-member-form"]')
    await expect(page.locator('[data-testid="phone-error"]')).toContainText('Invalid phone number format')
  })

  test('should export members to CSV', async ({ page }) => {
    await page.goto('/admin/members')

    // Start download promise before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.click('[data-testid="export-members-button"]')
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('members')
    expect(download.suggestedFilename()).toContain('.csv')
  })
})