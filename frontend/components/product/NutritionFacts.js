// Rendered like the panel printed on the tub.
export default function NutritionFacts({ facts }) {
  if (!facts || !facts.rows || !facts.rows.length) return null;
  const hasDv = facts.rows.some((r) => r.dailyValue);
  return (
    <div className="facts max-w-md">
      <div className="facts-title">Nutrition facts</div>
      {(facts.servingSize || facts.servingsPerContainer) && (
        <div className="border-b-4 border-black px-4 py-2 text-sm">
          {facts.servingSize && (
            <p>
              <span className="font-bold">Serving size</span> {facts.servingSize}
            </p>
          )}
          {facts.servingsPerContainer && (
            <p>
              <span className="font-bold">Servings per container</span> {facts.servingsPerContainer}
            </p>
          )}
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black text-left text-xs">
            <th scope="col" className="px-4 py-1.5 font-semibold">
              Per serving
            </th>
            <th scope="col" className="px-4 py-1.5 text-right font-semibold">
              Amount
            </th>
            {hasDv && (
              <th scope="col" className="px-4 py-1.5 text-right font-semibold">
                % RDA
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {facts.rows.map((r) => (
            <tr key={r.label} className="border-b border-black/80 last:border-b-0">
              <th scope="row" className="px-4 py-2 text-left font-bold">
                {r.label}
              </th>
              <td className="px-4 py-2 text-right tabular-nums">{r.amount}</td>
              {hasDv && <td className="px-4 py-2 text-right tabular-nums">{r.dailyValue || ''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
