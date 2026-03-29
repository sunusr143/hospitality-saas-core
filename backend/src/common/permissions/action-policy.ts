export const ACTION_POLICY: Record<string, string[]> = {
  'users.manage': ['administration'],
  'rooms.status.update': ['front office', 'reservations', 'housekeeping', 'maintenance', 'administration'],
  'frontdesk.room-move': ['front office', 'reservations', 'administration'],
  'housekeeping.assign': ['housekeeping', 'administration'],
  'housekeeping.inspect': ['housekeeping', 'administration'],
  'maintenance.assign': ['maintenance', 'administration'],
  'billing.payment.post': ['finance', 'administration'],
  'billing.invoice.generate': ['finance', 'administration'],
  'billing.folio.close': ['finance', 'administration'],
  'payments.reconcile': ['finance', 'administration'],
  'procurement.manage': ['finance', 'administration'],
  'accounting.ledger.create': ['finance', 'administration'],
};
