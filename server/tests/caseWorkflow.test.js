const test = require('node:test');
const assert = require('node:assert/strict');
const { validateIdentityEvent, validateTransition } = require('../domain/caseWorkflow');

test('requires a witnessed identity-chain event', () => assert.equal(validateIdentityEvent({ case_id: 1, identity_tag: 'TAG-1', event_type: 'received', location: 'intake', witness_user_id: 2 }).identity_tag, 'TAG-1'));
test('rejects incomplete identity events', () => assert.throws(() => validateIdentityEvent({ case_id: 1 }), /identity_tag/));
test('licensed approval and reconciliation gate case closure', () => {
  assert.throws(() => validateTransition('aftercare', 'closed', { role: 'staff', identityVerified: true, authorizationComplete: true, financialReconciled: true }), /licensed/);
  assert.equal(validateTransition('aftercare', 'closed', { role: 'licensed_director', identityVerified: true, authorizationComplete: true, financialReconciled: true }), true);
});
