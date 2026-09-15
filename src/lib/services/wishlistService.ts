import { prisma } from '../db';

export async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
    });
  }

  return wishlist;
}

export async function getUserWishlist(userId: string) {
  const wishlist = await getOrCreateWishlist(userId);

  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  const formatted = items.map((item) => {
    const images = typeof item.product.images === 'string' ? JSON.parse(item.product.images) : item.product.images;
    return {
      id: item.id,
      productId: item.productId,
      addedAt: item.addedAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        brand: item.product.brand,
        price: item.product.price,
        discountPercent: item.product.discountPercent,
        rating: item.product.rating,
        stock: item.product.stock,
        category: item.product.category.name,
        image: Array.isArray(images) && images.length > 0 ? images[0] : null,
      },
    };
  });

  return {
    success: true,
    wishlistId: wishlist.id,
    itemCount: formatted.length,
    items: formatted,
  };
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { success: false, error: 'PRODUCT_NOT_FOUND', message: 'Product does not exist.' };
  }

  const wishlist = await getOrCreateWishlist(userId);

  await prisma.wishlistItem.upsert({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
    create: {
      wishlistId: wishlist.id,
      productId,
    },
    update: {},
  });

  const updatedWishlist = await getUserWishlist(userId);

  return {
    success: true,
    message: `Added ${product.name} to wishlist.`,
    productId,
    itemCount: updatedWishlist.itemCount,
    wishlist: updatedWishlist,
  };
}

export async function removeFromWishlist(userId: string, productId: string) {
  const wishlist = await getOrCreateWishlist(userId);

  try {
    await prisma.wishlistItem.delete({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    });
  } catch {
    // If not found, ignore
  }

  const updatedWishlist = await getUserWishlist(userId);

  return {
    success: true,
    message: 'Item removed from wishlist.',
    productId,
    itemCount: updatedWishlist.itemCount,
    wishlist: updatedWishlist,
  };
}
