import { prisma } from '../db';

export interface ProductFilterOptions {
  query?: string;
  category?: string;
  brand?: string;
  color?: string;
  gender?: string;
  size?: string;
  apparelCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  isFeatured?: boolean;
  isPromoted?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}

export function safeParseJson<T>(value: any, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    // If fallback is an array (like images or tags) and value is a non-empty string, wrap it
    if (Array.isArray(fallback) && typeof value === 'string' && value.trim()) {
      return [value] as unknown as T;
    }
    return fallback;
  }
}

export const DEFAULT_CATEGORIES = [
  {
    id: 'cat-womens-tops',
    name: "Women's Tops & Blouses",
    slug: 'womens-tops',
    description: 'Curated silk charmeuse, ribbed knit, and structured poplin blouses.',
    image: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800&q=80',
    _count: { products: 31 },
  },
  {
    id: 'cat-mens-tshirts',
    name: "Men's Luxury T-Shirts",
    slug: 'mens-tshirts',
    description: 'Classic Supima cotton, mercerized crewnecks, and tailored minimalist tees.',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    _count: { products: 23 },
  },
  {
    id: 'cat-womens-jeans',
    name: "Women's Premium Denim",
    slug: 'womens-jeans',
    description: 'High-rise straight cut, vintage washed blue, and tailored noir trousers.',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
    _count: { products: 3 },
  },
  {
    id: 'cat-mens-jeans',
    name: "Men's Tailored Denim",
    slug: 'mens-jeans',
    description: 'Japanese raw selvedge, classic regular fit, and relaxed washed noir denim.',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80',
    _count: { products: 5 },
  },
];

export const FALLBACK_FEATURED_PRODUCTS = [
  {
    id: 'prod-fallback-1',
    name: 'Crimson Silk Charmeuse Blouse',
    slug: 'crimson-silk-charmeuse-blouse',
    description: 'Tailored from 100% Mulberry silk with a fluid drape and lustrous finish.',
    brand: 'Aura Atelier',
    price: 185.0,
    discountPercent: 10,
    rating: 4.9,
    reviewCount: 42,
    stock: 18,
    images: ['https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800&q=80'],
    specifications: {
      Color: 'Red',
      Material: '100% Mulberry Silk',
      Department: 'Women',
      Category: 'Tops',
      'Available Sizes': 'XS, S, M, L, XL',
    },
    tags: ['women', 'top', 'red', 'silk', 'blouse'],
    category: { id: 'cat-womens-tops', name: "Women's Tops & Blouses", slug: 'womens-tops' },
    isFeatured: true,
  },
  {
    id: 'prod-fallback-2',
    name: 'Classic Crisp White Supima Crewneck',
    slug: 'classic-crisp-white-supima-crewneck',
    description: 'Crafted from 100% long-staple Supima cotton for enduring softness and structure.',
    brand: 'Maison Luxe',
    price: 65.0,
    discountPercent: 0,
    rating: 4.9,
    reviewCount: 64,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'],
    specifications: {
      Color: 'White',
      Material: '100% Supima Cotton',
      Department: 'Men',
      Category: 'T-Shirts',
      'Available Sizes': 'S, M, L, XL, XXL',
    },
    tags: ['men', 'tshirt', 'white', 'supima', 'crewneck'],
    category: { id: 'cat-mens-tshirts', name: "Men's Luxury T-Shirts", slug: 'mens-tshirts' },
    isFeatured: true,
  },
  {
    id: 'prod-fallback-3',
    name: 'Straight Fit Raw Selvedge Denim Jeans',
    slug: 'straight-fit-raw-selvedge-denim-jeans',
    description: '14.5 oz unwashed Japanese shuttle-loom selvedge denim that shapes to the wearer.',
    brand: 'Iron & Thread',
    price: 240.0,
    discountPercent: 0,
    rating: 5.0,
    reviewCount: 38,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80'],
    specifications: {
      Color: 'Indigo',
      Material: '14.5 oz Japanese Selvedge Cotton',
      Department: 'Men',
      Category: 'Jeans',
      'Available Sizes': '30, 31, 32, 33, 34',
    },
    tags: ['men', 'jeans', 'indigo', 'selvedge', 'raw'],
    category: { id: 'cat-mens-jeans', name: "Men's Tailored Denim", slug: 'mens-jeans' },
    isFeatured: true,
  },
  {
    id: 'prod-fallback-4',
    name: 'Emerald Green Silk Camisole',
    slug: 'emerald-green-silk-camisole',
    description: 'Minimalist bias-cut camisole crafted in rich emerald green Mulberry silk.',
    brand: 'Aura Atelier',
    price: 135.0,
    discountPercent: 15,
    rating: 4.9,
    reviewCount: 33,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80'],
    specifications: {
      Color: 'Green',
      Material: '100% Mulberry Silk',
      Department: 'Women',
      Category: 'Tops',
      'Available Sizes': 'XS, S, M, L',
    },
    tags: ['women', 'top', 'green', 'silk', 'camisole'],
    category: { id: 'cat-womens-tops', name: "Women's Tops & Blouses", slug: 'womens-tops' },
    isFeatured: true,
  },
];

export async function getProducts(options: ProductFilterOptions = {}) {
  const {
    query,
    category,
    brand,
    color,
    gender,
    size,
    apparelCategory,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    isFeatured,
    isPromoted,
    sort = 'popularity',
    page = 1,
    limit = 12,
  } = options;

  try {
    const where: any = {};

    if (query && query.trim() !== '') {
      const q = query.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
        { specifications: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (category) {
      where.category = {
        OR: [{ slug: category.toLowerCase() }, { name: category }],
      };
    }

    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    if (color && color !== 'All') {
      where.OR = [
        ...(where.OR || []),
        { tags: { contains: color.toLowerCase(), mode: 'insensitive' } },
        { specifications: { contains: `"Color":"${color}"`, mode: 'insensitive' } },
      ];
    }

    if (gender && gender !== 'All') {
      where.OR = [
        ...(where.OR || []),
        { tags: { contains: gender.toLowerCase(), mode: 'insensitive' } },
        { specifications: { contains: `"Department":"${gender}"`, mode: 'insensitive' } },
      ];
    }

    if (apparelCategory && apparelCategory !== 'All') {
      where.OR = [
        ...(where.OR || []),
        { tags: { contains: apparelCategory.toLowerCase(), mode: 'insensitive' } },
        { specifications: { contains: `"Category":"${apparelCategory}"`, mode: 'insensitive' } },
      ];
    }

    if (size) {
      where.specifications = { contains: size, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = Number(minPrice);
      if (maxPrice !== undefined) where.price.lte = Number(maxPrice);
    }

    if (minRating !== undefined) {
      where.rating = { gte: Number(minRating) };
    }

    if (inStockOnly) {
      where.stock = { gt: 0 };
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (isPromoted !== undefined) {
      where.isPromoted = isPromoted;
    }

    let orderBy: any = { reviewCount: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    else if (sort === 'price_desc') orderBy = { price: 'desc' };
    else if (sort === 'rating') orderBy = { rating: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (sort === 'discount') orderBy = { discountPercent: 'desc' };

    const take = Number(limit) || 12;
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    const parsedProducts = products.map((p) => ({
      ...p,
      images: safeParseJson<string[]>(p.images, []),
      specifications: safeParseJson<Record<string, any>>(p.specifications, {}),
      tags: safeParseJson<string[]>(p.tags, []),
    }));

    return {
      success: true,
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
      products: parsedProducts,
    };
  } catch (err) {
    console.error('getProducts query error (falling back):', err);
    return {
      success: true,
      total: FALLBACK_FEATURED_PRODUCTS.length,
      page: 1,
      limit: 12,
      totalPages: 1,
      products: FALLBACK_FEATURED_PRODUCTS,
    };
  }
}

export async function getProductByIdOrSlug(identifier: string) {
  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      // Check fallback items
      const fallback = FALLBACK_FEATURED_PRODUCTS.find(
        (p) => p.id === identifier || p.slug === identifier
      );
      if (fallback) {
        return { success: true, product: { ...fallback, reviews: [] } };
      }
      return { success: false, error: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
    }

    return {
      success: true,
      product: {
        ...product,
        images: safeParseJson<string[]>(product.images, []),
        specifications: safeParseJson<Record<string, any>>(product.specifications, {}),
        tags: safeParseJson<string[]>(product.tags, []),
      },
    };
  } catch (err) {
    console.error('getProductByIdOrSlug error:', err);
    const fallback = FALLBACK_FEATURED_PRODUCTS.find(
      (p) => p.id === identifier || p.slug === identifier
    );
    if (fallback) {
      return { success: true, product: { ...fallback, reviews: [] } };
    }
    return { success: false, error: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
  }
}

export async function getRecommendations(productId?: string, categorySlug?: string, limit = 4) {
  try {
    let categoryId: string | undefined;

    if (productId) {
      const current = await prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true },
      });
      if (current) categoryId = current.categoryId;
    }

    if (!categoryId && categorySlug) {
      const cat = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (cat) categoryId = cat.id;
    }

    const where: any = { stock: { gt: 0 } };
    if (productId) where.id = { not: productId };
    if (categoryId) where.categoryId = categoryId;

    let products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { rating: 'desc' },
      take: Number(limit) || 4,
    });

    if (products.length < limit) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          id: { notIn: [productId || '', ...products.map((p) => p.id)] },
          stock: { gt: 0 },
        },
        include: { category: true },
        orderBy: { isFeatured: 'desc' },
        take: limit - products.length,
      });
      products = [...products, ...fallbackProducts];
    }

    const parsed = products.map((p) => ({
      ...p,
      images: safeParseJson<string[]>(p.images, []),
      specifications: safeParseJson<Record<string, any>>(p.specifications, {}),
      tags: safeParseJson<string[]>(p.tags, []),
    }));

    return {
      success: true,
      recommendations: parsed,
    };
  } catch (err) {
    console.error('getRecommendations error (using fallback):', err);
    return {
      success: true,
      recommendations: FALLBACK_FEATURED_PRODUCTS.filter((p) => p.id !== productId).slice(0, limit),
    };
  }
}

export async function compareProducts(productIds: string[]) {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [{ id: { in: productIds } }, { slug: { in: productIds } }],
      },
      include: { category: true },
    });

    const parsed = products.map((p) => ({
      ...p,
      images: safeParseJson<string[]>(p.images, []),
      specifications: safeParseJson<Record<string, any>>(p.specifications, {}),
      tags: safeParseJson<string[]>(p.tags, []),
    }));

    return {
      success: true,
      products: parsed,
    };
  } catch (err) {
    console.error('compareProducts error:', err);
    const matched = FALLBACK_FEATURED_PRODUCTS.filter(
      (p) => productIds.includes(p.id) || productIds.includes(p.slug)
    );
    return {
      success: true,
      products: matched,
    };
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (categories && categories.length > 0) {
      return { success: true, categories };
    }
    return { success: true, categories: DEFAULT_CATEGORIES };
  } catch (err) {
    console.warn('getCategories database query failed (using default categories):', err);
    return { success: true, categories: DEFAULT_CATEGORIES };
  }
}

export async function getPromotions() {
  try {
    const [featured, discounted, coupons] = await Promise.all([
      prisma.product.findMany({
        where: { isFeatured: true, stock: { gt: 0 } },
        include: { category: true },
        take: 6,
      }),
      prisma.product.findMany({
        where: { discountPercent: { gt: 0 }, stock: { gt: 0 } },
        include: { category: true },
        orderBy: { discountPercent: 'desc' },
        take: 6,
      }),
      prisma.coupon.findMany({
        where: { isActive: true },
      }),
    ]);

    const parse = (list: any[]) =>
      list.map((p) => ({
        ...p,
        images: safeParseJson<string[]>(p.images, []),
        specifications: safeParseJson<Record<string, any>>(p.specifications, {}),
        tags: safeParseJson<string[]>(p.tags, []),
      }));

    return {
      success: true,
      featuredProducts: featured.length > 0 ? parse(featured) : FALLBACK_FEATURED_PRODUCTS,
      discountedProducts: parse(discounted),
      activeCoupons: coupons,
    };
  } catch (err) {
    console.warn('getPromotions database query failed (using fallback items):', err);
    return {
      success: true,
      featuredProducts: FALLBACK_FEATURED_PRODUCTS,
      discountedProducts: [],
      activeCoupons: [{ id: 'c-save10', code: 'SAVE10', discountPercent: 10, isActive: true }],
    };
  }
}
