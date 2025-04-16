/// <reference types="vitest/globals" />
// tests/customer-quota.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/db'; // Assuming db is accessible like this
import { contact as contactSchema } from '@/db-schema'; // Assuming schema is accessible
import { eq, count } from 'drizzle-orm'; // Import necessary Drizzle functions
import { v4 as uuidv4 } from 'uuid'; // For mocking new contact ID

// Define types needed for mocks/test data
// Updated Contact type to allow null for organizationId
type Contact = { id: string; email: string; organizationId: string | null; /* other needed fields */ };
// Add firstName to NewContact type
type NewContact = Omit<Contact, 'id'> & { 
  id?: string; 
  firstName?: string | null; // Allow optional firstName
}; // Allow optional ID for insertion mock

// --- Mocking Setup ---
// Mock the db object and its chained methods
// Define mockDbFluent *before* vi.mock
const mockDbFluent = {
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([{ value: 0 }]), // Default mock for select(...).from(...).where(...)
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 'mock-new-contact-id', email: 'new@example.com', organizationId: 'org-123' }]), // Default mock for insert(...).values(...).returning(...)
};

// Type for the mocked fluent object methods used
type MockDbFluent = typeof mockDbFluent;

// Type for the mocked db object itself
type MockDb = {
  select: vi.Mock<any[], MockDbFluent>;
  from: MockDbFluent['from'];
  where: MockDbFluent['where'];
  insert: vi.Mock<any[], MockDbFluent>;
  values: MockDbFluent['values'];
  returning: MockDbFluent['returning'];
};

// Use the pre-defined mockDbFluent in the factory with explicit return type
vi.mock('@/db', (): { db: MockDb } => ({
  db: {
    select: vi.fn(() => mockDbFluent),
    from: mockDbFluent.from,
    where: mockDbFluent.where,
    insert: vi.fn(() => mockDbFluent),
    values: mockDbFluent.values,
    returning: mockDbFluent.returning,
  },
}));

// Mock console.warn
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

// --- Test Suite ---
describe('Customer Quota Check Logic', () => {
  const testOrgId = 'org-123';
  const testUserId = 'user-abc'; // Included for context in logging
  const testQuota = 5; // Example customer quota
  const testNewContactEmail = 'new@example.com';
  const testNewContactName = 'New Contact';

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks(); // Clears call history and resets implementations defined with vi.fn()

    // Re-apply default implementations for mockDbFluent methods if needed, or set specific ones per test
    // This ensures mocks start fresh for each test.
    mockDbFluent.from.mockClear().mockReturnThis();
    mockDbFluent.where.mockClear().mockResolvedValue([{ value: 0 }]); // Reset count query mock
    mockDbFluent.values.mockClear().mockReturnThis();
    mockDbFluent.returning.mockClear().mockResolvedValue([{ id: uuidv4(), email: testNewContactEmail, organizationId: testOrgId }]); // Reset insert mock

    // Reset console spy
    consoleWarnSpy.mockClear();
  });

  // Helper function to simulate the relevant part of handleInboundMail
  async function checkAndPotentiallyCreateContact(
    orgId: string,
    userIdForLog: string, // Separate userId used only for logging message check
    quota: number,
    currentContactCountMock: number,
    newContactEmail: string,
    newContactName: string
  ): Promise<Contact | null> {

    let contactRecord: Contact | null = null; // Start assuming no existing contact

    // --- Logic under test ---
    if (!contactRecord) {
      // 1. Simulate the database call to count existing contacts
      // Configure the mock for THIS specific test call's result
      mockDbFluent.where.mockResolvedValueOnce([{ value: currentContactCountMock }]);
      const contactCountResult = await db
        .select({ value: count() })
        .from(contactSchema)
        .where(eq(contactSchema.organizationId, orgId));
      const currentContactCount = contactCountResult[0].value;

      // Verify the count query was made correctly
      expect(db.select).toHaveBeenCalledWith({ value: count() });
      expect(mockDbFluent.from).toHaveBeenCalledWith(contactSchema);
      expect(mockDbFluent.where).toHaveBeenCalledWith(eq(contactSchema.organizationId, orgId));

      // 2. Perform the quota check
      if (currentContactCount >= quota) {
        console.warn(
          `Organization ${orgId} (User: ${userIdForLog}) is over the customer quota (${currentContactCount}/${quota}). Cannot create new contact for ${newContactEmail}.`
        );
        // contactRecord remains null
      } else {
        // Create new contact (only if quota allows)
        const contactData: NewContact = {
          email: newContactEmail.toLowerCase(),
          firstName: newContactName || '', // Handle potential null/undefined name
          organizationId: orgId,
          // createdAt: new Date(), // Mock if necessary
          // updatedAt: new Date(), // Mock if necessary
        };

        // Simulate the insert call
        // Configure the mock for THIS specific test call's result (if needed, otherwise beforeEach default is used)
        const [newContact] = await db
          .insert(contactSchema)
          .values(contactData) // We can check if values() was called with correct data
          .returning();
        contactRecord = newContact; // Assign the (mocked) newly created contact

        // Verify insert was called
        expect(db.insert).toHaveBeenCalledWith(contactSchema);
        expect(mockDbFluent.values).toHaveBeenCalledWith(expect.objectContaining(contactData)); // Check the mock on the fluent object
        expect(mockDbFluent.returning).toHaveBeenCalled();
      }
    }
    // --- End Logic under test ---

    return contactRecord;
  }

  // --- Test Cases ---

  it('should return null and log warning when quota is exceeded', async () => {
    const mockCurrentCount = 5; // Equal to quota
    // Set the specific mock return value for the 'count' query for this test
    mockDbFluent.where.mockResolvedValueOnce([{ value: mockCurrentCount }]);

    const result = await checkAndPotentiallyCreateContact(testOrgId, testUserId, testQuota, mockCurrentCount, testNewContactEmail, testNewContactName);

    expect(result).toBeNull();
    expect(db.select).toHaveBeenCalledTimes(1);
    expect(mockDbFluent.where).toHaveBeenCalledTimes(1);
    expect(db.insert).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Organization ${testOrgId} (User: ${testUserId}) is over the customer quota (${mockCurrentCount}/${testQuota}). Cannot create new contact for ${testNewContactEmail}.`
    );
  });

  it('should attempt to create a contact when quota is available', async () => {
    const mockCurrentCount = 3; // Less than quota (5)
    const mockNewId = 'newly-created-id';
    // Set mocks specific to this test
    mockDbFluent.where.mockResolvedValueOnce([{ value: mockCurrentCount }]);
    mockDbFluent.returning.mockResolvedValueOnce([{ id: mockNewId, email: testNewContactEmail, organizationId: testOrgId }]);

    const result = await checkAndPotentiallyCreateContact(testOrgId, testUserId, testQuota, mockCurrentCount, testNewContactEmail, testNewContactName);

    expect(db.select).toHaveBeenCalledTimes(1);
    expect(mockDbFluent.where).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(mockDbFluent.values).toHaveBeenCalledWith({
      email: testNewContactEmail.toLowerCase(),
      firstName: testNewContactName,
      organizationId: testOrgId,
      id: expect.any(String)
    });
    expect(mockDbFluent.returning).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: mockNewId, email: testNewContactEmail, organizationId: testOrgId });
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should handle zero quota correctly (always deny)', async () => {
    const zeroQuota = 0;
    const mockCurrentCount = 0;
    mockDbFluent.where.mockResolvedValueOnce([{ value: mockCurrentCount }]);

    const result = await checkAndPotentiallyCreateContact(testOrgId, testUserId, zeroQuota, mockCurrentCount, testNewContactEmail, testNewContactName);

    expect(result).toBeNull();
    expect(db.insert).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Organization ${testOrgId} (User: ${testUserId}) is over the customer quota (${mockCurrentCount}/${zeroQuota}). Cannot create new contact for ${testNewContactEmail}.`
    );
  });

  it('should handle case where current count equals quota (deny)', async () => {
    const mockCurrentCount = 5; // Equal to quota
    mockDbFluent.where.mockResolvedValueOnce([{ value: mockCurrentCount }]);

    const result = await checkAndPotentiallyCreateContact(testOrgId, testUserId, testQuota, mockCurrentCount, testNewContactEmail, testNewContactName);

    expect(result).toBeNull();
    expect(db.insert).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      `Organization ${testOrgId} (User: ${testUserId}) is over the customer quota (${mockCurrentCount}/${testQuota}). Cannot create new contact for ${testNewContactEmail}.`
    );
  });

  it('should handle potential null/undefined contact name gracefully during insert', async () => {
    const mockCurrentCount = 2;
    const nullName = null;
    mockDbFluent.where.mockResolvedValueOnce([{ value: mockCurrentCount }]);
    mockDbFluent.returning.mockResolvedValueOnce([{ id: 'another-id', email: testNewContactEmail, organizationId: testOrgId }]);

    // Pass null for the name
    await checkAndPotentiallyCreateContact(testOrgId, testUserId, testQuota, mockCurrentCount, testNewContactEmail, nullName as any); // Use 'as any' if TS complains about null

    expect(db.insert).toHaveBeenCalledTimes(1);
    // Check that firstName was set to empty string
    expect(mockDbFluent.values).toHaveBeenCalledWith(expect.objectContaining({ firstName: '' }));
  });

  it('should convert email to lowercase before insertion', async () => {
    const mockCurrentCount = 1;
    const upperCaseEmail = 'TEST@EXAMPLE.COM';
    mockDbFluent.where.mockResolvedValueOnce([{ value: mockCurrentCount }]);
    mockDbFluent.returning.mockResolvedValueOnce([{ id: 'case-test-id', email: upperCaseEmail.toLowerCase(), organizationId: testOrgId }]);

    await checkAndPotentiallyCreateContact(testOrgId, testUserId, testQuota, mockCurrentCount, upperCaseEmail, testNewContactName);

    expect(db.insert).toHaveBeenCalledTimes(1);
    // Check that email was lowercased in the values call
    expect(mockDbFluent.values).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
  });

});
