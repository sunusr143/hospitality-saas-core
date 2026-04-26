/**
 * Production Seed Template
 * Path: src/scripts/seed-production.ts
 * 
 * This script provides production configuration templates for:
 * 1. Multi-property rate plans with dynamic pricing
 * 2. Housekeeping task templates
 * 3. Maintenance request categories
 * 4. Restaurant/Bar menu configurations
 * 5. Corporate account templates
 * 
 * Usage:
 * npx ts-node src/scripts/seed-production.ts
 */

import dataSource from '../database/data-source';
import { Tenant } from '../modules/tenants/tenant.entity';
import { RatePlan } from '../modules/rate-plans/entities/rate-plan.entity';
import { RatePlanStatus } from '../modules/rate-plans/enums/rate-plan-status.enum';
import { RestaurantCategory } from '../modules/restaurant/entities/restaurant-category.entity';
import { RestaurantItem } from '../modules/restaurant/entities/restaurant-item.entity';
import { BarCategory } from '../modules/bar/entities/bar-category.entity';
import { BarItem } from '../modules/bar/entities/bar-item.entity';
import { CorporateAccount } from '../modules/corporate/entities/corporate-account.entity';

/**
 * Production-grade rate plans supporting:
 * - Seasonal pricing
 * - Peak/Off-peak rates
 * - Corporate rates
 * - Long-stay discounts
 */
async function seedRatePlans(tenantRepo: ReturnType<typeof dataSource.getRepository<Tenant>>) {
  const tenants = await tenantRepo.find();

  for (const tenant of tenants) {
    const ratePlanRepo = dataSource.getRepository(RatePlan);

    const productionRatePlans = [
      {
        code: 'BAR_WINTER',
        name: 'Best Available Rate - Winter',
        description: 'Flexible rate for winter season (Dec-Feb)',
        basePrice: 350,
        validFrom: new Date('2026-12-01'),
        validTo: new Date('2027-02-28'),
        seasonal: 'WINTER',
      },
      {
        code: 'BAR_SUMMER',
        name: 'Best Available Rate - Summer',
        description: 'Premium rate for summer season (Jun-Aug)',
        basePrice: 550,
        validFrom: new Date('2026-06-01'),
        validTo: new Date('2026-08-31'),
        seasonal: 'SUMMER',
      },
      {
        code: 'CORPORATE',
        name: 'Corporate Rate',
        description: 'Negotiated rate for corporate bookings',
        basePrice: 300,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        seasonal: 'YEAR_ROUND',
      },
      {
        code: 'LONGSTAY',
        name: 'Long Stay Discount',
        description: '14+ night bookings receive 15% discount',
        basePrice: 275,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        seasonal: 'YEAR_ROUND',
      },
      {
        code: 'PROMOTION_2026',
        name: '2026 Spring Promotion',
        description: 'Spring promotion rate (Mar-May)',
        basePrice: 400,
        validFrom: new Date('2026-03-01'),
        validTo: new Date('2026-05-31'),
        seasonal: 'SPRING',
      },
    ];

    for (const plan of productionRatePlans) {
      const existing = await ratePlanRepo.findOne({
        where: {
          tenant: { id: tenant.id },
          code: plan.code,
        },
      });

      if (!existing) {
        const ratePlan = ratePlanRepo.create({
          tenant,
          code: plan.code,
          name: plan.name,
          description: plan.description || null,
          basePrice: plan.basePrice,
          validFrom: plan.validFrom,
          validTo: plan.validTo,
          status: RatePlanStatus.ACTIVE,
        });

        await ratePlanRepo.save(ratePlan);
        console.log(`✓ Created rate plan: ${plan.code} for tenant ${tenant.code}`);
      }
    }
  }
}

/**
 * Premium restaurant menu with:
 * - Fine dining categories
 * - High-value items
 * - Tiered pricing
 * - Special beverages
 */
async function seedRestaurantMenu(tenantRepo: ReturnType<typeof dataSource.getRepository<Tenant>>) {
  const tenants = await tenantRepo.find();

  const categoryConfig = [
    { name: 'Appetizers', description: 'Fine dining starters' },
    { name: 'Soups & Salads', description: 'Light courses and salads' },
    { name: 'Main Courses', description: 'Premium entrees' },
    { name: 'Seafood', description: 'Fresh seafood selections' },
    { name: 'Desserts', description: 'Sweet endings' },
    { name: 'Wine List', description: 'Premium wines from around the world' },
    { name: 'Beverages', description: 'Hot and cold beverages' },
  ];

  const itemsByCategory = {
    'Appetizers': [
      { name: 'Shrimp Tempura', price: 850, taxRate: 0.05 },
      { name: 'Foie Gras Terrine', price: 1200, taxRate: 0.05 },
      { name: 'Lobster Bisque Cup', price: 650, taxRate: 0.05 },
    ],
    'Soups & Salads': [
      { name: 'Caesar Salad with Anchovies', price: 650, taxRate: 0.05 },
      { name: 'Truffle Risotto Soup', price: 750, taxRate: 0.05 },
      { name: 'Mixed Green Organic Salad', price: 550, taxRate: 0.05 },
    ],
    'Main Courses': [
      { name: 'Grilled Prime Steak (300g)', price: 1800, taxRate: 0.05 },
      { name: 'Pan-Seared Duck Breast', price: 1400, taxRate: 0.05 },
      { name: 'Saffron Risotto with Truffles', price: 1100, taxRate: 0.05 },
      { name: 'Herb-Roasted Chicken', price: 950, taxRate: 0.05 },
    ],
    'Seafood': [
      { name: 'Grilled Salmon with Herbs', price: 1200, taxRate: 0.05 },
      { name: 'Lobster Thermidor', price: 1600, taxRate: 0.05 },
      { name: 'Prawns in Garlic Butter', price: 1100, taxRate: 0.05 },
      { name: 'Scallop Ceviche', price: 950, taxRate: 0.05 },
    ],
    'Desserts': [
      { name: 'Chocolate Soufflé', price: 650, taxRate: 0.05 },
      { name: 'Créme Brûlée', price: 550, taxRate: 0.05 },
      { name: 'Strawberry Cheesecake', price: 600, taxRate: 0.05 },
      { name: 'Seasonal Fruit Plate', price: 500, taxRate: 0.05 },
    ],
    'Wine List': [
      { name: 'Bordeaux - By Glass', price: 850, taxRate: 0.05 },
      { name: 'Burgundy - By Glass', price: 950, taxRate: 0.05 },
      { name: 'Champagne - By Glass', price: 1100, taxRate: 0.05 },
      { name: 'Wine Pairing (5 course)', price: 3500, taxRate: 0.05 },
    ],
    'Beverages': [
      { name: 'Espresso', price: 200, taxRate: 0.05 },
      { name: 'Cappuccino', price: 300, taxRate: 0.05 },
      { name: 'Freshly Squeezed OJ', price: 350, taxRate: 0.05 },
      { name: 'Mineral Water (500ml)', price: 250, taxRate: 0.05 },
    ],
  };

  for (const tenant of tenants) {
    const restaurantCategoryRepo = dataSource.getRepository(RestaurantCategory);
    const restaurantItemRepo = dataSource.getRepository(RestaurantItem);

    for (const [categoryName, description] of Object.entries(categoryConfig).map(([k, v]) => [k, (v as any).description] as const)) {
      let category = await restaurantCategoryRepo.findOne({
        where: {
          tenant: { id: tenant.id },
          name: categoryName as string,
        },
      });

      if (!category) {
        category = await restaurantCategoryRepo.save(
          restaurantCategoryRepo.create({
            tenant,
            name: categoryName as string,
            description: description as string,
            sortOrder: Object.keys(categoryConfig).indexOf(categoryName as string),
            isActive: true,
          }),
        );
      }

      const items = itemsByCategory[categoryName as keyof typeof itemsByCategory] || [];
      for (const item of items) {
        const existing = await restaurantItemRepo.findOne({
          where: {
            tenant: { id: tenant.id },
            category: { id: category.id },
            name: item.name,
          },
        });

        if (!existing) {
          await restaurantItemRepo.save(
            restaurantItemRepo.create({
              tenant,
              category,
              name: item.name,
              price: item.price,
              currency: 'INR',
              taxRate: item.taxRate,
              isActive: true,
            }),
          );
        }
      }

      console.log(`✓ Seeded ${items.length} items in ${categoryName} for tenant ${tenant.code}`);
    }
  }
}

/**
 * Premium bar menu with:
 * - Spirits and cocktails
 * - Premium wines by glass
 * - Beer selection
 * - Mixers and non-alcoholic beverages
 */
async function seedBarMenu(tenantRepo: ReturnType<typeof dataSource.getRepository<Tenant>>) {
  const tenants = await tenantRepo.find();

  const barCategories = [
    { name: 'Cocktails', description: 'Signature and classic cocktails' },
    { name: 'Spirits', description: 'Premium spirits and liqueurs' },
    { name: 'Wine', description: 'Wine selections by glass' },
    { name: 'Beer', description: 'Craft and premium beers' },
    { name: 'Non-Alcoholic', description: 'Mocktails and soft drinks' },
  ];

  const barItemsByCategory = {
    'Cocktails': [
      { name: 'Mojito', price: 450, taxRate: 0 },
      { name: 'Daiquiri', price: 450, taxRate: 0 },
      { name: 'Margarita', price: 500, taxRate: 0 },
      { name: 'Cosmopolitan', price: 500, taxRate: 0 },
      { name: 'Negroni', price: 550, taxRate: 0 },
      { name: 'Whiskey Sour', price: 500, taxRate: 0 },
    ],
    'Spirits': [
      { name: 'Single Malt Scotch (30ml)', price: 650, taxRate: 0 },
      { name: 'Premium Vodka (30ml)', price: 500, taxRate: 0 },
      { name: 'Cognac (30ml)', price: 750, taxRate: 0 },
      { name: 'Rum Premium (30ml)', price: 600, taxRate: 0 },
    ],
    'Wine': [
      { name: 'Red Wine - House (150ml)', price: 450, taxRate: 0 },
      { name: 'White Wine - House (150ml)', price: 450, taxRate: 0 },
      { name: 'Champagne (150ml)', price: 750, taxRate: 0 },
      { name: 'Sparkling Wine (150ml)', price: 600, taxRate: 0 },
    ],
    'Beer': [
      { name: 'Domestic Lager (330ml)', price: 300, taxRate: 0 },
      { name: 'Craft IPA (330ml)', price: 350, taxRate: 0 },
      { name: 'Imported Pilsner (330ml)', price: 400, taxRate: 0 },
      { name: 'Premium Stout (330ml)', price: 380, taxRate: 0 },
    ],
    'Non-Alcoholic': [
      { name: 'Mocktail - Virgin Mojito', price: 300, taxRate: 0 },
      { name: 'Fresh Lime Soda', price: 200, taxRate: 0 },
      { name: 'Iced Tea', price: 200, taxRate: 0 },
      { name: 'Soft Drink Can', price: 150, taxRate: 0 },
    ],
  };

  for (const tenant of tenants) {
    const barCategoryRepo = dataSource.getRepository(BarCategory);
    const barItemRepo = dataSource.getRepository(BarItem);

    for (const [index, cat] of barCategories.entries()) {
      let category = await barCategoryRepo.findOne({
        where: {
          tenant: { id: tenant.id },
          name: cat.name,
        },
      });

      if (!category) {
        category = await barCategoryRepo.save(
          barCategoryRepo.create({
            tenant,
            name: cat.name,
            description: cat.description,
            sortOrder: index,
            isActive: true,
          }),
        );
      }

      const items = barItemsByCategory[cat.name as keyof typeof barItemsByCategory] || [];
      for (const item of items) {
        const existing = await barItemRepo.findOne({
          where: {
            tenant: { id: tenant.id },
            category: { id: category.id },
            name: item.name,
          },
        });

        if (!existing) {
          await barItemRepo.save(
            barItemRepo.create({
              tenant,
              category,
              name: item.name,
              price: item.price,
              currency: 'INR',
              taxRate: item.taxRate,
              isActive: true,
            }),
          );
        }
      }

      console.log(`✓ Seeded ${items.length} items in ${cat.name} for tenant ${tenant.code}`);
    }
  }
}

/**
 * Production corporate account templates:
 * - Standard corporate rates
 * - Conference/event hosting
 * - Long-term stay agreements
 */
async function seedCorporateAccounts(tenantRepo: ReturnType<typeof dataSource.getRepository<Tenant>>) {
  const tenants = await tenantRepo.find();

  const corporateTemplates = [
    {
      name: 'TechCorp India',
      contact: 'hr.accommodation@techcorp.example',
      email: 'hr.accommodation@techcorp.example',
      phone: '+91-080-4000-5000',
      address: 'Tech Park, Bangalore 560001',
      description: 'Software company with frequent traveler requirements',
    },
    {
      name: 'Global Consulting Ltd',
      contact: 'Travel Admin',
      email: 'travel@globalconsulting.example',
      phone: '+91-033-4000-5001',
      address: 'Kolkata Business District',
      description: 'Management consulting with conference hosting needs',
    },
    {
      name: 'Manufacturing Co Ltd',
      contact: 'Corporate Relations',
      email: 'corporate@manufacturing.example',
      phone: '+91-022-4000-5002',
      address: 'Mumbai Industrial Zone',
      description: 'Large manufacturing plant with executive housing',
    },
  ];

  for (const tenant of tenants) {
    const corporateRepo = dataSource.getRepository(CorporateAccount);

    for (const corp of corporateTemplates) {
      const existing = await corporateRepo.findOne({
        where: {
          tenant: { id: tenant.id },
          name: corp.name,
        },
      });

      if (!existing) {
        await corporateRepo.save(
          corporateRepo.create({
            tenant,
            name: corp.name,
            contactName: corp.contact,
            contactEmail: corp.email,
            contactPhone: corp.phone,
            billingAddress: corp.address,
            isActive: true,
          }),
        );

        console.log(`✓ Created corporate account: ${corp.name}`);
      }
    }
  }
}

/**
 * Maintenance request category templates
 * These help staff categorize maintenance issues
 */
const maintenanceCategories = [
  {
    title: 'Plumbing Issues',
    description: 'Leaks, clogs, water heating problems',
    priority: 'HIGH',
  },
  {
    title: 'Electrical Issues',
    description: 'Power outages, broken outlets, lighting problems',
    priority: 'HIGH',
  },
  {
    title: 'HVAC/Climate Control',
    description: 'Air conditioning, heating, ventilation problems',
    priority: 'MEDIUM',
  },
  {
    title: 'Furniture & Fixtures',
    description: 'Broken furniture, damaged fixtures, minor repairs',
    priority: 'LOW',
  },
  {
    title: 'Door & Lock Issues',
    description: 'Broken locks, door hinges, keycard problems',
    priority: 'MEDIUM',
  },
  {
    title: 'Window & Glass',
    description: 'Broken windows, mirrors, glass fixtures',
    priority: 'MEDIUM',
  },
  {
    title: 'Paint & Walls',
    description: 'Wall damage, paint touch-ups, wallpaper issues',
    priority: 'LOW',
  },
  {
    title: 'Appliance Repair',
    description: 'TV, refrigerator, microwave, other appliances',
    priority: 'MEDIUM',
  },
];

/**
 * Housekeeping task templates
 * These help schedule routine cleaning tasks
 */
const housekeepingTemplates = [
  {
    title: 'Daily Room Cleaning',
    description: 'Standard daily room turnover cleaning',
    priority: 'HIGH',
  },
  {
    title: 'Deep Clean',
    description: 'Thorough cleaning including carpets, upholstery',
    priority: 'NORMAL',
  },
  {
    title: 'Linen Change',
    description: 'Change bed linens and towels',
    priority: 'NORMAL',
  },
  {
    title: 'Bathroom Sanitation',
    description: 'Deep clean bathroom, sanitize surfaces',
    priority: 'NORMAL',
  },
  {
    title: 'Vacancy Inspection',
    description: 'Inspect room after checkout for damage',
    priority: 'HIGH',
  },
  {
    title: 'Common Area Cleaning',
    description: 'Hallways, lobby, public spaces',
    priority: 'NORMAL',
  },
  {
    title: 'Window Cleaning',
    description: 'Clean interior and exterior windows',
    priority: 'LOW',
  },
  {
    title: 'Carpet Shampooing',
    description: 'Deep clean carpets using shampooing method',
    priority: 'LOW',
  },
];

/**
 * Main seed execution
 */
async function seedProduction() {
  console.log('Starting production seed...');

  try {
    await dataSource.initialize();
    const tenantRepo = dataSource.getRepository(Tenant);

    console.log('\n📋 Seeding rate plans...');
    await seedRatePlans(tenantRepo);

    console.log('\n🍽️  Seeding restaurant menu...');
    await seedRestaurantMenu(tenantRepo);

    console.log('\n🍺 Seeding bar menu...');
    await seedBarMenu(tenantRepo);

    console.log('\n🏢 Seeding corporate accounts...');
    await seedCorporateAccounts(tenantRepo);

    console.log('\n📋 Production seed templates:');
    console.log('\nMaintenance Categories:');
    maintenanceCategories.forEach((cat) => {
      console.log(`  - ${cat.title} (${cat.priority}) - ${cat.description}`);
    });

    console.log('\nHousekeeping Task Templates:');
    housekeepingTemplates.forEach((task) => {
      console.log(`  - ${task.title} (${task.priority}) - ${task.description}`);
    });

    console.log('\n✅ Production seed completed successfully!');
  } catch (error) {
    console.error('Production seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seedProduction();
