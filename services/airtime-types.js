// Picks the airtime type to pre-select: VTU when the network offers it, otherwise the first one.
export const pickDefaultAirtimeType = (types) => {
  if (!Array.isArray(types) || types.length === 0) return null;
  const vtu = types.find((t) => /^\s*vtu\s*$/i.test(t?.type || ''))
    || types.find((t) => /vtu/i.test(t?.type || ''));
  return (vtu || types[0]).type;
};
