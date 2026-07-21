const STAGES = Object.freeze(['intake', 'identity_verified', 'authorized', 'scheduled', 'in_service', 'disposition_complete', 'aftercare', 'closed']);

function validateIdentityEvent(input) {
  for (const field of ['case_id', 'identity_tag', 'event_type', 'location', 'witness_user_id']) {
    if (input[field] === undefined || input[field] === null || String(input[field]).trim() === '') throw new Error(`${field} is required`);
  }
  if (!['received', 'transferred', 'verified', 'released'].includes(input.event_type)) throw new Error('invalid identity event type');
  return { ...input, occurred_at: input.occurred_at || new Date().toISOString() };
}

function validateTransition(from, to, context = {}) {
  const allowed = { intake: ['identity_verified'], identity_verified: ['authorized'], authorized: ['scheduled'], scheduled: ['in_service'], in_service: ['disposition_complete'], disposition_complete: ['aftercare'], aftercare: ['closed'], closed: [] };
  if (!allowed[from]?.includes(to)) throw new Error('invalid case transition');
  if (to !== 'identity_verified' && !context.identityVerified) throw new Error('identity chain verification required');
  if (['authorized', 'scheduled', 'in_service', 'disposition_complete', 'closed'].includes(to) && !context.authorizationComplete) throw new Error('complete authorization required');
  if (['authorized', 'disposition_complete', 'closed'].includes(to) && !['licensed_director', 'manager', 'admin'].includes(context.role)) throw new Error('licensed staff approval required');
  if (to === 'closed' && !context.financialReconciled) throw new Error('financial reconciliation required');
  return true;
}

module.exports = { STAGES, validateIdentityEvent, validateTransition };
