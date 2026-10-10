// Olimp Sports + Amix Nutrition catalogue (31 products).
// Prices: fill PRICES below [mrp, price] BEFORE running; products without a price are created as inactive drafts.
// Images: upload from the admin panel later (thumbnail uses the placeholder until then).
const PRICES = {
  // 'OLM-BETA-ALANINE-80': [1499, 1199],
};

const WARN = 'Food supplement. Not a substitute for a varied and balanced diet. Do not exceed the recommended daily dose. Keep out of reach of children. Not for use by persons under 18, pregnant or breastfeeding women. Consult a doctor before use if you have a medical condition or take medication. Store in a cool, dry place away from sunlight.';
const WARN_CAFF = `${WARN} Contains caffeine; not recommended for people sensitive to caffeine. Avoid combining with other caffeine sources.`;
const GENERIC_DIR = 'Take as per the dosage printed on the product label. Do not exceed the recommended daily dose.';

// p(brand, sku, name, cat, sub, type, short, about, benefits, extra)
const p = (brand, sku, name, cat, sub, productType, shortDescription, about, benefits, extra = {}) => ({
  brand, sku, name, cat, sub, productType, shortDescription,
  description: `<p>${about}</p><p>Original ${brand === 'Olimp Sports' ? 'Olimp Sports' : 'Amix Nutrition'} product, sold sealed in its original packaging.</p>`,
  benefits, directions: GENERIC_DIR, warnings: WARN, dietary: [], goals: ['general-wellness'],
  mrp: 0, price: 0, stock: 0, tags: [], ...extra,
});
const spec = (...rows) => rows.map(([label, value]) => ({ label, value }));
const O = 'Olimp Sports';
const A = 'Amix Nutrition';

const products = [
  // ---------------- OLIMP SPORTS ----------------
  p(O, 'OLM-BETA-ALANINE-80', 'Olimp Beta-Alanine Carno Rush Mega Tabs (80 Tablets)', 'Performance', 'Amino Acids', 'Tablet',
    'High-dose beta-alanine with L-histidine and vitamin B6 in easy-to-swallow mega tabs, made for strength and endurance training.',
    'Beta-Alanine Carno Rush Mega Tabs combine beta-alanine with L-histidine and vitamin B6. Beta-alanine is the rate-limiting building block of carnosine in muscle, which is why it is a staple for high-rep, high-intensity and endurance work.',
    ['Beta-alanine plus L-histidine for carnosine synthesis', 'Vitamin B6 contributes to normal energy-yielding metabolism and reduces tiredness and fatigue', 'Tablet format, no powder to mix', 'Suited to strength, HIIT and endurance athletes'],
    { ingredients: 'Beta-alanine, L-histidine hydrochloride, bulking agent: cellulose, sodium citrate, anti-caking agents: magnesium salts of fatty acids, silicon dioxide, thickener: cross-linked sodium carboxymethylcellulose, pyridoxine hydrochloride (vitamin B6).',
      directions: 'Take 2 to 3 tablets daily, preferably before training, with water. Use consistently for best results. A temporary tingling sensation (paraesthesia) is a normal reaction to beta-alanine.',
      specifications: spec(['Form', 'Tablets'], ['Pack size', '80 tablets'], ['Key ingredient', 'Beta-alanine']),
      faqs: [{ question: 'Why do I feel tingling?', answer: 'Tingling is a known, harmless reaction to beta-alanine and usually fades with regular use.' }],
      tags: ['beta alanine', 'olimp', 'endurance', 'pre workout'], goals: ['strength', 'energy'], weightGrams: 180 }),

  p(O, 'OLM-TAURINE-120', 'Olimp Taurine Mega Caps (120 Capsules)', 'Performance', 'Amino Acids', 'Capsule',
    'Pure taurine in mega caps for active people who train hard and sweat a lot.',
    'Taurine is a widely used amino sulphonic acid found in muscle tissue. Olimp Taurine Mega Caps give you a clean, single-ingredient taurine capsule that is easy to fit around training.',
    ['Single-ingredient taurine capsules', 'Popular with athletes in endurance and high-volume training', 'Easy to stack with creatine and pre-workouts', 'Convenient capsule format'],
    { directions: 'Take 2 capsules daily with water, preferably around training, or as per the pack label.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules'], ['Key ingredient', 'Taurine']),
      tags: ['taurine', 'olimp', 'amino acid'], goals: ['energy', 'recovery'], weightGrams: 120 }),

  p(O, 'OLM-CREATINE-MEGA-120', 'Olimp Creatine Mega Caps (120 Capsules)', 'Performance', 'Creatine', 'Capsule',
    'Micronized creatine monohydrate in 1250 mg capsules. Simple, proven and powder-free.',
    'Creatine Mega Caps deliver micronized creatine monohydrate in a convenient capsule. Creatine increases physical performance in successive bursts of short-term, high-intensity exercise (benefit applies with a daily intake of 3 g).',
    ['1250 mg micronized creatine monohydrate per capsule', 'Supports performance in repeated short, intense efforts', 'No mixing, no taste, easy to carry', 'Works well alongside any protein or pre-workout'],
    { ingredients: 'Micronized creatine monohydrate, bulking agent: microcrystalline cellulose, anti-caking agent: magnesium salts of fatty acids, capsule shell (gelatin).',
      directions: 'Take 3 capsules daily with water. On training days take around your workout; on rest days take at any time of day.',
      specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules'], ['Creatine per capsule', '1250 mg']),
      tags: ['creatine', 'monohydrate', 'olimp'], goals: ['strength', 'muscle-gain'], weightGrams: 150 }),

  p(O, 'OLM-TCM-MEGA-120', 'Olimp TCM Mega Caps (120 Capsules)', 'Performance', 'Creatine', 'Capsule',
    'Tri-creatine malate in mega caps: a creatine form bound to malic acid for strength and power athletes.',
    'TCM stands for tri-creatine malate, a creatine form in which three creatine molecules are bound to malic acid. These capsules offer an alternative to creatine monohydrate for users who like to rotate forms.',
    ['Tri-creatine malate (3 creatine : 1 malic acid)', 'Capsule format, no powder to mix', 'Aimed at strength, power and mass phases', 'Easy to dose and travel with'],
    { directions: 'Take 3 capsules daily with water, around training on training days. Follow the pack label.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules'], ['Key ingredient', 'Tri-creatine malate']),
      tags: ['tcm', 'creatine malate', 'olimp'], goals: ['strength', 'muscle-gain'], weightGrams: 150 }),

  p(O, 'OLM-THERMO-SPEED-EXTREME-120', 'Olimp Thermo Speed Extreme Mega Caps (120 Capsules)', 'Weight Management', 'Fat Burners', 'Capsule',
    'Thermogenic complex with caffeine and plant extracts to support energy during calorie-controlled training phases.',
    'Thermo Speed Extreme is a stimulant-containing thermogenic formula built for people in a cutting phase who want extra energy and focus in training. It is not a substitute for a calorie deficit and an active lifestyle.',
    ['Caffeine-based energy and focus support', 'Designed for use during reduction diets', 'Mega caps format', 'Pairs with a calorie-controlled plan and regular training'],
    { directions: 'Take 1 capsule 2 times daily with water, preferably in the first half of the day. Do not take late in the evening.', warnings: WARN_CAFF,
      specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules'], ['Contains caffeine', 'Yes']),
      tags: ['fat burner', 'thermogenic', 'olimp', 'cutting'], goals: ['weight-management', 'energy'], weightGrams: 150 }),

  p(O, 'OLM-ALKAGEN-120', 'Olimp Alkagen (120 Capsules)', 'Health & Wellness', 'Minerals', 'Capsule',
    'Mineral-based capsules formulated to support acid-base balance in people on high-protein, high-intensity diets.',
    'Alkagen is a mineral supplement designed with athletes in mind, particularly those eating high-protein diets and training hard. Refer to the pack for the full mineral composition and daily values.',
    ['Mineral support for athletes on high-protein diets', 'Capsule format', 'Supports normal acid-base balance', '120 capsules per pack'],
    { directions: 'Take as per the dosage given on the pack, with water and a meal.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules']),
      tags: ['alkagen', 'minerals', 'olimp', 'acid base'], goals: ['recovery', 'general-wellness'], weightGrams: 150 }),

  p(O, 'OLM-FLEX-XPLODE-GRAPEFRUIT-504G', 'Olimp Flex Xplode Joint Support Powder, Grapefruit (504 g)', 'Health & Wellness', 'Joint Support', 'Powder',
    'Joint support drink powder with glucosamine, chondroitin, MSM and collagen in a refreshing grapefruit flavour.',
    'Flex Xplode is a drink-mix aimed at athletes and active adults who put regular load on their joints. It combines classic joint-support ingredients with vitamin C, which contributes to normal collagen formation for the normal function of cartilage.',
    ['Joint-support complex in a tasty drink', 'Vitamin C contributes to normal collagen formation for normal cartilage function', 'Grapefruit flavour', 'Mix-and-drink, no capsules to swallow'],
    { directions: 'Dissolve 1 serving in about 250 ml of water and drink once daily, preferably after training or with a meal.',
      specifications: spec(['Form', 'Powder'], ['Flavour', 'Grapefruit'], ['Net weight', '504 g']),
      faqs: [{ question: 'Is this for daily use?', answer: 'Yes, it is designed as a daily supplement. Follow the serving size on the pack.' }],
      tags: ['joint support', 'flex xplode', 'glucosamine', 'olimp'], goals: ['recovery', 'general-wellness'], weightGrams: 560 }),

  p(O, 'OLM-GOLD-OMEGA3-D3K2-60', 'Olimp Gold Omega 3 D3+K2 Sports Edition (60 Capsules)', 'Health & Wellness', 'Omega', 'Softgel',
    'Fish-oil omega-3 (EPA and DHA) with vitamin D3 and K2 in one daily softgel, tuned for athletes.',
    'Gold Omega 3 D3+K2 Sports Edition combines omega-3 fatty acids with vitamin D3 and vitamin K2. DHA contributes to normal brain function and vision, EPA and DHA to normal heart function, and vitamin D to normal muscle function and the maintenance of normal bones.',
    ['EPA and DHA omega-3 from fish oil', 'Vitamin D3 contributes to normal muscle function and the immune system', 'Vitamin K2 contributes to the maintenance of normal bones', 'Sports Edition: made for people with high training load'],
    { directions: 'Take 1 to 2 softgels daily with a meal, or as per the pack label.', specifications: spec(['Form', 'Softgels'], ['Pack size', '60 capsules'], ['Source', 'Fish oil']),
      tags: ['omega 3', 'fish oil', 'vitamin d3', 'vitamin k2', 'olimp'], goals: ['general-wellness', 'recovery'], weightGrams: 100 }),

  p(O, 'OLM-PLATINUM-GINSENG-60', 'Olimp Platinum Ginseng Sport Edition (60 Capsules)', 'Weight Management', 'Energy Support', 'Capsule',
    'Standardised ginseng extract formulated for physically active people who want everyday vitality support.',
    'Platinum Ginseng Sport Edition is built around a ginseng root extract and is positioned for athletes who want support for energy and stamina during demanding training weeks.',
    ['Ginseng extract in a daily capsule', 'Sport Edition formula', 'Supports everyday energy and vitality', '60 capsules per pack'],
    { directions: 'Take 1 capsule daily with water, preferably in the morning or before training. Follow the pack label.', specifications: spec(['Form', 'Capsules'], ['Pack size', '60 capsules'], ['Key ingredient', 'Ginseng extract']),
      tags: ['ginseng', 'energy', 'olimp', 'vitality'], goals: ['energy'], weightGrams: 90 }),

  p(O, 'OLM-VITA-MIN-ONE-60', 'Olimp Vita-Min One (60 Capsules)', 'Health & Wellness', 'Multivitamins', 'Capsule',
    'A once-a-day vitamin and mineral formula to cover everyday micronutrient needs on a hard-training schedule.',
    'Vita-Min One is a daily multivitamin and mineral formula designed to help fill nutritional gaps for people who train regularly. Check the pack for the full vitamin and mineral list.',
    ['Daily multivitamin and mineral support', 'Convenient capsule format', 'Helps cover micronutrient gaps in active diets', '60 capsules per pack'],
    { directions: 'Take 1 capsule daily with a meal and a glass of water, or as per the pack label.', specifications: spec(['Form', 'Capsules'], ['Pack size', '60 capsules']),
      tags: ['multivitamin', 'vitamins', 'minerals', 'olimp'], goals: ['general-wellness'], weightGrams: 90 }),

  p(O, 'OLM-AMOK-POWER-60', 'Olimp Amok Power Caps (60 Capsules)', 'Performance', 'Pre Workout', 'Capsule',
    'Capsule pre-workout with taurine, beta-alanine, caffeine, guarana and ginseng for energy and focus in tough sessions.',
    'Amok Power is a capsule pre-workout developed with combat-sport athletes. It combines taurine, beta-alanine and L-tyrosine with caffeine, guarana and Korean ginseng extract, plus magnesium and vitamin B6.',
    ['125 mg caffeine per capsule (plus 25 mg from guarana)', '400 mg taurine and 300 mg beta-alanine per capsule', 'Magnesium and vitamin B6 for normal energy metabolism', 'Powder-free, easy to carry to the gym'],
    { ingredients: 'Taurine, beta-alanine, filler: microcrystalline cellulose, magnesium oxide, caffeine anhydrous, Korean ginseng root extract (Panax ginseng), guarana seed extract, anti-caking agents: magnesium salts of fatty acids, silicon dioxide, pyridoxine hydrochloride (vitamin B6), capsule (gelatin).',
      nutritionFacts: { servingSize: '1 capsule (use 1 to 2)', servingsPerContainer: '30 to 60', rows: [
        { label: 'Vitamin B6', amount: '1.75 mg', dailyValue: '125%' }, { label: 'Magnesium', amount: '125 mg', dailyValue: '33%' }, { label: 'Taurine', amount: '400 mg' }, { label: 'Beta-alanine', amount: '300 mg' },
        { label: 'Caffeine (anhydrous)', amount: '125 mg' }, { label: 'Guarana extract (incl. 25 mg caffeine)', amount: '50 mg' }, { label: 'Korean ginseng extract', amount: '75 mg' }] },
      directions: 'Body weight under 70 kg: 1 capsule about 30 minutes before training. Over 70 kg: 2 capsules about 30 minutes before training.', warnings: WARN_CAFF,
      specifications: spec(['Form', 'Capsules'], ['Pack size', '60 capsules'], ['Caffeine per capsule', '125 mg + 25 mg (guarana)']),
      faqs: [{ question: 'When should I take it?', answer: 'About 30 minutes before training. Avoid late-evening use because of the caffeine.' }],
      tags: ['pre workout', 'amok', 'caffeine', 'olimp'], goals: ['energy', 'strength'], weightGrams: 94 }),

  p(O, 'OLM-DAA-XTREME-PROLACT-60', 'Olimp DAA Xtreme Prolact-Block (60 Tablets)', 'Men\'s Health & Hormonal Support', 'Testosterone Support', 'Tablet',
    'D-aspartic acid based tablets in a formula positioned for men in strength and mass-building phases.',
    'DAA Xtreme Prolact-Block is a D-aspartic acid (DAA) formula for men who train for strength and size. See the pack for the complete composition and the daily serving.',
    ['D-aspartic acid based formula', 'Made for male strength athletes', 'Tablet format', '60 tablets per pack'],
    { directions: 'Take as per the pack label, with water. Do not exceed the recommended daily dose.', warnings: `${WARN} For adult men only.`, specifications: spec(['Form', 'Tablets'], ['Pack size', '60 tablets'], ['Key ingredient', 'D-aspartic acid']),
      tags: ['daa', 'd-aspartic acid', 'olimp', 'mens health'], goals: ['strength', 'muscle-gain'], weightGrams: 100 }),

  p(O, 'OLM-FORTEST-120', 'Olimp Fortest (120 Capsules)', 'Men\'s Health & Hormonal Support', 'Testosterone Support', 'Capsule',
    'Herbal and nutrient capsule formula designed for men who lift, with a focus on male vitality.',
    'Fortest is a capsule supplement made for men in regular strength training. Check the pack for the exact blend and daily serving.',
    ['Made for male strength athletes', 'Capsule format', 'Daily vitality support', '120 capsules per pack'],
    { directions: 'Take as per the pack label with water. Do not exceed the recommended daily dose.', warnings: `${WARN} For adult men only.`, specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules']),
      tags: ['fortest', 'mens health', 'olimp', 'vitality'], goals: ['strength', 'muscle-gain'], weightGrams: 150 }),

  p(O, 'OLM-ARGI-POWER-120', 'Olimp Argi Power Mega Caps (120 Capsules)', 'Performance', 'Amino Acids', 'Capsule',
    'L-arginine mega caps, a classic amino acid for pump-focused training.',
    'Argi Power Mega Caps provide L-arginine in a concentrated capsule. L-arginine is a conditionally essential amino acid popular in pump and pre-workout routines.',
    ['L-arginine in a concentrated mega cap', 'Popular for pump-focused training', 'Easy to stack with pre-workouts', '120 capsules per pack'],
    { directions: 'Take 2 to 3 capsules before training with water, or as per the pack label.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules'], ['Key ingredient', 'L-arginine']),
      tags: ['arginine', 'l-arginine', 'pump', 'olimp'], goals: ['strength', 'energy'], weightGrams: 150 }),

  // ---------------- AMIX NUTRITION ----------------
  p(A, 'AMX-GH-STIMULANT-MAX-120', 'Amix GH Stimulant Maximum (120 Capsules)', 'Performance', 'Amino Acids', 'Capsule',
    'Night-time amino acid and nutrient blend positioned for recovery and sleep-time support.',
    'GH Stimulant Maximum is an amino-acid-based capsule formula designed to be taken in the evening or before bed by people in hard training. See the pack for the full composition.',
    ['Amino-acid based evening formula', 'Designed for recovery-focused routines', 'Capsule format', '120 capsules per pack'],
    { directions: 'Take as per the pack label, usually in the evening or before bed on an empty stomach, with water.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules']),
      tags: ['gh stimulant', 'amino acids', 'recovery', 'amix'], goals: ['recovery', 'muscle-gain'], weightGrams: 150 }),

  p(A, 'AMX-PERUVIAN-MACA-750-120', 'Amix Peruvian Maca 750 mg (120 Capsules)', 'Men\'s Health & Hormonal Support', 'Adaptogens', 'Capsule',
    'Peruvian maca root capsules at 750 mg, a traditional Andean root used for energy and vitality.',
    'Maca (Lepidium meyenii) is a root native to the Peruvian Andes. Amix Peruvian Maca provides 750 mg of maca per capsule for daily vitality and stamina support.',
    ['750 mg maca per capsule', 'Traditional Andean adaptogenic root', 'Daily energy and vitality support', '120 capsules per pack'],
    { ingredients: 'Peruvian maca root (Lepidium meyenii), capsule shell.', directions: 'Take 1 capsule daily with water, preferably with a meal, or as per the pack label.',
      specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules'], ['Per capsule', '750 mg maca'], ['Origin', 'Peru (maca root)']), dietary: ['Vegetarian'],
      tags: ['maca', 'peruvian maca', 'adaptogen', 'amix'], goals: ['energy', 'general-wellness'], weightGrams: 150 }),

  p(A, 'AMX-ATP-ENERGY-PEAK-90', 'Amix ATP Energy with PEAK ATP (90 Capsules)', 'Performance', 'Pre Workout', 'Capsule',
    'Branded PEAK ATP (adenosine 5\'-triphosphate disodium) capsules for strength and power sessions.',
    'ATP Energy uses PEAK ATP, a clinically studied form of oral adenosine triphosphate, popular with strength and power athletes as part of a pre-workout routine.',
    ['Contains patented PEAK ATP', 'Used in strength and power training stacks', 'Stimulant-free energy-system support', '90 capsules per pack'],
    { ingredients: 'Adenosine 5\'-triphosphate disodium (PEAK ATP), capsule shell. See pack for full list.', directions: 'Take as per the pack label, typically 30 to 60 minutes before training with water.',
      specifications: spec(['Form', 'Capsules'], ['Pack size', '90 capsules'], ['Key ingredient', 'PEAK ATP']),
      tags: ['atp', 'peak atp', 'pre workout', 'amix'], goals: ['strength', 'energy'], weightGrams: 120 }),

  p(A, 'AMX-OPTI-PACK-COMPLETE-30', 'Amix OPTI-PACK Complete & Full (30 Day Pack)', 'Health & Wellness', 'Multivitamins', 'Pack',
    'A 30-day daily pack of vitamins, minerals and complementary nutrients for athletes, one sachet per day.',
    'OPTI-PACK Complete & Full is a daily-sachet system that combines vitamins, minerals and complementary nutrients so you do not have to manage a shelf of separate bottles. One sachet a day for 30 days.',
    ['One pack per day, 30-day supply', 'Vitamins, minerals and complementary nutrients in one routine', 'Made for people in regular training', 'Easy to travel with'],
    { directions: 'Take the contents of 1 daily pack with a meal and a glass of water.', specifications: spec(['Form', 'Daily packs'], ['Duration', '30 days']),
      tags: ['opti pack', 'multivitamin', 'daily pack', 'amix'], goals: ['general-wellness', 'recovery'], weightGrams: 400 }),

  p(A, 'AMX-MYTOTEST-V3-90', 'Amix MuscleCore DW MytoTest V3 (90 Capsules)', 'Men\'s Health & Hormonal Support', 'Testosterone Support', 'Capsule',
    'Multi-ingredient male support formula with MyTosterone, Testofen, rhodiola, maca, D-aspartic acid and more.',
    'MuscleCore MytoTest V3 is a once-daily capsule formulated with LargeLife Laboratories with Amix team athletes. It features MyTosterone, Testofen fenugreek extract, rhodiola, damiana, maca, D-aspartic acid, ginkgo, cordyceps and zinc.',
    ['MyTosterone 400 mg per capsule', 'Testofen fenugreek extract, rhodiola, maca, DAA', 'Zinc contributes to the maintenance of normal testosterone levels in the blood', 'Simple 1 capsule per day'],
    { nutritionFacts: { servingSize: '1 capsule', servingsPerContainer: '90', rows: [
        { label: 'MyTosterone', amount: '400 mg' }, { label: 'Rhodiola rosea extract', amount: '75 mg' }, { label: 'Peruvian maca root extract', amount: '50 mg' }, { label: 'D-aspartic acid', amount: '50 mg' },
        { label: 'Damiana extract', amount: '25 mg' }, { label: 'Testofen', amount: '25 mg' }, { label: 'Ginkgo biloba extract', amount: '25 mg' }, { label: 'Cordyceps sinensis extract', amount: '25 mg' }, { label: 'Zinc oxide (zinc 5 mg)', amount: '5 mg', dailyValue: '50%' }] },
      directions: 'Take 1 capsule once daily with water.', warnings: `${WARN} For adult men only. Manufactured in a facility that handles milk, eggs, soy and crustaceans.`,
      specifications: spec(['Form', 'Capsules'], ['Pack size', '90 capsules'], ['Serving', '1 capsule daily']),
      tags: ['mytotest', 'musclecore', 'testosterone support', 'amix'], goals: ['strength', 'muscle-gain'], weightGrams: 120 }),

  p(A, 'AMX-CREAGE-CONC-120', 'Amix MuscleCore DW CreAge Concentrated (120 Capsules)', 'Performance', 'Creatine', 'Capsule',
    'Concentrated multi-form creatine capsules from the MuscleCore DW line.',
    'MuscleCore DW CreAge Concentrated is a creatine-based capsule formula for strength and mass phases. See the pack for the exact creatine forms and serving.',
    ['Concentrated creatine formula', 'Capsule format, no mixing', 'Made for strength and power training', '120 capsules per pack'],
    { directions: 'Take as per the pack label with water, around training on training days.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules']),
      tags: ['creatine', 'creage', 'musclecore', 'amix'], goals: ['strength', 'muscle-gain'], weightGrams: 150 }),

  p(A, 'AMX-HMB-POWDER-250G', 'Amix HMB Powder (250 g)', 'Performance', 'Amino Acids', 'Powder',
    'Unflavoured HMB powder, a leucine metabolite used by lifters in hard training and cutting phases.',
    'HMB (beta-hydroxy beta-methylbutyrate) is a metabolite of the amino acid leucine. Amix HMB Powder lets you dose it flexibly in water or a shake.',
    ['Pure HMB powder', 'Flexible dosing in water or a shake', 'Used in heavy training and calorie-deficit phases', '250 g tub'],
    { directions: 'Mix the serving from the pack in water or a shake and take daily, split around training if directed on the label.', specifications: spec(['Form', 'Powder'], ['Net weight', '250 g'], ['Key ingredient', 'HMB']),
      tags: ['hmb', 'amino acids', 'recovery', 'amix'], goals: ['recovery', 'muscle-gain'], weightGrams: 300 }),

  p(A, 'AMX-MUSCLEDROL-ANABOLIC-60', 'Amix MuscleCore DW MuscleDrol Anabolic (60 Capsules)', 'Men\'s Health & Hormonal Support', 'Testosterone Support', 'Capsule',
    'Capsule formula from the MuscleCore DW line, built for hard-training adult men.',
    'MuscleCore DW MuscleDrol Anabolic is a capsule supplement from Amix\'s MuscleCore line aimed at advanced training. Refer to the pack for composition and serving.',
    ['Part of the MuscleCore DW range', 'Capsule format', 'Aimed at advanced strength training', '60 capsules per pack'],
    { directions: 'Take as per the pack label with water. Do not exceed the recommended daily dose.', warnings: `${WARN} For adult men only.`, specifications: spec(['Form', 'Capsules'], ['Pack size', '60 capsules']),
      tags: ['muscledrol', 'musclecore', 'amix', 'mass'], goals: ['muscle-gain', 'strength'], weightGrams: 100 }),

  p(A, 'AMX-OPTI-PACK-OSTEO-FLEX-30', 'Amix OPTI-PACK Osteo Flex (30 Day Pack)', 'Health & Wellness', 'Joint Support', 'Pack',
    'A 30-day joint and bone support pack with daily sachets for athletes.',
    'OPTI-PACK Osteo Flex is a 30-day daily-pack system for joint and bone support, designed for people who train hard and put regular load on their joints.',
    ['Joint and bone support in a daily pack', '30-day supply', 'Easy daily routine', 'Made for athletes under heavy training load'],
    { directions: 'Take the contents of 1 daily pack with a meal and a glass of water.', specifications: spec(['Form', 'Daily packs'], ['Duration', '30 days']),
      tags: ['opti pack', 'osteo flex', 'joint support', 'amix'], goals: ['recovery', 'general-wellness'], weightGrams: 400 }),

  p(A, 'AMX-EPO-CORE-VO2-120', 'Amix Performance Epo-Core VO2 Max (120 Capsules)', 'Performance', 'Pre Workout', 'Capsule',
    'Endurance-focused capsule formula for runners, cyclists and anyone chasing aerobic capacity.',
    'Epo-Core VO2 Max is an endurance-oriented formula in capsule form, built for athletes who care about aerobic performance. See the pack for the exact composition.',
    ['Endurance-focused formulation', 'Made for runners, cyclists and conditioning work', 'Capsule format', '120 capsules per pack'],
    { directions: 'Take as per the pack label with water, usually before training.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules']),
      tags: ['vo2 max', 'endurance', 'epo core', 'amix'], goals: ['energy', 'strength'], weightGrams: 150 }),

  p(A, 'AMX-HEPACOR-90', 'Amixpro HepaCOR Protector (90 Capsules)', 'Health & Wellness', 'Liver Support', 'Capsule',
    'Daily liver-support capsules with plant and nutrient ingredients for people on demanding supplement stacks.',
    'HepaCOR Protector is a liver-support formula in capsule form, positioned for athletes and active adults who want everyday nutritional support for normal liver function.',
    ['Everyday liver-support formula', 'Capsule format', 'Often chosen by people running multi-supplement stacks', '90 capsules per pack'],
    { directions: 'Take as per the pack label with water and a meal.', specifications: spec(['Form', 'Capsules'], ['Pack size', '90 capsules']),
      tags: ['liver support', 'hepacor', 'detox', 'amix'], goals: ['general-wellness', 'recovery'], weightGrams: 120 }),

  p(A, 'AMX-GLYNAC-120', 'Amixpro GlyN-A-C (120 Capsules)', 'Health & Wellness', 'Amino Acids', 'Capsule',
    'Glycine plus N-acetylcysteine (GlyNAC) capsules, two amino acids tied to the body\'s glutathione pathway.',
    'GlyN-A-C combines glycine and N-acetylcysteine (NAC), the two precursors the body uses to make glutathione. A simple daily-wellness stack in capsule form.',
    ['Glycine + N-acetylcysteine', 'Daily antioxidant-pathway support', 'Capsule format', '120 capsules per pack'],
    { directions: 'Take as per the pack label with water.', specifications: spec(['Form', 'Capsules'], ['Pack size', '120 capsules'], ['Key ingredients', 'Glycine, N-acetylcysteine']),
      tags: ['glynac', 'nac', 'glycine', 'amix'], goals: ['general-wellness', 'recovery'], weightGrams: 150 }),

  p(A, 'AMX-TURKESTERONE-180', 'Amixpro Turkesterone (180 Capsules)', 'Performance', 'Amino Acids', 'Capsule',
    'Turkesterone, a plant ecdysteroid from Ajuga turkestanica, in a 180-capsule value pack.',
    'Turkesterone is an ecdysteroid extracted from Ajuga turkestanica. It is used by strength athletes as part of a performance stack.',
    ['Plant-derived ecdysteroid (Ajuga turkestanica)', 'Popular in strength and mass-phase stacks', 'Capsule format', '180 capsules per pack'],
    { directions: 'Take as per the pack label with water and a meal.', specifications: spec(['Form', 'Capsules'], ['Pack size', '180 capsules'], ['Source', 'Ajuga turkestanica']),
      tags: ['turkesterone', 'ajuga turkestanica', 'amix'], goals: ['muscle-gain', 'strength'], weightGrams: 200 }),

  p(A, 'AMX-INOSINE-600-100', 'Amix Inosine 600 (100 Capsules)', 'Performance', 'Amino Acids', 'Capsule',
    'Inosine capsules at 600 mg, a nucleoside used in endurance and pre-workout stacks.',
    'Inosine is a naturally occurring nucleoside. Amix Inosine 600 gives a straightforward single-ingredient capsule for athletes who like to build their own stack.',
    ['600 mg inosine per capsule', 'Single-ingredient, easy to stack', 'Capsule format', '100 capsules per pack'],
    { directions: 'Take as per the pack label with water, usually before training.', specifications: spec(['Form', 'Capsules'], ['Pack size', '100 capsules'], ['Per capsule', '600 mg inosine']),
      tags: ['inosine', 'pre workout', 'amix'], goals: ['energy', 'strength'], weightGrams: 130 }),

  p(A, 'AMX-GLUTAMINE-MANGO-360G', 'Amix L-Glutamine Powder Drink, Mango (360 g)', 'Performance', 'Amino Acids', 'Powder',
    'Mango-flavoured L-glutamine drink powder for post-workout and recovery routines.',
    'L-glutamine is one of the most abundant free amino acids in muscle. Amix L-Glutamine Powder Drink comes in a Mango flavour that mixes into water for post-training use.',
    ['L-glutamine in a flavoured drink powder', 'Mango flavour', 'Fits post-workout and rest-day routines', '360 g tub'],
    { directions: 'Mix 1 serving per the pack scoop or label in water and drink after training or as directed.', specifications: spec(['Form', 'Powder'], ['Flavour', 'Mango'], ['Net weight', '360 g'], ['Key ingredient', 'L-glutamine']),
      tags: ['glutamine', 'l-glutamine', 'recovery', 'amix'], goals: ['recovery'], weightGrams: 420 }),

  p(A, 'AMX-BLACKLINE-CREATINE-300', 'Amix Black Line Creatine Capsules (300 Capsules)', 'Performance', 'Creatine', 'Capsule',
    'Black Line creatine capsules in a 300-count value pack.',
    'Black Line Creatine Capsules deliver creatine in a high-count pack so you can stock up for a long cycle without mixing powder.',
    ['300-capsule value pack', 'Powder-free creatine', 'Easy to carry and dose', 'Pairs with any protein or pre-workout'],
    { directions: 'Take as per the pack label with water, around training on training days.', specifications: spec(['Form', 'Capsules'], ['Pack size', '300 capsules']),
      tags: ['creatine', 'black line', 'amix'], goals: ['strength', 'muscle-gain'], weightGrams: 350 }),
];

for (const pr of products) {
  const price = PRICES[pr.sku];
  if (price) { pr.mrp = Math.max(price[0], price[1]); pr.price = price[1]; pr.isActive = true; } else pr.isActive = false;
}

const categories = [
  { name: 'Performance', subs: ['Creatine', 'Pre Workout', 'Amino Acids'] },
  { name: 'Health & Wellness', subs: ['Multivitamins', 'Omega', 'Minerals', 'Joint Support', 'Liver Support', 'Amino Acids'] },
  { name: 'Weight Management', subs: ['Fat Burners', 'Energy Support'] },
  { name: "Men's Health & Hormonal Support", subs: ['Testosterone Support', 'Adaptogens'], description: 'Support formulas for strength athletes and active men.' },
];
const brands = [
  { name: 'Olimp Sports', description: 'Polish sports nutrition brand known for mega caps and performance supplements.' },
  { name: 'Amix Nutrition', description: 'Spanish sports nutrition brand with the MuscleCore and Amixpro ranges.' },
];

module.exports = { products, categories, brands };
