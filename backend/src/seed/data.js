// Demo catalogue. Everything here is sample data: replace it from the admin panel or edit and re-run `npm run seed:fresh`.
const IMG = '/placeholders/product.svg';

const categories = [
  { name: 'Protein', description: 'Whey, isolate, casein and plant protein for daily targets and recovery.', isFeatured: true, subs: ['Whey Protein', 'Whey Isolate', 'Casein', 'Plant Protein'] },
  { name: 'Performance', description: 'Creatine, pre-workout and aminos for harder sessions.', isFeatured: true, subs: ['Creatine', 'Pre Workout', 'BCAA', 'EAA', 'Amino Acids'] },
  { name: 'Health & Wellness', description: 'Daily vitamins, omega-3, minerals and joint care.', isFeatured: true, subs: ['Multivitamins', 'Omega', 'Minerals', 'Joint Support', 'Digestive Support'] },
  { name: 'Weight Management', description: 'Support for cutting phases and steady energy.', isFeatured: true, subs: ['Fat Burners', 'L-Carnitine', 'Energy Support'] },
  { name: 'Accessories', description: 'Shakers and gym gear that survive daily use.', isFeatured: false, subs: ['Shakers', 'Gym Accessories'] },
];

const brands = [
  { name: 'Beyond Brawn', description: 'Our in-house range. Clear labels, tested batches.' },
  { name: 'BB Essentials', description: 'Everyday wellness basics from the Beyond Brawn team.' },
];

const attributes = [
  { name: 'Flavor', values: ['Double Chocolate', 'Vanilla Cream', 'Kesar Kulfi', 'Cafe Mocha', 'Fruit Punch', 'Blue Raspberry', 'Watermelon', 'Unflavoured'] },
  { name: 'Size', values: ['100 g', '250 g', '500 g', '1 kg', '2 kg', '60 Tablets', '90 Capsules', '450 ml'] },
];

const wheyNutrition = { servingSize: '1 scoop (33 g)', servingsPerContainer: 'About 30 per kg', rows: [
  { label: 'Energy', amount: '126 kcal' }, { label: 'Protein', amount: '24 g' }, { label: 'Carbohydrates', amount: '3.1 g' }, { label: 'Total sugars', amount: '1.4 g' }, { label: 'Added sugars', amount: '0 g' }, { label: 'Total fat', amount: '1.9 g' }, { label: 'BCAA', amount: '5.3 g' }, { label: 'Sodium', amount: '95 mg' },
] };
const standardWarning = 'Not for medicinal use. Not recommended for children, pregnant or lactating women. Do not exceed the recommended daily usage. Store in a cool, dry place away from sunlight.';

// v(flavor, size, sku, mrp, price, stock)
const fs = (flavor, size, sku, mrp, price, stock) => ({ options: { Flavor: flavor, Size: size }, sku, mrp, price, stock });
const sz = (size, sku, mrp, price, stock) => ({ options: { Size: size }, sku, mrp, price, stock });
const fl = (flavor, sku, mrp, price, stock) => ({ options: { Flavor: flavor }, sku, mrp, price, stock });

const products = [
  {
    name: 'Brawn Whey Protein', sku: 'BB-WHEY', cat: 'Protein', sub: 'Whey Protein', brand: 'Beyond Brawn', mrp: 2999, price: 2199, costPrice: 1450,
    shortDescription: '24 g protein per scoop from whey concentrate and isolate. Mixes clean, no added sugar.',
    description: '<p>Brawn Whey is our daily driver: a blend of whey concentrate and isolate that delivers 24 g of protein and 5.3 g of naturally occurring BCAAs in every scoop.</p><p>Each batch is tested for protein content and heavy metals before it ships, and the lab report number is printed on the tub.</p>',
    benefits: ['24 g protein per 33 g scoop', '5.3 g BCAAs to support muscle recovery', 'No added sugar, no amino spiking', 'Mixes in water or milk without clumps'],
    ingredients: 'Whey protein concentrate, whey protein isolate, cocoa powder (chocolate variants), natural and nature-identical flavours, digestive enzyme blend, sweetener (sucralose).',
    nutritionFacts: wheyNutrition, directions: 'Mix 1 scoop (33 g) in 200 ml of cold water or milk. Take 1 to 2 servings a day, ideally one within an hour of training.', warnings: standardWarning,
    specifications: [{ label: 'Form', value: 'Powder' }, { label: 'Protein source', value: 'Whey concentrate + isolate' }, { label: 'Shelf life', value: '18 months' }, { label: 'Country of origin', value: 'India' }],
    faqs: [{ question: 'Can beginners use this?', answer: 'Yes. Start with one scoop a day to cover the gap between your diet and your protein target.' }, { question: 'Is it vegetarian?', answer: 'Yes. Whey is a milk protein and this product carries the green dot.' }],
    tags: ['whey', 'protein', 'muscle', 'stack'], goals: ['muscle-gain', 'recovery'], productType: 'Powder', dietary: ['Vegetarian', 'No Added Sugar'], isFeatured: true, isBestSeller: true, lowStockThreshold: 15, soldCount: 412,
    variantOptions: [{ name: 'Flavor', values: ['Double Chocolate', 'Kesar Kulfi', 'Cafe Mocha'] }, { name: 'Size', values: ['1 kg', '2 kg'] }],
    variants: [fs('Double Chocolate', '1 kg', 'BB-WHEY-CHOC-1KG', 2999, 2199, 60), fs('Double Chocolate', '2 kg', 'BB-WHEY-CHOC-2KG', 5499, 3999, 35), fs('Kesar Kulfi', '1 kg', 'BB-WHEY-KESAR-1KG', 2999, 2199, 40), fs('Kesar Kulfi', '2 kg', 'BB-WHEY-KESAR-2KG', 5499, 3999, 12), fs('Cafe Mocha', '1 kg', 'BB-WHEY-MOCHA-1KG', 2999, 2249, 25), fs('Cafe Mocha', '2 kg', 'BB-WHEY-MOCHA-2KG', 5499, 4099, 0)],
  },
  {
    name: 'Brawn Isolate 90', sku: 'BB-ISO', cat: 'Protein', sub: 'Whey Isolate', brand: 'Beyond Brawn', mrp: 3999, price: 3149, costPrice: 2200,
    shortDescription: '27 g fast-absorbing whey isolate per scoop with under 1 g of carbs and fat.',
    description: '<p>Brawn Isolate 90 is micro-filtered whey isolate for lifters who track every gram. 27 g of protein, under 1 g of carbs and fat, and very low lactose.</p>',
    benefits: ['27 g protein per 30 g scoop', 'Under 1 g carbs and fat', 'Low lactose, easy on the stomach', 'Ideal for cutting phases'],
    ingredients: 'Whey protein isolate, natural and nature-identical flavours, sunflower lecithin, digestive enzymes, sweetener (sucralose).',
    nutritionFacts: { servingSize: '1 scoop (30 g)', servingsPerContainer: 'About 33 per kg', rows: [{ label: 'Energy', amount: '113 kcal' }, { label: 'Protein', amount: '27 g' }, { label: 'Carbohydrates', amount: '0.7 g' }, { label: 'Total fat', amount: '0.3 g' }, { label: 'BCAA', amount: '6.1 g' }] },
    directions: 'Mix 1 scoop (30 g) in 180 to 200 ml of cold water. Best right after training.', warnings: standardWarning,
    specifications: [{ label: 'Form', value: 'Powder' }, { label: 'Protein source', value: 'Whey isolate' }, { label: 'Shelf life', value: '18 months' }],
    tags: ['isolate', 'protein', 'lean'], goals: ['muscle-gain', 'recovery', 'weight-management'], productType: 'Powder', dietary: ['Vegetarian', 'No Added Sugar', 'Low Lactose'], isFeatured: true, isNewArrival: true, soldCount: 188,
    variantOptions: [{ name: 'Flavor', values: ['Double Chocolate', 'Vanilla Cream'] }, { name: 'Size', values: ['1 kg', '2 kg'] }],
    variants: [fs('Double Chocolate', '1 kg', 'BB-ISO-CHOC-1KG', 3999, 3149, 30), fs('Double Chocolate', '2 kg', 'BB-ISO-CHOC-2KG', 7499, 5899, 14), fs('Vanilla Cream', '1 kg', 'BB-ISO-VAN-1KG', 3999, 3149, 22), fs('Vanilla Cream', '2 kg', 'BB-ISO-VAN-2KG', 7499, 5899, 8)],
  },
  {
    name: 'Night Casein', sku: 'BB-CASEIN-1KG', cat: 'Protein', sub: 'Casein', brand: 'Beyond Brawn', mrp: 3499, price: 2799, costPrice: 1900, stock: 26,
    shortDescription: 'Slow-release micellar casein. 25 g protein to carry you through the night.',
    description: '<p>Micellar casein digests slowly, which makes it a good last meal of the day. Thick, pudding-like texture when mixed with less water.</p>',
    benefits: ['25 g slow-digesting protein', 'Keeps you fuller for longer', 'Thick, creamy texture'], ingredients: 'Micellar casein, cocoa powder, natural flavours, thickener (xanthan gum), sweetener (sucralose).',
    nutritionFacts: { servingSize: '1 scoop (34 g)', servingsPerContainer: '29', rows: [{ label: 'Energy', amount: '122 kcal' }, { label: 'Protein', amount: '25 g' }, { label: 'Carbohydrates', amount: '3 g' }, { label: 'Total fat', amount: '1 g' }, { label: 'Calcium', amount: '520 mg' }] },
    directions: 'Mix 1 scoop in 250 ml of water or milk 30 minutes before bed.', warnings: standardWarning, specifications: [{ label: 'Net quantity', value: '1 kg' }, { label: 'Flavour', value: 'Belgian Chocolate' }],
    tags: ['casein', 'protein', 'night'], goals: ['muscle-gain', 'recovery'], productType: 'Powder', dietary: ['Vegetarian'], soldCount: 64,
  },
  {
    name: 'Plant Protein Pea + Brown Rice', sku: 'BB-PLANT-1KG', cat: 'Protein', sub: 'Plant Protein', brand: 'Beyond Brawn', mrp: 2799, price: 2099, costPrice: 1350, stock: 34,
    shortDescription: 'Complete vegan protein. 22 g per scoop from pea and brown rice, no gritty aftertaste.',
    description: '<p>Pea and brown rice protein combined to give a complete amino acid profile. Dairy-free, soy-free and easy to digest.</p>',
    benefits: ['22 g plant protein per scoop', 'Complete amino acid profile', 'Dairy-free and soy-free'], ingredients: 'Pea protein isolate, brown rice protein, cocoa powder, natural flavours, digestive enzymes, stevia.',
    nutritionFacts: { servingSize: '1 scoop (32 g)', servingsPerContainer: '31', rows: [{ label: 'Energy', amount: '121 kcal' }, { label: 'Protein', amount: '22 g' }, { label: 'Carbohydrates', amount: '3.4 g' }, { label: 'Total fat', amount: '2.1 g' }, { label: 'Iron', amount: '5 mg' }] },
    directions: 'Mix 1 scoop in 250 ml of water or plant milk. Shake well.', warnings: standardWarning, specifications: [{ label: 'Net quantity', value: '1 kg' }, { label: 'Flavour', value: 'Chocolate Hazelnut' }],
    tags: ['vegan', 'plant', 'protein'], goals: ['muscle-gain', 'general-wellness'], productType: 'Powder', dietary: ['Vegan', 'Vegetarian', 'Gluten Free', 'No Added Sugar'], isNewArrival: true, soldCount: 71,
  },
  {
    name: 'Creatine Monohydrate', sku: 'BB-CREA', cat: 'Performance', sub: 'Creatine', brand: 'Beyond Brawn', mrp: 999, price: 699, costPrice: 380,
    shortDescription: 'Pure micronised creatine monohydrate. 3 g a day, nothing else added.',
    description: '<p>Creatine monohydrate is the most researched sports supplement there is. Ours is micronised (200 mesh) so it dissolves without the sandy texture, and it is unflavoured so it goes into anything.</p>',
    benefits: ['3 g pure creatine monohydrate per serving', 'Supports strength and power output', 'Micronised for easy mixing', 'No loading phase needed'],
    ingredients: 'Micronised creatine monohydrate (100%).', nutritionFacts: { servingSize: '1 scoop (3 g)', servingsPerContainer: '83 per 250 g', rows: [{ label: 'Creatine monohydrate', amount: '3 g' }] },
    directions: 'Mix 1 scoop (3 g) in water, juice or your shake once a day. Take it daily, including rest days, and drink plenty of water.', warnings: standardWarning,
    specifications: [{ label: 'Form', value: 'Powder' }, { label: 'Mesh size', value: '200' }, { label: 'Flavour', value: 'Unflavoured' }],
    faqs: [{ question: 'When should I take creatine?', answer: 'Any time of day works. Consistency matters more than timing.' }],
    tags: ['creatine', 'strength', 'stack'], goals: ['strength', 'muscle-gain'], productType: 'Powder', dietary: ['Vegan', 'Vegetarian', 'Gluten Free'], isFeatured: true, isBestSeller: true, lowStockThreshold: 20, soldCount: 655,
    variantOptions: [{ name: 'Size', values: ['100 g', '250 g'] }], variants: [sz('100 g', 'BB-CREA-100G', 499, 349, 120), sz('250 g', 'BB-CREA-250G', 999, 699, 90)],
  },
  {
    name: 'Ignite Pre Workout', sku: 'BB-IGNITE', cat: 'Performance', sub: 'Pre Workout', brand: 'Beyond Brawn', mrp: 1999, price: 1499, costPrice: 820,
    shortDescription: '200 mg caffeine, citrulline and beta-alanine for focus and pump. 30 servings.',
    description: '<p>Ignite is a fully disclosed pre-workout. Every ingredient and its dose is on the label, so you know exactly what you are taking before a heavy session.</p>',
    benefits: ['6 g L-citrulline for pump', '3.2 g beta-alanine for endurance', '200 mg caffeine for focus', 'No proprietary blends'],
    ingredients: 'L-citrulline, beta-alanine, taurine, caffeine anhydrous, L-tyrosine, black pepper extract, acidity regulator, natural flavours, sucralose.',
    nutritionFacts: { servingSize: '1 scoop (12 g)', servingsPerContainer: '30', rows: [{ label: 'L-Citrulline', amount: '6 g' }, { label: 'Beta-Alanine', amount: '3.2 g' }, { label: 'Taurine', amount: '1 g' }, { label: 'L-Tyrosine', amount: '500 mg' }, { label: 'Caffeine', amount: '200 mg' }] },
    directions: 'Mix 1 scoop in 250 ml of water 20 to 30 minutes before training. New to pre-workout? Start with half a scoop.',
    warnings: `Contains 200 mg caffeine per serving. Do not take within 6 hours of sleep or with other caffeinated products. ${standardWarning}`,
    specifications: [{ label: 'Net quantity', value: '360 g' }, { label: 'Servings', value: '30' }],
    tags: ['pre workout', 'energy', 'pump'], goals: ['energy', 'strength'], productType: 'Powder', dietary: ['Vegetarian', 'Vegan'], isBestSeller: true, isNewArrival: true, soldCount: 233,
    variantOptions: [{ name: 'Flavor', values: ['Fruit Punch', 'Blue Raspberry', 'Watermelon'] }], variants: [fl('Fruit Punch', 'BB-IGNITE-FP', 1999, 1499, 44), fl('Blue Raspberry', 'BB-IGNITE-BR', 1999, 1499, 31), fl('Watermelon', 'BB-IGNITE-WM', 1999, 1499, 6)],
  },
  {
    name: 'BCAA 2:1:1', sku: 'BB-BCAA-250G', cat: 'Performance', sub: 'BCAA', brand: 'Beyond Brawn', mrp: 1499, price: 1099, costPrice: 610, stock: 48,
    shortDescription: '7 g BCAAs with electrolytes for long sessions. Watermelon flavour.',
    description: '<p>Leucine, isoleucine and valine in the classic 2:1:1 ratio with added electrolytes for training in the heat.</p>',
    benefits: ['7 g BCAAs per serving', 'Added electrolytes for hydration', 'Zero sugar'], ingredients: 'L-leucine, L-isoleucine, L-valine, electrolyte blend (sodium, potassium, magnesium), natural flavours, sucralose.',
    nutritionFacts: { servingSize: '1 scoop (10 g)', servingsPerContainer: '25', rows: [{ label: 'L-Leucine', amount: '3.5 g' }, { label: 'L-Isoleucine', amount: '1.75 g' }, { label: 'L-Valine', amount: '1.75 g' }, { label: 'Electrolytes', amount: '600 mg' }] },
    directions: 'Mix 1 scoop in 400 ml of water and sip during training.', warnings: standardWarning, specifications: [{ label: 'Net quantity', value: '250 g' }],
    tags: ['bcaa', 'recovery', 'intra workout'], goals: ['recovery', 'energy'], productType: 'Powder', dietary: ['Vegan', 'Vegetarian', 'No Added Sugar'], soldCount: 97,
  },
  {
    name: 'EAA Hydrate', sku: 'BB-EAA-300G', cat: 'Performance', sub: 'EAA', brand: 'Beyond Brawn', mrp: 1799, price: 1349, costPrice: 760, stock: 9,
    shortDescription: 'All 9 essential amino acids plus coconut water powder. Blue raspberry.',
    description: '<p>A full-spectrum EAA formula for fasted training or long sessions, with coconut water powder for natural electrolytes.</p>',
    benefits: ['9 g essential amino acids', 'All 9 EAAs including 4 g BCAAs', 'Coconut water electrolytes'], ingredients: 'EAA blend, coconut water powder, citric acid, natural flavours, sucralose.',
    nutritionFacts: { servingSize: '1 scoop (12 g)', servingsPerContainer: '25', rows: [{ label: 'Total EAAs', amount: '9 g' }, { label: 'of which BCAAs', amount: '4 g' }, { label: 'Coconut water powder', amount: '500 mg' }] },
    directions: 'Mix 1 scoop in 400 to 500 ml of water. Sip before or during training.', warnings: standardWarning, specifications: [{ label: 'Net quantity', value: '300 g' }],
    tags: ['eaa', 'amino', 'hydration'], goals: ['recovery', 'energy'], productType: 'Powder', dietary: ['Vegan', 'Vegetarian'], isNewArrival: true, soldCount: 41,
  },
  {
    name: 'Daily Multivitamin', sku: 'BBE-MULTI-60', cat: 'Health & Wellness', sub: 'Multivitamins', brand: 'BB Essentials', mrp: 699, price: 499, costPrice: 210, stock: 150,
    shortDescription: '24 vitamins and minerals in one tablet a day. 60 tablets.',
    description: '<p>A straightforward daily multivitamin covering common gaps in Indian diets, including vitamin D3, B12, zinc and iron.</p>',
    benefits: ['24 vitamins and minerals', 'Vitamin D3 and B12 at meaningful doses', 'One tablet a day, 2-month supply'], ingredients: 'Vitamin and mineral premix, microcrystalline cellulose, coating agents.',
    nutritionFacts: { servingSize: '1 tablet', servingsPerContainer: '60', rows: [{ label: 'Vitamin D3', amount: '600 IU', dailyValue: '100%' }, { label: 'Vitamin B12', amount: '2.2 mcg', dailyValue: '100%' }, { label: 'Vitamin C', amount: '80 mg', dailyValue: '100%' }, { label: 'Zinc', amount: '12 mg', dailyValue: '71%' }, { label: 'Iron', amount: '10 mg', dailyValue: '53%' }] },
    directions: 'Take 1 tablet daily after a meal.', warnings: standardWarning, specifications: [{ label: 'Form', value: 'Tablet' }, { label: 'Count', value: '60' }],
    tags: ['multivitamin', 'daily', 'immunity'], goals: ['general-wellness'], productType: 'Tablet', dietary: ['Vegetarian'], isBestSeller: true, lowStockThreshold: 25, soldCount: 320,
  },
  {
    name: 'Omega-3 Fish Oil', sku: 'BBE-OMEGA-90', cat: 'Health & Wellness', sub: 'Omega', brand: 'BB Essentials', mrp: 1099, price: 799, costPrice: 400, stock: 85,
    shortDescription: '1000 mg fish oil with 550 mg EPA + 350 mg DHA. Burp-free softgels.',
    description: '<p>Triple-strength omega-3 from deep-sea fish oil, molecularly distilled and enteric coated to avoid the fishy aftertaste.</p>',
    benefits: ['550 mg EPA and 350 mg DHA per softgel', 'Enteric coated, no fishy burps', 'Tested for heavy metals'], ingredients: 'Fish oil concentrate, gelatin, glycerin, enteric coating, vitamin E.',
    nutritionFacts: { servingSize: '1 softgel', servingsPerContainer: '90', rows: [{ label: 'Fish oil', amount: '1000 mg' }, { label: 'EPA', amount: '550 mg' }, { label: 'DHA', amount: '350 mg' }] },
    directions: 'Take 1 softgel daily with a meal.', warnings: standardWarning, specifications: [{ label: 'Form', value: 'Softgel' }, { label: 'Count', value: '90' }],
    tags: ['omega 3', 'fish oil', 'heart'], goals: ['general-wellness', 'recovery'], productType: 'Capsule', dietary: ['Non-Vegetarian'], isFeatured: true, soldCount: 205,
  },
  {
    name: 'Magnesium Glycinate', sku: 'BBE-MAG-90', cat: 'Health & Wellness', sub: 'Minerals', brand: 'BB Essentials', mrp: 899, price: 649, costPrice: 300, stock: 60,
    shortDescription: 'Highly absorbable magnesium for muscle relaxation and sleep. 90 capsules.',
    description: '<p>Magnesium bisglycinate is gentle on the stomach and well absorbed. A common pick for lifters who cramp or sleep poorly after late sessions.</p>',
    benefits: ['200 mg elemental magnesium per serving', 'Gentle chelated form', 'Supports muscle relaxation and sleep'], ingredients: 'Magnesium bisglycinate, vegetarian capsule shell.',
    nutritionFacts: { servingSize: '2 capsules', servingsPerContainer: '45', rows: [{ label: 'Magnesium (elemental)', amount: '200 mg', dailyValue: '52%' }] },
    directions: 'Take 2 capsules in the evening with water.', warnings: standardWarning, specifications: [{ label: 'Form', value: 'Capsule' }, { label: 'Count', value: '90' }],
    tags: ['magnesium', 'sleep', 'minerals'], goals: ['recovery', 'general-wellness'], productType: 'Capsule', dietary: ['Vegan', 'Vegetarian'], soldCount: 88,
  },
  {
    name: 'Joint Support Complex', sku: 'BBE-JOINT-60', cat: 'Health & Wellness', sub: 'Joint Support', brand: 'BB Essentials', mrp: 1299, price: 949, costPrice: 480, stock: 40,
    shortDescription: 'Glucosamine, MSM and curcumin for joints that take a heavy load. 60 tablets.',
    description: '<p>Built for lifters and runners: glucosamine and MSM with curcumin and boswellia extract.</p>',
    benefits: ['1500 mg glucosamine per day', 'With MSM, curcumin and boswellia', 'Made for high training volume'], ingredients: 'Glucosamine sulphate, MSM, curcumin extract, boswellia serrata extract, excipients.',
    nutritionFacts: { servingSize: '2 tablets', servingsPerContainer: '30', rows: [{ label: 'Glucosamine sulphate', amount: '1500 mg' }, { label: 'MSM', amount: '500 mg' }, { label: 'Curcumin extract', amount: '200 mg' }, { label: 'Boswellia extract', amount: '100 mg' }] },
    directions: 'Take 2 tablets daily after a meal.', warnings: `Contains shellfish-derived glucosamine. ${standardWarning}`, specifications: [{ label: 'Form', value: 'Tablet' }, { label: 'Count', value: '60' }],
    tags: ['joint', 'glucosamine', 'recovery'], goals: ['recovery', 'general-wellness'], productType: 'Tablet', dietary: ['Non-Vegetarian'], soldCount: 52,
  },
  {
    name: 'L-Carnitine Liquid 3000', sku: 'BB-CARN-450ML', cat: 'Weight Management', sub: 'L-Carnitine', brand: 'Beyond Brawn', mrp: 1299, price: 949, costPrice: 520, stock: 55,
    shortDescription: '3000 mg L-carnitine per serving in a ready-to-drink liquid. Lemon lime.',
    description: '<p>Stimulant-free liquid L-carnitine to pair with cardio and a calorie deficit.</p>',
    benefits: ['3000 mg L-carnitine per 15 ml', 'Stimulant-free', 'Zero sugar'], ingredients: 'Purified water, L-carnitine base, acidity regulator, natural flavour, preservative, sucralose.',
    nutritionFacts: { servingSize: '15 ml', servingsPerContainer: '30', rows: [{ label: 'L-Carnitine', amount: '3000 mg' }, { label: 'Energy', amount: '2 kcal' }] },
    directions: 'Take 15 ml 30 minutes before cardio or training.', warnings: standardWarning, specifications: [{ label: 'Net quantity', value: '450 ml' }],
    tags: ['carnitine', 'fat loss', 'cardio'], goals: ['weight-management', 'energy'], productType: 'Liquid', dietary: ['Vegan', 'Vegetarian', 'No Added Sugar'], isFeatured: true, soldCount: 119,
  },
  {
    name: 'Lean Burn Thermo', sku: 'BB-LEAN-60', cat: 'Weight Management', sub: 'Fat Burners', brand: 'Beyond Brawn', mrp: 1599, price: 1199, costPrice: 640, stock: 0,
    shortDescription: 'Green tea extract, caffeine and capsicum for cutting phases. 60 capsules.',
    description: '<p>A thermogenic formula to support energy and appetite control while you are in a calorie deficit. It works with your diet, not instead of it.</p>',
    benefits: ['Green tea extract (50% EGCG)', '150 mg caffeine for energy', 'Black pepper extract for absorption'], ingredients: 'Green tea extract, caffeine anhydrous, L-carnitine tartrate, capsicum extract, black pepper extract, capsule shell.',
    nutritionFacts: { servingSize: '1 capsule', servingsPerContainer: '60', rows: [{ label: 'Green tea extract', amount: '400 mg' }, { label: 'Caffeine', amount: '150 mg' }, { label: 'L-Carnitine tartrate', amount: '250 mg' }, { label: 'Capsicum extract', amount: '50 mg' }] },
    directions: 'Take 1 capsule in the morning with breakfast. Do not take more than 2 capsules a day.', warnings: `Contains caffeine. ${standardWarning}`, specifications: [{ label: 'Form', value: 'Capsule' }, { label: 'Count', value: '60' }],
    tags: ['fat burner', 'cutting', 'thermo'], goals: ['weight-management', 'energy'], productType: 'Capsule', dietary: ['Vegetarian'], soldCount: 76,
  },
  {
    name: 'Brawn Steel Shaker 700 ml', sku: 'BB-SHAKER-700', cat: 'Accessories', sub: 'Shakers', brand: 'Beyond Brawn', mrp: 699, price: 499, costPrice: 220, stock: 110, gstRate: 18,
    shortDescription: 'Leak-proof stainless steel shaker with a mixing ball. Matte black with lime logo.',
    description: '<p>Double-wall stainless steel keeps your shake cold and does not hold smells the way plastic does.</p>',
    benefits: ['700 ml capacity', 'Leak-proof screw lid', 'Odour-free stainless steel'], specifications: [{ label: 'Material', value: '304 stainless steel' }, { label: 'Capacity', value: '700 ml' }, { label: 'Dishwasher safe', value: 'Yes' }],
    tags: ['shaker', 'bottle', 'accessories'], goals: [], productType: 'Accessory', dietary: [], isNewArrival: true, soldCount: 143,
  },
  {
    name: 'Padded Lifting Straps', sku: 'BB-STRAPS', cat: 'Accessories', sub: 'Gym Accessories', brand: 'Beyond Brawn', mrp: 499, price: 349, costPrice: 120, stock: 75, gstRate: 12,
    shortDescription: 'Heavy cotton straps with neoprene wrist padding. Sold as a pair.',
    description: '<p>For the days your grip gives out before your back does. 60 cm of heavy-duty cotton with padded wrists.</p>',
    benefits: ['Neoprene padding protects wrists', '60 cm length for a secure wrap', 'Reinforced stitching'], specifications: [{ label: 'Material', value: 'Cotton + neoprene' }, { label: 'Length', value: '60 cm' }, { label: 'Pack', value: '1 pair' }],
    tags: ['straps', 'lifting', 'accessories'], goals: ['strength'], productType: 'Accessory', dietary: [], soldCount: 58,
  },
].map((p) => ({ ...p, images: [{ url: IMG, alt: p.name }], thumbnail: IMG }));

const coupons = [
  { code: 'WELCOME10', description: '10% off your first order, up to ₹300', discountType: 'percentage', value: 10, minOrderAmount: 999, maxDiscount: 300, perUserLimit: 1 },
  { code: 'BRAWN200', description: '₹200 off orders above ₹2,499', discountType: 'fixed', value: 200, minOrderAmount: 2499, perUserLimit: 3 },
  { code: 'PROTEIN15', description: '15% off protein, up to ₹600', discountType: 'percentage', value: 15, minOrderAmount: 1999, maxDiscount: 600, perUserLimit: 2, categories: ['Protein'] },
];

const faqs = [
  ['Orders & Shipping', 'How long does delivery take?', 'Standard delivery takes 3 to 6 working days. Express delivery takes 1 to 3 working days in metro cities.'],
  ['Orders & Shipping', 'Is shipping free?', 'Standard shipping is free on orders above ₹999. Below that, a flat fee is shown at checkout.'],
  ['Orders & Shipping', 'How do I track my order?', 'You get an email with the courier name and tracking number when your order ships. You can also track it from My Orders.'],
  ['Orders & Shipping', 'Can I cancel my order?', 'Yes, from My Orders, any time before it is packed. Your refund is sent to the original payment method.'],
  ['Payments', 'Which payment methods do you accept?', 'UPI, credit and debit cards, net banking and wallets, all processed securely by Razorpay.'],
  ['Payments', 'Money was deducted but my order failed. What now?', 'The amount is reversed automatically by your bank, usually within 5 to 7 working days. Write to us with the order number if it takes longer.'],
  ['Products', 'Are your products authentic?', 'Every product is sold directly by Beyond Brawn. Each tub carries a batch number and a lab report reference.'],
  ['Products', 'Are your supplements vegetarian?', 'Most are. Each product page shows whether it is vegetarian, vegan or non-vegetarian.'],
  ['Returns & Refunds', 'What is your return policy?', 'Unopened products can be returned within 7 days of delivery. Damaged or wrong items are replaced free of charge.'],
  ['Returns & Refunds', 'When will I get my refund?', 'Refunds are initiated within 2 working days of approval and reach your account in 5 to 7 working days.'],
].map(([category, question, answer], i) => ({ category, question, answer, sortOrder: i }));

const blogCategories = ['Nutrition', 'Training', 'Supplements 101'];
const blogs = [
  {
    title: 'How much protein do you actually need to build muscle?', category: 'Nutrition', tags: ['protein', 'muscle gain'],
    excerpt: 'The research lands on a clear range. Here is how to work out your number and hit it with normal Indian meals.',
    content: '<p>Most lifters either undereat protein or obsess over it. The evidence points to a simple range: <strong>1.6 to 2.2 g of protein per kg of bodyweight per day</strong> for people training to build muscle.</p><h2>Work out your number</h2><p>If you weigh 70 kg, that is 112 to 154 g a day. Start at the lower end and move up if you are in a calorie deficit.</p><h2>Getting there with food</h2><ul><li>Paneer, 100 g: about 18 g</li><li>Dal, 1 cooked cup: about 12 g</li><li>Eggs, 3 whole: about 18 g</li><li>Chicken breast, 100 g: about 30 g</li><li>Curd, 200 g: about 8 g</li></ul><p>A scoop of whey adds 24 g and is useful when meals fall short, not as a replacement for them.</p><h2>Does timing matter?</h2><p>Total daily intake matters most. Spreading it over three or four meals of 25 to 40 g is a sensible default.</p>',
  },
  {
    title: 'Creatine: what it does, how to take it and what to ignore', category: 'Supplements 101', tags: ['creatine', 'strength'],
    excerpt: 'Three grams a day, every day. The rest is mostly noise. A short guide to the most studied supplement in sport.',
    content: '<p>Creatine monohydrate has been studied for over thirty years. It helps your muscles regenerate ATP, the fuel for short, intense efforts like heavy sets and sprints.</p><h2>How to take it</h2><p>Take <strong>3 to 5 g a day</strong>, at any time, with any drink. You do not need a loading phase. Stores are saturated after three to four weeks either way.</p><h2>Common questions</h2><ul><li><strong>Will I gain weight?</strong> Expect 1 to 2 kg of water held inside muscle in the first month.</li><li><strong>Do I need to cycle it?</strong> No.</li><li><strong>Is it safe?</strong> For healthy adults, the research is consistently reassuring. Speak to your doctor if you have a kidney condition.</li></ul>',
  },
  {
    title: 'A simple 4-day split for busy lifters', category: 'Training', tags: ['training', 'programme'],
    excerpt: 'Upper, lower, rest, upper, lower. A programme you can run for a year and still progress on.',
    content: '<p>You do not need six days in the gym. Four focused sessions cover every muscle group twice a week, which is where most of the growth benefit sits.</p><h2>The week</h2><ol><li><strong>Monday, upper:</strong> bench press, barbell row, overhead press, pull-ups, curls</li><li><strong>Tuesday, lower:</strong> squat, Romanian deadlift, leg press, calf raises</li><li><strong>Thursday, upper:</strong> incline dumbbell press, lat pulldown, lateral raises, triceps</li><li><strong>Friday, lower:</strong> deadlift, split squats, leg curls, core</li></ol><h2>How to progress</h2><p>Add a rep each week until you reach the top of the range, then add weight and start again. Log every session.</p>',
  },
];

const page = (title, body) => `<h2>${title}</h2>${body}`;
const pages = [
  { slug: 'about', title: 'About Beyond Brawn', content: '<p>Beyond Brawn started with a simple frustration: supplement labels that hide more than they show. We make sports nutrition with fully disclosed formulas, doses that match the research and batch testing you can look up.</p><h2>What we stand for</h2><ul><li><strong>Clear labels.</strong> No proprietary blends. Every ingredient and dose is printed on the tub.</li><li><strong>Tested batches.</strong> Each batch is tested for protein content and contaminants before it ships.</li><li><strong>Fair pricing.</strong> We sell direct, so you pay for what is in the tub, not for middlemen.</li></ul><h2>Results that speak through</h2><p>We would rather you judge us by your training log than by our advertising.</p>' },
  { slug: 'privacy-policy', title: 'Privacy Policy', content: page('What we collect', '<p>We collect the details you give us when you create an account or place an order: name, email, phone number and delivery address. Payments are processed by Razorpay. We never see or store your card or UPI details.</p>') + page('How we use it', '<p>To process and deliver orders, send order updates, respond to support requests and, if you opt in, send offers. We do not sell your data.</p>') + page('Your choices', '<p>You can update your details from My Account, unsubscribe from marketing emails at any time and ask us to delete your account by writing to support.</p>') },
  { slug: 'terms-and-conditions', title: 'Terms & Conditions', content: page('Using this website', '<p>By placing an order you confirm that you are at least 18 years old and that the details you provide are accurate.</p>') + page('Products', '<p>Our products are food supplements. They are not intended to diagnose, treat, cure or prevent any disease. Read the label and consult a healthcare professional if you have a medical condition.</p>') + page('Pricing', '<p>All prices are in Indian Rupees and include GST unless stated otherwise. We may change prices and offers without notice; the price at the time of your order applies.</p>') },
  { slug: 'refund-policy', title: 'Refund Policy', content: page('When refunds apply', '<p>You receive a full refund for orders cancelled before dispatch, items that arrive damaged or incorrect, and unopened products returned within 7 days of delivery.</p>') + page('Timelines', '<p>Refunds are initiated within 2 working days of approval and credited to your original payment method in 5 to 7 working days.</p>') },
  { slug: 'shipping-policy', title: 'Shipping Policy', content: page('Delivery times', '<p>Orders are dispatched within 24 to 48 hours. Standard delivery takes 3 to 6 working days; express delivery takes 1 to 3 working days in metro cities.</p>') + page('Charges', '<p>Standard shipping is free above the threshold shown at checkout. Express delivery is charged separately.</p>') + page('Tracking', '<p>You receive the courier name and tracking number by email as soon as your order ships.</p>') },
  { slug: 'return-policy', title: 'Return Policy', content: page('What can be returned', '<p>Unopened, sealed products in original packaging can be returned within 7 days of delivery. For hygiene and safety reasons, opened supplements cannot be returned.</p>') + page('Damaged or wrong items', '<p>Send us a photo within 48 hours of delivery and we will replace the item or refund you in full.</p>') + page('How to start a return', '<p>Write to support with your order number. We arrange the pickup.</p>') },
];

const banners = [
  { title: 'Build beyond limits', subtitle: 'Premium sports nutrition built for strength, performance and results.', link: '/shop', buttonText: 'Shop now', placement: 'hero', sortOrder: 0 },
  { title: 'Fuel your performance', subtitle: 'Stack creatine with whey and save more on every order.', link: '/shop?tag=stack', buttonText: 'Shop the stack', placement: 'promo', sortOrder: 0 },
];

module.exports = { categories, brands, attributes, products, coupons, faqs, blogCategories, blogs, pages, banners };
