import { WebMCPTool } from '../types';

export const APPAREL_SIZE_GUIDE = {
  WomensTops: {
    category: "Women's Tops & Blouses",
    description: 'Standard US sizing tailored for tops, blouses, and knitwear.',
    sizes: [
      { size: 'XS', bust: '32-33 in (81-84 cm)', waist: '24-25 in (61-64 cm)', hips: '34-35 in (86-89 cm)' },
      { size: 'S', bust: '34-35 in (86-89 cm)', waist: '26-27 in (66-69 cm)', hips: '36-37 in (91-94 cm)' },
      { size: 'M', bust: '36-37 in (91-94 cm)', waist: '28-29 in (71-74 cm)', hips: '38-39 in (96-99 cm)' },
      { size: 'L', bust: '38-40 in (97-102 cm)', waist: '30-32 in (76-81 cm)', hips: '40-42 in (102-107 cm)' },
      { size: 'XL', bust: '41-43 in (104-109 cm)', waist: '33-35 in (84-89 cm)', hips: '43-45 in (109-114 cm)' },
    ],
    fitAdvice: 'For relaxed silk and linen styles, select your true size. For tailored peplum or bodycon rib tops, consider sizing up if between sizes.',
  },
  MensTshirts: {
    category: "Men's Luxury T-Shirts",
    description: 'Tailored and relaxed sizing for crewneck and v-neck t-shirts.',
    sizes: [
      { size: 'S', chest: '36-38 in (91-97 cm)', neck: '14-14.5 in (36-37 cm)', length: '27.5 in (70 cm)' },
      { size: 'M', chest: '39-41 in (99-104 cm)', neck: '15-15.5 in (38-39 cm)', length: '28.5 in (72 cm)' },
      { size: 'L', chest: '42-44 in (107-112 cm)', neck: '16-16.5 in (41-42 cm)', length: '29.5 in (75 cm)' },
      { size: 'XL', chest: '45-47 in (114-119 cm)', neck: '17-17.5 in (43-44 cm)', length: '30.5 in (77 cm)' },
      { size: 'XXL', chest: '48-50 in (122-127 cm)', neck: '18-18.5 in (46-47 cm)', length: '31.5 in (80 cm)' },
    ],
    fitAdvice: 'Supima and mercerized cotton styles feature a modern tailored fit through the chest and arms. For oversized boxy tees, order your standard size.',
  },
  WomensJeans: {
    category: "Women's Premium Denim",
    description: 'Waist-based sizing for high-rise straight, slim crop, and wide-leg denim.',
    sizes: [
      { size: '25', waist: '25 in (63.5 cm)', hips: '35 in (89 cm)', standardUS: '0' },
      { size: '26', waist: '26 in (66 cm)', hips: '36 in (91.5 cm)', standardUS: '2' },
      { size: '27', waist: '27 in (68.5 cm)', hips: '37 in (94 cm)', standardUS: '4' },
      { size: '28', waist: '28 in (71 cm)', hips: '38 in (96.5 cm)', standardUS: '6' },
      { size: '29', waist: '29 in (73.5 cm)', hips: '39 in (99 cm)', standardUS: '8' },
      { size: '30', waist: '30 in (76 cm)', hips: '40 in (101.5 cm)', standardUS: '10' },
      { size: '31', waist: '31 in (78.5 cm)', hips: '41 in (104 cm)', standardUS: '12' },
      { size: '32', waist: '32 in (81 cm)', hips: '42 in (106.5 cm)', standardUS: '14' },
    ],
    fitAdvice: 'Our denim incorporates 1-2% comfort stretch. Raw noir denim will mold to your body over the first few wears.',
  },
  MensJeans: {
    category: "Men's Tailored Denim",
    description: 'Waist and inseam sizing for raw selvedge, regular fit, and slim tapered denim.',
    sizes: [
      { size: '29', waist: '29 in (73.5 cm)', thigh: '21.5 in (55 cm)', standardInseam: '32 in (81 cm)' },
      { size: '30', waist: '30 in (76 cm)', thigh: '22 in (56 cm)', standardInseam: '32 in (81 cm)' },
      { size: '31', waist: '31 in (78.5 cm)', thigh: '22.5 in (57 cm)', standardInseam: '32 in (81 cm)' },
      { size: '32', waist: '32 in (81 cm)', thigh: '23 in (58.5 cm)', standardInseam: '32 in (81 cm)' },
      { size: '33', waist: '33 in (84 cm)', thigh: '23.5 in (60 cm)', standardInseam: '32 in (81 cm)' },
      { size: '34', waist: '34 in (86.5 cm)', thigh: '24 in (61 cm)', standardInseam: '32 in (81 cm)' },
      { size: '36', waist: '36 in (91.5 cm)', thigh: '25 in (63.5 cm)', standardInseam: '32 in (81 cm)' },
    ],
    fitAdvice: 'Raw selvedge is unwashed and will settle approximately 0.5 inches in length after cold soaking. Athletic fit styles offer extra thigh allowance.',
  },
};

export const filterApparelTool: WebMCPTool = {
  name: 'filter_apparel',
  description:
    'Filter the fashion and apparel catalog by specific clothing attributes: gender (Women, Men), category (Tops, T-Shirts, Jeans), color (Red, Blue, Green, Black, White, Indigo), size (XS, S, M, L, XL, 26-36), and price range. ' +
    'Returns matching apparel items with colors, available sizes, fabric specifications, prices, and stock status. ' +
    'Prevents failure modes by validating available color-department combinations: ' +
    'Women Tops are available in Red, Blue, Green; Men T-Shirts are available in Black, White, Blue; Jeans are in Indigo, Blue, Black.',
  category: 'Apparel',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      gender: {
        type: 'string',
        enum: ['Women', 'Men', 'All'],
        description: 'Target gender department: "Women" or "Men".',
      },
      category: {
        type: 'string',
        enum: ['Tops', 'T-Shirts', 'Jeans', 'All'],
        description: 'Apparel category: "Tops" (women), "T-Shirts" (men), or "Jeans" (both).',
      },
      color: {
        type: 'string',
        enum: ['Red', 'Blue', 'Green', 'Black', 'White', 'Indigo', 'All'],
        description: 'Color filter: Red, Blue, Green (women tops); Black, White, Blue (men tees); Indigo, Blue, Black (jeans).',
      },
      size: {
        type: 'string',
        description: 'Size filter: e.g. "XS", "S", "M", "L", "XL" or waist sizes "26", "28", "30", "32", "34".',
      },
      minPrice: {
        type: 'number',
        minimum: 0,
        description: 'Minimum price threshold.',
      },
      maxPrice: {
        type: 'number',
        minimum: 0,
        description: 'Maximum price threshold.',
      },
      inStockOnly: {
        type: 'boolean',
        description: 'If true, returns only items currently in stock.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        description: 'Maximum number of items to return (default: 15).',
      },
    },
  },
  execute: async ({ gender = 'All', category = 'All', color = 'All', size, minPrice, maxPrice, inStockOnly = false, limit = 15 }) => {
    // Failure mode guard: Validate known inventory color/gender constraints to guide the agent
    if (gender === 'Men' && color === 'Red') {
      return {
        success: false,
        error: 'COLOR_NOT_AVAILABLE_FOR_DEPARTMENT',
        message: 'Red is exclusive to Women\'s Tops in our collection. Available colors for Men\'s T-Shirts are Black, White, and Blue.',
        suggestions: {
          availableColorsForMen: ['Black', 'White', 'Blue'],
          availableColorsForWomen: ['Red', 'Blue', 'Green'],
        },
      };
    }

    if (gender === 'Men' && color === 'Green') {
      return {
        success: false,
        error: 'COLOR_NOT_AVAILABLE_FOR_DEPARTMENT',
        message: 'Green is exclusive to Women\'s Tops in our collection. Available colors for Men\'s T-Shirts are Black, White, and Blue.',
        suggestions: {
          availableColorsForMen: ['Black', 'White', 'Blue'],
          availableColorsForWomen: ['Red', 'Blue', 'Green'],
        },
      };
    }

    // Build API query
    const params = new URLSearchParams({ limit: String(limit) });
    if (gender !== 'All') params.set('gender', gender);
    if (category !== 'All') params.set('apparelCategory', category);
    if (color !== 'All') params.set('color', color);
    if (size) params.set('size', size);
    if (minPrice !== undefined) params.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) params.set('maxPrice', String(maxPrice));
    if (inStockOnly) params.set('inStockOnly', 'true');

    const res = await fetch(`/api/products?${params.toString()}`);
    const data = await res.json();
    return data;
  },
};

export const getApparelSizeGuideTool: WebMCPTool = {
  name: 'get_apparel_size_guide',
  description:
    'Retrieve verified size charts, fit recommendations, and body measurements (bust, chest, waist, hips, inseam) for Women\'s Tops, Men\'s T-Shirts, Women\'s Jeans, and Men\'s Jeans. ' +
    'Use this tool whenever users ask about sizing, fit advice, or body measurements to prevent wrong-size ordering and return failures.',
  category: 'Apparel',
  permission: 'PUBLIC',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['WomensTops', 'MensTshirts', 'WomensJeans', 'MensJeans', 'All'],
        description: 'Apparel category to retrieve sizing for: "WomensTops", "MensTshirts", "WomensJeans", "MensJeans", or "All".',
      },
    },
  },
  execute: async ({ category = 'All' } = {}) => {
    if (category !== 'All' && APPAREL_SIZE_GUIDE[category as keyof typeof APPAREL_SIZE_GUIDE]) {
      return {
        success: true,
        category,
        guide: APPAREL_SIZE_GUIDE[category as keyof typeof APPAREL_SIZE_GUIDE],
      };
    }

    return {
      success: true,
      category: 'All',
      guides: APPAREL_SIZE_GUIDE,
    };
  },
};
