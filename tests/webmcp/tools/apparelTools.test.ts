import { describe, expect, it, vi } from 'vitest';
import { WebMCPRegistry } from '../../../src/webmcp/registry';
import { filterApparelTool, getApparelSizeGuideTool, APPAREL_SIZE_GUIDE } from '../../../src/webmcp/tools/apparelTools';
import { getAvailableProductVariantsTool } from '../../../src/webmcp/tools/productTools';

describe('Apparel WebMCP Tools & Failure Mode Protection Suite', () => {
  describe('Tool Registration & Schema Verification', () => {
    it('registers filter_apparel as a PUBLIC tool with category Apparel', () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(filterApparelTool);

      const tools = registry.getRegisteredToolsInfo();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('filter_apparel');
      expect(tools[0].category).toBe('Apparel');
      expect(tools[0].permission).toBe('PUBLIC');
      expect(tools[0].status).toBe('AVAILABLE');
    });

    it('registers get_apparel_size_guide as a PUBLIC tool with category Apparel', () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(getApparelSizeGuideTool);

      const tools = registry.getRegisteredToolsInfo();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('get_apparel_size_guide');
      expect(tools[0].category).toBe('Apparel');
      expect(tools[0].permission).toBe('PUBLIC');
      expect(tools[0].status).toBe('AVAILABLE');
    });
  });

  describe('Failure Mode Prevention for Apparel Inventory', () => {
    it('prevents failure mode: blocks requesting Red for Men with helpful suggestions', async () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(filterApparelTool);

      const result = await registry.executeTool('filter_apparel', {
        gender: 'Men',
        color: 'Red',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('COLOR_NOT_AVAILABLE_FOR_DEPARTMENT');
      expect(result.message).toContain("Red is exclusive to Women's Tops");
      expect(result.suggestions).toMatchObject({
        availableColorsForMen: ['Black', 'White', 'Blue'],
        availableColorsForWomen: ['Red', 'Blue', 'Green'],
      });
    });

    it('prevents failure mode: blocks requesting Green for Men with helpful suggestions', async () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(filterApparelTool);

      const result = await registry.executeTool('filter_apparel', {
        gender: 'Men',
        color: 'Green',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('COLOR_NOT_AVAILABLE_FOR_DEPARTMENT');
      expect(result.message).toContain("Green is exclusive to Women's Tops");
      expect(result.suggestions).toMatchObject({
        availableColorsForMen: ['Black', 'White', 'Blue'],
        availableColorsForWomen: ['Red', 'Blue', 'Green'],
      });
    });

    it('validates schema types: rejects non-numeric price thresholds', async () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(filterApparelTool);

      const result = await registry.executeTool('filter_apparel', {
        minPrice: 'free', // string instead of number
      });

      expect(result.error).toBe('INVALID_INPUT');
    });
  });

  describe('Apparel Size Guide Verification', () => {
    it('returns all size charts when category is All or omitted', async () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(getApparelSizeGuideTool);

      const result = await registry.executeTool('get_apparel_size_guide', {});

      expect(result.success).toBe(true);
      expect(result.guides).toBeDefined();
      expect(result.guides.WomensTops.sizes).toHaveLength(5);
      expect(result.guides.MensTshirts.sizes).toHaveLength(5);
      expect(result.guides.WomensJeans.sizes).toHaveLength(8);
      expect(result.guides.MensJeans.sizes).toHaveLength(7);
    });

    it('returns specific chart and fit advice for WomensTops', async () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(getApparelSizeGuideTool);

      const result = await registry.executeTool('get_apparel_size_guide', { category: 'WomensTops' });

      expect(result.success).toBe(true);
      expect(result.category).toBe('WomensTops');
      expect(result.guide.description).toContain('Standard US sizing');
      expect(result.guide.sizes[0]).toMatchObject({ size: 'XS' });
      expect(result.guide.fitAdvice).toBeDefined();
    });

    it('returns specific chart and fit advice for MensJeans', async () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(getApparelSizeGuideTool);

      const result = await registry.executeTool('get_apparel_size_guide', { category: 'MensJeans' });

      expect(result.success).toBe(true);
      expect(result.category).toBe('MensJeans');
      expect(result.guide.sizes[0]).toMatchObject({ size: '29' });
      expect(result.guide.fitAdvice).toContain('Raw selvedge');
    });
  });

  describe('Product Variants Extraction for Apparel', () => {
    it('extracts clothing sizes, color, fit, and material from product specifications', async () => {
      const registry = new WebMCPRegistry();
      registry.registerTool(getAvailableProductVariantsTool);

      // Mock global fetch for product lookup
      const mockProduct = {
        id: 'prod-silk-blouse',
        name: 'Crimson Silk Charmeuse Blouse',
        price: 185,
        stock: 18,
        specifications: {
          Color: 'Red',
          Department: 'Women',
          'Available Sizes': 'XS, S, M, L, XL',
          Fit: 'Tailored Relaxed Fit',
          Material: '100% Mulberry Silk',
        },
      };

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        json: async () => ({ success: true, product: mockProduct }),
      } as any);

      try {
        const result = await registry.executeTool('get_available_product_variants', {
          productId: 'prod-silk-blouse',
        });

        expect(result.success).toBe(true);
        expect(result.productId).toBe('prod-silk-blouse');
        expect(result.department).toBe('Women');
        expect(result.availableOptions.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL']);
        expect(result.availableOptions.colors).toEqual(['Red']);
        expect(result.availableOptions.fit).toEqual(['Tailored Relaxed Fit']);
        expect(result.availableOptions.material).toEqual(['100% Mulberry Silk']);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
