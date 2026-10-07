import Link from 'next/link';
import { Dumbbell, Flame, HeartPulse, Leaf, RotateCcw, Zap } from 'lucide-react';
import { GOALS } from '@/lib/config';

const ICONS = { 'muscle-gain': Dumbbell, strength: Flame, recovery: RotateCcw, energy: Zap, 'weight-management': HeartPulse, 'general-wellness': Leaf };

export default function ShopByGoal() {
  return (
    <section className="container-site py-12 sm:py-16">
      <h2 className="h-section">Shop by goal</h2>
      {/* Phones: one compact row per goal. From 640px: tiles in a ruled grid. */}
      <ul className="mt-6 grid grid-cols-1 border-l-2 border-t-2 border-black sm:grid-cols-2 lg:grid-cols-3">
        {GOALS.map((g) => {
          const Icon = ICONS[g.slug];
          return (
            <li key={g.slug} className="border-b-2 border-r-2 border-black">
              <Link href={`/shop?goal=${g.slug}`} className="group flex h-full items-center gap-4 p-4 transition-colors hover:bg-lime sm:min-h-44 sm:flex-col sm:items-start sm:justify-between sm:gap-6 sm:p-6">
                <Icon className="size-7 shrink-0" strokeWidth={1.75} aria-hidden />
                <span className="min-w-0">
                  <span className="block font-display text-[1.7rem] font-black uppercase leading-[0.95] sm:text-4xl">{g.name}</span>
                  <span className="mt-0.5 block text-sm text-mute group-hover:text-black sm:mt-1 sm:text-[15px]">{g.blurb}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
