/**
 * Orders store the delivery address twice: a `shippingAddress` JSON snapshot
 * taken at checkout, and a relation to the saved `Address` row it came from.
 *
 * The snapshot is the one to trust — the customer can edit or delete the saved
 * address afterwards and the order must still say where it actually went. But
 * orders placed before the checkout bug was fixed carry an *empty* snapshot,
 * because the browser posted an untouched form whenever a saved address was
 * selected. For those the relation is the only record of the address, so it is
 * used as a fallback rather than showing staff a blank card.
 */
export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  /** True when the snapshot was empty and the saved address was used instead. */
  fromSavedAddress: boolean;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const nameOf = (a: any) =>
  str(a?.fullName) || [str(a?.firstName), str(a?.lastName)].filter(Boolean).join(' ');

const isUsable = (a: any) => !!(a && str(a.addressLine1) && str(a.city) && str(a.pincode));

export function orderAddress(order: any): OrderAddress | null {
  const snapshot = order?.shippingAddress;
  const saved = order?.address;

  const source = isUsable(snapshot) ? snapshot : isUsable(saved) ? saved : null;
  if (!source) return null;

  return {
    name:     nameOf(source) || nameOf(saved) || '',
    phone:    str(source.phone) || str(saved?.phone),
    line1:    str(source.addressLine1),
    line2:    str(source.addressLine2),
    city:     str(source.city),
    state:    str(source.state),
    pincode:  str(source.pincode),
    country:  str(source.country) || 'India',
    fromSavedAddress: source === saved,
  };
}

/** One-line form, for tables and courier manifests. */
export function formatAddressLine(a: OrderAddress): string {
  return [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');
}

/** Multi-line block, for copying into a courier panel or writing on a label. */
export function formatAddressBlock(a: OrderAddress): string {
  return [
    a.name,
    a.line1,
    a.line2,
    `${a.city}, ${a.state} ${a.pincode}`,
    a.country,
    a.phone && `Phone: ${a.phone}`,
  ].filter(Boolean).join('\n');
}
