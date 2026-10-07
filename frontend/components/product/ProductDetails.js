import { Check, CircleAlert } from 'lucide-react';
import NutritionFacts from './NutritionFacts';

function Section({ id, title, children, open = false }) {
  return (
    <details id={id} open={open} className="group border-b border-black">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 font-display text-3xl font-black uppercase leading-none [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="relative ml-4 size-5 shrink-0 before:absolute before:left-0 before:top-1/2 before:h-0.5 before:w-full before:-translate-y-1/2 before:bg-black after:absolute after:left-1/2 after:top-0 after:h-full after:w-0.5 after:-translate-x-1/2 after:bg-black after:transition-transform group-open:after:rotate-90" />
      </summary>
      <div className="pb-8">{children}</div>
    </details>
  );
}

export default function ProductDetails({ product }) {
  const p = product;
  const hasFacts = p.nutritionFacts && p.nutritionFacts.rows && p.nutritionFacts.rows.length > 0;
  return (
    <div className="border-t-2 border-black">
      {p.description && (
        <Section id="description" title="Description" open>
          <div className="prose-bb" dangerouslySetInnerHTML={{ __html: p.description }} />
        </Section>
      )}
      {p.benefits && p.benefits.length > 0 && (
        <Section id="benefits" title="Benefits" open>
          <ul className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
            {p.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[1.0625rem]">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center bg-lime">
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {(hasFacts || p.ingredients) && (
        <Section id="nutrition" title={hasFacts ? 'Ingredients and nutrition facts' : 'Ingredients'} open>
          <div className="grid gap-8 md:grid-cols-2">
            {hasFacts && <NutritionFacts facts={p.nutritionFacts} />}
            {p.ingredients && (
              <div>
                <h3 className="mb-2 font-bold">Ingredients</h3>
                <p className="max-w-prose leading-relaxed">{p.ingredients}</p>
              </div>
            )}
          </div>
        </Section>
      )}
      {p.directions && (
        <Section id="directions" title="Directions">
          <p className="max-w-prose text-[1.0625rem] leading-relaxed">{p.directions}</p>
        </Section>
      )}
      {p.warnings && (
        <Section id="warnings" title="Warnings">
          <p className="flex max-w-prose items-start gap-3 leading-relaxed">
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
            {p.warnings}
          </p>
        </Section>
      )}
      {p.specifications && p.specifications.length > 0 && (
        <Section id="specifications" title="Specifications">
          <dl className="max-w-xl">
            {p.specifications.map((s) => (
              <div key={s.label} className="flex justify-between gap-6 border-b border-line py-2.5 text-[15px] last:border-b-0">
                <dt className="text-mute">{s.label}</dt>
                <dd className="text-right font-semibold">{s.value}</dd>
              </div>
            ))}
            {p.dietary && p.dietary.length > 0 && (
              <div className="flex justify-between gap-6 py-2.5 text-[15px]">
                <dt className="text-mute">Dietary</dt>
                <dd className="text-right font-semibold">{p.dietary.join(', ')}</dd>
              </div>
            )}
          </dl>
        </Section>
      )}
      {p.faqs && p.faqs.length > 0 && (
        <Section id="faqs" title="Questions and answers">
          <dl className="max-w-prose space-y-5">
            {p.faqs.map((f) => (
              <div key={f.question}>
                <dt className="font-bold">{f.question}</dt>
                <dd className="mt-1 leading-relaxed text-ink/90">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
    </div>
  );
}
