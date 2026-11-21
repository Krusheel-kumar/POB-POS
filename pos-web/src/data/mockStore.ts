import type {
  Product,
  ProductRequest,
  ProductCategory,
  RestaurantTable,
  Order,
  OrderItem,
  Bill,
  KitchenTicket,
  KitchenTicketItem,
  Payment,
  Outlet,
  CreateOutletRequest,
  AddOn,
  AddOnCategory,
  AddOnCategoryRequest,
  CalculationResponse,
  CreateOrderRequest,
  TableStatus,
  KitchenTicketStatus,
  PaymentMethod,
  PaymentPolicy,
  AddOrderItemsRequest,
  DietaryType,
} from '../types/pos';

const STORAGE_KEY_PREFIX = 'pob_pos_demo_';

export const INITIAL_OUTLETS: Outlet[] = [
  {
    id: 'outlet-demo-flagship',
    name: "POP O' BOB - Flagship Film Nagar",
    code: 'POB-FN-01',
    address: '407, Mezzanine, Road No 81, Film Nagar, Hyderabad, Telangana 500096',
    phone: '+91 98765 43210',
    managerName: 'Arjun Varma',
    paymentPolicy: 'FLEXIBLE',
  },
  {
    id: 'outlet-01',
    name: "POP O' BOB - Jubilee Hills Flagship",
    code: 'OUTLET-01',
    address: 'Plot 72, Road 36, Jubilee Hills, Hyderabad',
    phone: '+91 91234 56780',
    managerName: 'Pooja Reddy',
    paymentPolicy: 'FLEXIBLE',
  },
  {
    id: 'outlet-02',
    name: "POP O' BOB - Madhapur Express",
    code: 'OUTLET-02',
    address: 'Ground Floor, Inorbit Mall Road, Madhapur, Hyderabad',
    phone: '+91 91234 56781',
    managerName: 'Vikram Singh',
    paymentPolicy: 'PAY_FIRST',
  },
  {
    id: 'outlet-03',
    name: "POP O' BOB - Hitech City Cyber Towers",
    code: 'OUTLET-03',
    address: 'Cyber Towers Concourse, Hitech City, Hyderabad',
    phone: '+91 91234 56782',
    managerName: 'Sneha Patel',
    paymentPolicy: 'FLEXIBLE',
  },
];

export const INITIAL_OUTLET: Outlet = INITIAL_OUTLETS[0];

export const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat-boba',
    name: '🧋 Boba & Teas',
    description: 'Freshly brewed milk, fruit, and cheese-foam teas',
    displayOrder: 1,
    isActive: true,
    subcategories: ['Milk Teas', 'Fruit Teas', 'Cheese Foam', 'Sparkling Brews'],
  },
  {
    id: 'cat-coffee',
    name: '☕ Coffee & Brews',
    description: 'Artisan single-origin espresso and slow brews',
    displayOrder: 2,
    isActive: true,
    subcategories: ['Espresso & Hot', 'Iced & Cold Brew', 'Manual Pour Over', 'Frappes & Blends'],
  },
  {
    id: 'cat-burgers',
    name: '🍔 Gourmet Burgers',
    description: 'Handcrafted smash patties on toasted brioche buns',
    displayOrder: 3,
    isActive: true,
    subcategories: ['Smash Burgers', 'Crispy Chicken', 'Veggie & Paneer', 'Sliders & Combos'],
  },
  {
    id: 'cat-pizzas',
    name: '🍕 Artisan Pizzas',
    description: 'Wood-fired sourdough crust with premium toppings',
    displayOrder: 4,
    isActive: true,
    subcategories: ['Classic Red 10"', 'White Sourdough', 'Spicy Meat Lovers', 'Cheesy Calzones'],
  },
  {
    id: 'cat-sides',
    name: '🍟 Appetizers & Crunchies',
    description: 'Truffle fries, spicy wings, and savory bites',
    displayOrder: 5,
    isActive: true,
    subcategories: ['Loaded Fries', 'Wings & Tenders', 'Nachos & Dips', 'Bites & Poppers'],
  },
  {
    id: 'cat-desserts',
    name: '🍰 Patisserie & Shakes',
    description: 'Decadent gelato shakes, croissants, and waffles',
    displayOrder: 6,
    isActive: true,
    subcategories: ['Belgian Waffles', 'Cheesecakes & Tarts', 'Thick Gelato Shakes', 'Sundae Bowls'],
  },
];

export const INITIAL_ADDON_CATEGORIES: AddOnCategory[] = [
  { id: 'aocat-milk', name: 'Choice of Milk', displayOrder: 1, selectionType: 'SINGLE', minSelections: 1, maxSelections: 1, isActive: true },
  { id: 'aocat-size', name: 'Choice Of Size', displayOrder: 2, selectionType: 'SINGLE', minSelections: 1, maxSelections: 1, isActive: true },
  { id: 'aocat-free-toppings', name: 'Choice of Free Toppings', displayOrder: 3, selectionType: 'MULTI', minSelections: 0, maxSelections: 3, isActive: true },
  { id: 'aocat-extra-toppings', name: 'Choice of Extra Toppings', displayOrder: 4, selectionType: 'MULTI', minSelections: 0, maxSelections: 3, isActive: true },
  { id: 'aocat-sweetness', name: 'Choice Of Sweetness', displayOrder: 5, selectionType: 'SINGLE', minSelections: 1, maxSelections: 1, isActive: true },
  { id: 'aocat-ice', name: 'Choice Of Ice Level', displayOrder: 6, selectionType: 'SINGLE', minSelections: 1, maxSelections: 1, isActive: true },
  { id: 'aocat-boba', name: 'Choice Of Boba & Toppings', displayOrder: 7, selectionType: 'MULTI', minSelections: 0, maxSelections: 3, isActive: true },
  { id: 'aocat-milk-base', name: 'Choice Of Milk Base', displayOrder: 8, selectionType: 'SINGLE', minSelections: 1, maxSelections: 1, isActive: true },
  { id: 'aocat-dips', name: 'Choice Of Dips & Cheeses', displayOrder: 9, selectionType: 'MULTI', minSelections: 0, maxSelections: 3, isActive: true },
];

export const INITIAL_ADDONS: AddOn[] = [
  // 📏 Choice Of Size (Single Choice)
  { id: 'addon-size-reg', name: 'Regular (300ml)', price: 0, isActive: true, category: 'Choice Of Size', selectionType: 'SINGLE' },
  { id: 'addon-size-med', name: 'Medium (500ml)', price: 40, isActive: true, category: 'Choice Of Size', selectionType: 'SINGLE' },
  { id: 'addon-size-lg', name: 'Large (700ml)', price: 70, isActive: true, category: 'Choice Of Size', selectionType: 'SINGLE' },

  // 🍬 Choice Of Sweetness (Single Choice)
  { id: 'addon-sweet-100', name: '100% Normal Sugar', price: 0, isActive: true, category: 'Choice Of Sweetness', selectionType: 'SINGLE' },
  { id: 'addon-sweet-70', name: '70% Less Sugar', price: 0, isActive: true, category: 'Choice Of Sweetness', selectionType: 'SINGLE' },
  { id: 'addon-sweet-50', name: '50% Half Sugar', price: 0, isActive: true, category: 'Choice Of Sweetness', selectionType: 'SINGLE' },
  { id: 'addon-sweet-0', name: '0% Sugar-Free', price: 0, isActive: true, category: 'Choice Of Sweetness', selectionType: 'SINGLE' },

  // 🧊 Choice Of Ice Level (Single Choice)
  { id: 'addon-ice-reg', name: 'Regular Ice', price: 0, isActive: true, category: 'Choice Of Ice Level', selectionType: 'SINGLE' },
  { id: 'addon-ice-less', name: 'Less Ice', price: 0, isActive: true, category: 'Choice Of Ice Level', selectionType: 'SINGLE' },
  { id: 'addon-ice-none', name: 'No Ice', price: 0, isActive: true, category: 'Choice Of Ice Level', selectionType: 'SINGLE' },

  // 🧋 Choice Of Boba & Toppings (Multiple Choice)
  { id: 'addon-pearls', name: 'Extra Brown Sugar Boba', price: 35, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },
  { id: 'addon-golden-boba', name: 'Golden Honey Boba', price: 35, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },
  { id: 'addon-crystal-boba', name: 'Chewy Crystal Boba', price: 40, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },
  { id: 'addon-mango-popping', name: 'Mango Popping Boba', price: 35, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },
  { id: 'addon-lychee-jelly', name: 'Lychee Coconut Jelly', price: 30, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },
  { id: 'addon-cheese-foam', name: 'Velvet Cheese Foam Cap', price: 45, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },
  { id: 'addon-creme-brulee', name: 'Torched Creme Brulee Top', price: 50, isActive: true, category: 'Choice Of Boba & Toppings', selectionType: 'MULTI' },

  // 🥛 Choice Of Milk Base (Single Choice)
  { id: 'addon-milk-std', name: 'Standard Dairy Milk', price: 0, isActive: true, category: 'Choice Of Milk Base', selectionType: 'SINGLE' },
  { id: 'addon-oat-milk', name: 'Oat Milk Substitution', price: 40, isActive: true, category: 'Choice Of Milk Base', selectionType: 'SINGLE' },
  { id: 'addon-almond-milk', name: 'Almond Milk Substitution', price: 40, isActive: true, category: 'Choice Of Milk Base', selectionType: 'SINGLE' },

  // 🍟 Choice Of Dips & Cheeses (Multiple Choice)
  { id: 'addon-truffle-dip', name: 'Truffle Mayo Dip', price: 55, isActive: true, category: 'Choice Of Dips & Cheeses', selectionType: 'MULTI' },
  { id: 'addon-extra-cheese', name: 'Melted Mozzarella Top', price: 60, isActive: true, category: 'Choice Of Dips & Cheeses', selectionType: 'MULTI' },
  { id: 'addon-jalapenos', name: 'Pickled Jalapenos', price: 25, isActive: true, category: 'Choice Of Dips & Cheeses', selectionType: 'MULTI' },
  { id: 'addon-peri-dust', name: 'Spicy Peri Peri Dust', price: 20, isActive: true, category: 'Choice Of Dips & Cheeses', selectionType: 'MULTI' },
];

export const INITIAL_PRODUCTS: Product[] = [
  // 🧋 Boba & Teas
  {
    id: 'prod-boba-1',
    name: 'Tiger Brown Sugar Boba',
    description: 'Fresh organic milk with warm chewy tapioca pearls and caramelized brown sugar.',
    sku: 'TEA-TGR-01',
    basePrice: 240,
    isActive: true,
    dietaryType: 'BEVERAGE',
    prepTimeMinutes: 5,
    badge: 'Bestseller',
    subcategory: 'Milk Teas',
    imageUrl: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[0],
    variants: [
      { id: 'var-boba-reg', name: 'Regular 400ml', sizeLabel: '400 ml', price: 240, isActive: true },
      { id: 'var-boba-lg', name: 'Large 650ml', sizeLabel: '650 ml', price: 290, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[0], INITIAL_ADDONS[1], INITIAL_ADDONS[2]],
  },
  {
    id: 'prod-boba-2',
    name: 'Kyoto Ceremonial Matcha',
    description: 'First-harvest Uji matcha hand-whisked over silky textured milk and honey.',
    sku: 'TEA-MTC-02',
    basePrice: 260,
    isActive: true,
    dietaryType: 'BEVERAGE',
    prepTimeMinutes: 6,
    badge: 'Festive',
    subcategory: 'Cheese Foam',
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[0],
    variants: [
      { id: 'var-mtc-reg', name: 'Regular 400ml', sizeLabel: '400 ml', price: 260, isActive: true },
      { id: 'var-mtc-lg', name: 'Large 650ml', sizeLabel: '650 ml', price: 310, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[0], INITIAL_ADDONS[1], INITIAL_ADDONS[2]],
  },
  {
    id: 'prod-boba-3',
    name: 'Taro Coconut Cream Tea',
    description: 'Rich velvety purple taro puree blended with cold brew jasmine green tea and jelly.',
    sku: 'TEA-TAR-03',
    basePrice: 250,
    isActive: true,
    dietaryType: 'BEVERAGE',
    prepTimeMinutes: 5,
    badge: 'Handcrafted',
    subcategory: 'Fruit Teas',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[0],
    variants: [
      { id: 'var-tar-reg', name: 'Regular 400ml', sizeLabel: '400 ml', price: 250, isActive: true },
      { id: 'var-tar-lg', name: 'Large 650ml', sizeLabel: '650 ml', price: 295, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[0], INITIAL_ADDONS[1]],
  },

  // ☕ Coffee & Brews
  {
    id: 'prod-cof-1',
    name: 'Iced Spanish Latte',
    description: 'Double ristretto espresso shaken over condensed milk and Sri Lankan cinnamon.',
    sku: 'COF-SPN-01',
    basePrice: 220,
    isActive: true,
    dietaryType: 'BEVERAGE',
    prepTimeMinutes: 4,
    badge: 'Popular',
    subcategory: 'Iced & Cold Brew',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[1],
    variants: [
      { id: 'var-spn-reg', name: 'Single Shot 300ml', sizeLabel: '300 ml', price: 220, isActive: true },
      { id: 'var-spn-dbl', name: 'Double Shot 450ml', sizeLabel: '450 ml', price: 260, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[2], INITIAL_ADDONS[3]],
  },
  {
    id: 'prod-cof-2',
    name: 'Nitro Cold Brew Reserve',
    description: 'Slow-steeped for 20 hours with nitrogen infusion for a cascading crema.',
    sku: 'COF-NTR-02',
    basePrice: 210,
    isActive: true,
    dietaryType: 'BEVERAGE',
    prepTimeMinutes: 2,
    badge: 'Reserve',
    subcategory: 'Iced & Cold Brew',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[1],
    variants: [
      { id: 'var-ntr-reg', name: 'Standard 350ml', sizeLabel: '350 ml', price: 210, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[1]],
  },

  // 🍔 Gourmet Burgers
  {
    id: 'prod-brg-1',
    name: 'Truffle Smash Cheeseburger',
    description: 'Double smashed grass-fed patties, aged cheddar, and black truffle aioli on brioche.',
    sku: 'BRG-TRF-01',
    basePrice: 380,
    isActive: true,
    dietaryType: 'NON_VEG',
    prepTimeMinutes: 12,
    badge: 'Bestseller',
    subcategory: 'Smash Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[2],
    variants: [
      { id: 'var-brg-sngl', name: 'Double Smash Patty', sizeLabel: 'Double', price: 380, isActive: true },
      { id: 'var-brg-trpl', name: 'Triple Smash Monster', sizeLabel: 'Triple', price: 460, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[4], INITIAL_ADDONS[5], INITIAL_ADDONS[6]],
  },
  {
    id: 'prod-brg-2',
    name: 'Smoked Cottage Cheese Melt',
    description: 'Charred paneer steak in roasted spices, chipotle glaze, and melted Monterey Jack.',
    sku: 'BRG-PNR-02',
    basePrice: 320,
    isActive: true,
    dietaryType: 'VEG',
    prepTimeMinutes: 10,
    badge: 'Chef Special',
    subcategory: 'Veggie & Paneer',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[2],
    variants: [
      { id: 'var-pnr-reg', name: 'Regular Brioche', sizeLabel: 'Regular', price: 320, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[5], INITIAL_ADDONS[6]],
  },
  {
    id: 'prod-brg-3',
    name: 'Nashville Hot Crispy Chicken',
    description: 'Buttermilk fried chicken in Nashville cayenne oil, house dill pickles, and slaw.',
    sku: 'BRG-NSH-03',
    basePrice: 360,
    isActive: true,
    dietaryType: 'NON_VEG',
    prepTimeMinutes: 12,
    badge: 'Spicy Hot',
    subcategory: 'Crispy Chicken',
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[2],
    variants: [
      { id: 'var-nsh-reg', name: 'Spicy Level Medium', sizeLabel: 'Medium', price: 360, isActive: true },
      { id: 'var-nsh-xhot', name: 'Reaper Extra Hot', sizeLabel: 'X-Hot', price: 380, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[4], INITIAL_ADDONS[5]],
  },

  // 🍕 Artisan Pizzas
  {
    id: 'prod-piz-1',
    name: 'Margherita Rustica (11")',
    description: 'San Marzano tomato base, fresh buffalo mozzarella fior di latte, and sweet basil.',
    sku: 'PIZ-MRG-01',
    basePrice: 420,
    isActive: true,
    dietaryType: 'VEG',
    prepTimeMinutes: 14,
    badge: 'Classic',
    subcategory: 'Classic Red 10"',
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[3],
    variants: [
      { id: 'var-mrg-11', name: 'Personal 11-inch', sizeLabel: '11 inch', price: 420, isActive: true },
      { id: 'var-mrg-14', name: 'Sharing 14-inch', sizeLabel: '14 inch', price: 580, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[5], INITIAL_ADDONS[6]],
  },
  {
    id: 'prod-piz-2',
    name: 'Smoked Chicken & BBQ Onion',
    description: 'Hickory smoked shredded chicken, charred peppers, onion jam, and smokey BBQ drizzle.',
    sku: 'PIZ-CHK-02',
    basePrice: 490,
    isActive: true,
    dietaryType: 'NON_VEG',
    prepTimeMinutes: 15,
    badge: 'Wood-Fired',
    subcategory: 'Spicy Meat Lovers',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[3],
    variants: [
      { id: 'var-chk-11', name: 'Personal 11-inch', sizeLabel: '11 inch', price: 490, isActive: true },
      { id: 'var-chk-14', name: 'Sharing 14-inch', sizeLabel: '14 inch', price: 650, isActive: true },
    ],
    addOns: [INITIAL_ADDONS[5], INITIAL_ADDONS[6]],
  },

  // 🍟 Appetizers & Crunchies
  {
    id: 'prod-sd-1',
    name: 'Parmesan Truffle Fries',
    description: 'Shoestring potatoes dusted with shaved aged parmesan, sea salt, and white truffle essence.',
    sku: 'APP-TRF-01',
    basePrice: 220,
    isActive: true,
    dietaryType: 'VEG',
    prepTimeMinutes: 7,
    badge: 'Truffle',
    subcategory: 'Loaded Fries',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[4],
    variants: [],
    addOns: [INITIAL_ADDONS[4], INITIAL_ADDONS[5]],
  },
  {
    id: 'prod-sd-2',
    name: 'Crispy Peri-Peri Chicken Wings',
    description: '6 pcs twice-cooked crunchy wings glazed in zesty bird’s eye chili peri-peri glaze.',
    sku: 'APP-WNG-02',
    basePrice: 280,
    isActive: true,
    dietaryType: 'NON_VEG',
    prepTimeMinutes: 9,
    badge: 'Crispy',
    subcategory: 'Wings & Tenders',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[4],
    variants: [],
    addOns: [INITIAL_ADDONS[4]],
  },

  // 🍰 Patisserie & Shakes
  {
    id: 'prod-dst-1',
    name: 'Nutella Belgian Waffle',
    description: 'Warm sugar pearl waffle with warm Nutella, toasted hazelnuts, and vanilla gelato.',
    sku: 'DST-WFL-01',
    basePrice: 260,
    isActive: true,
    dietaryType: 'VEG',
    prepTimeMinutes: 8,
    badge: 'Belgium',
    subcategory: 'Belgian Waffles',
    imageUrl: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[5],
    variants: [],
    addOns: [],
  },
  {
    id: 'prod-dst-2',
    name: 'Lotus Biscoff Thickshake',
    description: 'Vanilla cream shake swirled with speculoos biscuit butter and crunchy crumbles.',
    sku: 'DST-BSC-02',
    basePrice: 280,
    isActive: true,
    dietaryType: 'BEVERAGE',
    prepTimeMinutes: 5,
    badge: 'Signature',
    subcategory: 'Thick Gelato Shakes',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
    category: INITIAL_CATEGORIES[5],
    variants: [],
    addOns: [INITIAL_ADDONS[1]],
  },
];

export const INITIAL_TABLES: RestaurantTable[] = [
  {
    id: 'tbl-1',
    tableNumber: 'T-01',
    name: 'Window Booth',
    capacity: 2,
    status: 'AVAILABLE',
  },
  {
    id: 'tbl-2',
    tableNumber: 'T-02',
    name: 'Center Patio',
    capacity: 4,
    status: 'RUNNING',
    currentOrderId: 'ord-seed-02',
    orderNumber: 'ORD-2026-0042',
    durationMinutes: 28,
    currentTotal: 620,
    amountPaid: 0,
    amountDue: 620,
  },
  {
    id: 'tbl-3',
    tableNumber: 'T-03',
    name: 'Family Lounge',
    capacity: 6,
    status: 'BILL_REQUESTED',
    currentOrderId: 'ord-seed-03',
    orderNumber: 'ORD-2026-0038',
    durationMinutes: 52,
    currentTotal: 1240,
    amountPaid: 0,
    amountDue: 1240,
  },
  {
    id: 'tbl-4',
    tableNumber: 'T-04',
    name: 'Cozy Corner',
    capacity: 4,
    status: 'AVAILABLE',
  },
  {
    id: 'tbl-5',
    tableNumber: 'T-05',
    name: 'High Bar Table',
    capacity: 2,
    status: 'AVAILABLE',
  },
  {
    id: 'tbl-6',
    tableNumber: 'T-06',
    name: 'VIP Private Dining',
    capacity: 8,
    status: 'AVAILABLE',
  },
];

export const INITIAL_TICKETS: KitchenTicket[] = [
  {
    id: 'kt-seed-02',
    ticketNumber: 'KOT-104',
    status: 'PREPARING',
    orderNumberSnapshot: 'ORD-2026-0042',
    orderTypeSnapshot: 'DINE_IN',
    customerNotesSnapshot: 'Table T-02 • Less ice in Boba please',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'kti-1',
        productNameSnapshot: 'Truffle Smash Cheeseburger',
        variantNameSnapshot: 'Double Smash Patty',
        quantity: 1,
        itemNotesSnapshot: 'Medium well done',
        status: 'PREPARING',
        addOns: [{ id: 'ao-1', addOnNameSnapshot: 'Melted Mozzarella Top' }],
      },
      {
        id: 'kti-2',
        productNameSnapshot: 'Tiger Brown Sugar Boba',
        variantNameSnapshot: 'Regular 400ml',
        quantity: 1,
        itemNotesSnapshot: '50% sweetness, less ice',
        status: 'READY',
        addOns: [{ id: 'ao-2', addOnNameSnapshot: 'Velvet Cheese Foam Cap' }],
      },
    ],
  },
  {
    id: 'kt-seed-03',
    ticketNumber: 'KOT-103',
    status: 'QUEUED',
    orderNumberSnapshot: 'ORD-2026-0038',
    orderTypeSnapshot: 'DINE_IN',
    customerNotesSnapshot: 'Table T-03 • Family dining',
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'kti-3',
        productNameSnapshot: 'Margherita Rustica (11")',
        variantNameSnapshot: 'Sharing 14-inch',
        quantity: 1,
        itemNotesSnapshot: 'Extra crispy crust',
        status: 'QUEUED',
        addOns: [{ id: 'ao-3', addOnNameSnapshot: 'Pickled Jalapenos' }],
      },
      {
        id: 'kti-4',
        productNameSnapshot: 'Parmesan Truffle Fries',
        quantity: 2,
        status: 'QUEUED',
        addOns: [{ id: 'ao-4', addOnNameSnapshot: 'Truffle Mayo Dip' }],
      },
      {
        id: 'kti-5',
        productNameSnapshot: 'Lotus Biscoff Thickshake',
        quantity: 2,
        status: 'QUEUED',
        addOns: [],
      },
    ],
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-seed-01',
    orderNumber: 'ORD-2026-0035',
    orderType: 'COUNTER',
    status: 'COMPLETED',
    subtotal: 480,
    discountAmount: 0,
    taxableAmount: 480,
    taxAmount: 24, // 5% GST
    totalAmount: 504,
    customerNotes: 'Counter Pickup',
    createdAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    items: [
      {
        id: 'oi-1',
        productNameSnapshot: 'Tiger Brown Sugar Boba',
        variantNameSnapshot: 'Regular 400ml',
        quantity: 2,
        unitPriceSnapshot: 240,
        lineTotalSnapshot: 480,
      },
    ],
  },
  {
    id: 'ord-seed-02',
    orderNumber: 'ORD-2026-0042',
    orderType: 'DINE_IN',
    status: 'CONFIRMED',
    subtotal: 590,
    discountAmount: 0,
    taxableAmount: 590,
    taxAmount: 29.5,
    totalAmount: 619.5,
    customerNotes: 'Table T-02',
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    table: INITIAL_TABLES[1],
  },
  {
    id: 'ord-seed-03',
    orderNumber: 'ORD-2026-0038',
    orderType: 'DINE_IN',
    status: 'CONFIRMED',
    subtotal: 1180,
    discountAmount: 0,
    taxableAmount: 1180,
    taxAmount: 59,
    totalAmount: 1239,
    customerNotes: 'Table T-03',
    createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    table: INITIAL_TABLES[2],
  },
];

export const INITIAL_BILLS: Bill[] = [];

/**
 * Self-contained Mock Storage Engine
 * Keeps realistic state in localStorage for live demo interactivity
 */
class MockStore {
  private getStorage<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val));
    } catch (e) {
      console.warn('MockStore write error:', e);
    }
  }

  public resetToDefaults(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('MockStore reset error:', e);
    }
  }

  public clearCatalog(): void {
    if (typeof window === 'undefined') return;
    this.setStorage('catalog_cleared', true);
    this.setStorage('categories', []);
    this.setStorage('products', []);
    this.setStorage('addons', []);
  }

  public clearAllDemoData(): void {
    if (typeof window === 'undefined') return;
    this.setStorage('catalog_cleared', true);
    this.setStorage('categories', []);
    this.setStorage('products', []);
    this.setStorage('addons', []);
    this.setStorage('orders', []);
    this.setStorage('bills', []);
    this.setStorage('kitchen_tickets', []);
  }

  public loadSampleCatalog(): void {
    if (typeof window === 'undefined') return;
    this.setStorage('catalog_cleared', false);
    this.setStorage('categories', INITIAL_CATEGORIES);
    this.setStorage('products', INITIAL_PRODUCTS);
    this.setStorage('addons', INITIAL_ADDONS);
  }

  // Categories
  public getCategories(): ProductCategory[] {
    const isCleared = this.getStorage('catalog_cleared', false);
    return this.getStorage('categories', isCleared ? [] : INITIAL_CATEGORIES);
  }

  public createCategory(name: string, description?: string, subcategories?: string[]): ProductCategory {
    const list = this.getCategories();
    const newCat: ProductCategory = {
      id: `cat-${Date.now()}`,
      name,
      description,
      displayOrder: list.length + 1,
      isActive: true,
      subcategories: subcategories && subcategories.length > 0 ? subcategories : undefined,
    };
    list.push(newCat);
    this.setStorage('categories', list);
    return newCat;
  }

  public deleteCategory(id: string): void {
    // 1. Remove category from list
    const list = this.getCategories().filter((c) => c.id !== id);
    this.setStorage('categories', list);

    // 2. Cascade delete all products in this category
    const prods = this.getProducts().filter((p) => p.category?.id !== id && (p as any).categoryId !== id);
    this.setStorage('products', prods);
  }

  public deleteSubcategory(categoryId: string, subcat: string): void {
    // 1. Remove subcategory from category
    const list = this.getCategories();
    const cat = list.find((c) => c.id === categoryId);
    if (cat && cat.subcategories) {
      cat.subcategories = cat.subcategories.filter((s) => s.trim().toLowerCase() !== subcat.trim().toLowerCase());
      this.setStorage('categories', list);
    }

    // 2. Cascade delete all products under this subcategory
    const prods = this.getProducts().filter((p) => {
      const matchCat = p.category?.id === categoryId || (p as any).categoryId === categoryId;
      const matchSub = p.subcategory && p.subcategory.trim().toLowerCase() === subcat.trim().toLowerCase();
      return !(matchCat && matchSub);
    });
    this.setStorage('products', prods);
  }

  public updateCategory(id: string, req: { name?: string; description?: string; subcategories?: string[] }): ProductCategory {
    const list = this.getCategories();
    const catIndex = list.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      throw new Error('Category not found');
    }
    const current = list[catIndex];
    const updated: ProductCategory = {
      ...current,
      name: req.name ? req.name.trim() : current.name,
      description: req.description !== undefined ? req.description : current.description,
      subcategories: req.subcategories !== undefined ? req.subcategories : current.subcategories,
    };
    list[catIndex] = updated;
    this.setStorage('categories', list);

    // Update products that reference this category
    const prods = this.getProducts().map((p) => {
      if (p.category?.id === id) {
        return { ...p, category: updated };
      }
      return p;
    });
    this.setStorage('products', prods);
    return updated;
  }

  public purgeInactiveCategories(): number {
    const list = this.getCategories();
    const prods = this.getProducts();
    const active = list.filter((c) => {
      if (c.isActive === false) {
        const hasProds = prods.some((p) => p.category?.id === c.id || (p as any).categoryId === c.id);
        return hasProds;
      }
      return true;
    });
    const purgedCount = list.length - active.length;
    this.setStorage('categories', active);
    return purgedCount;
  }

  // AddOn Categories
  public getAddOnCategories(): AddOnCategory[] {
    const isCleared = this.getStorage('catalog_cleared', false);
    const stored = this.getStorage<AddOnCategory[]>('addon_categories', isCleared ? [] : INITIAL_ADDON_CATEGORIES);

    // Auto-discover any categories from existing add-ons not in the list
    const addons = this.getAddOns();
    let updated = false;
    addons.forEach((a) => {
      const catName = a.category?.trim();
      if (catName && !stored.some((c) => c.name.toLowerCase() === catName.toLowerCase())) {
        stored.push({
          id: `aocat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: catName,
          displayOrder: stored.length + 1,
          selectionType: a.selectionType || 'SINGLE',
          minSelections: a.minSelections ?? 0,
          maxSelections: a.maxSelections ?? 3,
          isActive: true,
        });
        updated = true;
      }
    });

    if (updated) {
      this.setStorage('addon_categories', stored);
    }
    return [...stored].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }

  public createAddOnCategory(req: AddOnCategoryRequest): AddOnCategory {
    const list = this.getAddOnCategories();
    const newCat: AddOnCategory = {
      id: `aocat-${Date.now()}`,
      name: req.name.trim(),
      displayOrder: req.displayOrder ?? (list.length + 1),
      selectionType: req.selectionType || 'SINGLE',
      minSelections: req.minSelections ?? (req.selectionType === 'MULTI' ? 0 : 1),
      maxSelections: req.maxSelections ?? (req.selectionType === 'MULTI' ? 3 : 1),
      isActive: true,
    };
    list.push(newCat);
    this.setStorage('addon_categories', list);
    return newCat;
  }

  public updateAddOnCategory(id: string, req: Partial<AddOnCategoryRequest>): AddOnCategory {
    const list = this.getAddOnCategories();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Add-on category not found');
    const oldName = list[idx].name;
    const updated: AddOnCategory = {
      ...list[idx],
      name: req.name !== undefined ? req.name.trim() : list[idx].name,
      displayOrder: req.displayOrder !== undefined ? req.displayOrder : list[idx].displayOrder,
      selectionType: req.selectionType !== undefined ? req.selectionType : list[idx].selectionType,
      minSelections: req.minSelections !== undefined ? req.minSelections : list[idx].minSelections,
      maxSelections: req.maxSelections !== undefined ? req.maxSelections : list[idx].maxSelections,
    };
    list[idx] = updated;
    this.setStorage('addon_categories', list);

    if (req.name && req.name.trim() !== oldName) {
      const addons = this.getAddOns();
      addons.forEach((a) => {
        if (a.category?.toLowerCase() === oldName.toLowerCase()) {
          a.category = req.name!.trim();
        }
      });
      this.setStorage('addons', addons);
    }
    return updated;
  }

  public deleteAddOnCategory(id: string): void {
    const list = this.getAddOnCategories();
    const cat = list.find((c) => c.id === id);
    if (!cat) return;
    const updatedList = list.filter((c) => c.id !== id);
    this.setStorage('addon_categories', updatedList);

    const addons = this.getAddOns().filter((a) => a.category?.toLowerCase() !== cat.name.toLowerCase());
    this.setStorage('addons', addons);
  }

  public syncProducts(serverProducts: Product[]): void {
    if (!serverProducts || serverProducts.length === 0) return;
    const localList = this.getProducts();
    const map = new Map<string, Product>();
    localList.forEach((p) => map.set(p.id, p));
    serverProducts.forEach((p) => {
      const existing = map.get(p.id);
      map.set(p.id, { ...existing, ...p });
    });
    this.setStorage('products', Array.from(map.values()));
  }

  public updateProductRank(productId: string, displayOrder: number): Product {
    const list = this.getProducts();
    let prod = list.find((p) => p.id === productId || p.sku === productId);
    if (!prod) {
      prod = {
        id: productId,
        name: `Product (${productId})`,
        basePrice: 0,
        displayOrder,
      } as Product;
      list.push(prod);
    } else {
      prod.displayOrder = displayOrder;
    }
    this.setStorage('products', list);
    return prod;
  }

  public updateAddOnRank(addonId: string, displayOrder: number): AddOn {
    const list = this.getAddOns();
    let item = list.find((a) => a.id === addonId || a.name.toLowerCase() === addonId.toLowerCase());
    if (!item) {
      item = {
        id: addonId,
        name: addonId,
        category: 'Choice Of Extra Toppings',
        price: 0,
        displayOrder,
      } as AddOn;
      list.push(item);
    } else {
      item.displayOrder = displayOrder;
    }
    this.setStorage('addons', list);
    return item;
  }

  // Addons
  public getAddOns(): AddOn[] {
    const isCleared = this.getStorage('catalog_cleared', false);
    const list = this.getStorage('addons', isCleared ? [] : INITIAL_ADDONS);
    if (isCleared) {
      return list;
    }
    let migrated = false;

    // Migrate existing add-ons to current categories and selectionTypes
    list.forEach((a) => {
      const found = INITIAL_ADDONS.find((init) => init.id === a.id || init.name === a.name);
      if (found) {
        if (a.category !== found.category) {
          a.category = found.category;
          migrated = true;
        }
        if (a.selectionType !== found.selectionType) {
          a.selectionType = found.selectionType;
          migrated = true;
        }
      } else if (!a.category) {
        a.category = 'Choice Of Boba & Toppings';
        a.selectionType = 'MULTI';
        migrated = true;
      }
    });

    // Merge in any new initial items (like Choice Of Size) if not present
    INITIAL_ADDONS.forEach((init) => {
      if (!list.some((a) => a.id === init.id || a.name === init.name)) {
        list.push(init);
        migrated = true;
      }
    });

    if (migrated) this.setStorage('addons', list);
    return list;
  }

  public createAddOn(
    name: string,
    price: number,
    category?: string,
    selectionType?: 'SINGLE' | 'MULTI',
    minSelections?: number,
    maxSelections?: number,
    displayOrder?: number
  ): AddOn {
    const list = this.getAddOns();
    const resolvedCat = category?.trim() || 'Choice Of Size';
    const isSingle = selectionType ? selectionType === 'SINGLE' : (
      resolvedCat.toLowerCase().includes('size') ||
      resolvedCat.toLowerCase().includes('sweetness') ||
      resolvedCat.toLowerCase().includes('sugar') ||
      resolvedCat.toLowerCase().includes('ice') ||
      resolvedCat.toLowerCase().includes('milk')
    );
    const resolvedMin = minSelections !== undefined ? minSelections : (isSingle ? 1 : 0);
    const resolvedMax = maxSelections !== undefined ? maxSelections : (isSingle ? 1 : 3);

    const newAddOn: AddOn = {
      id: `addon-${Date.now()}`,
      name,
      price,
      isActive: true,
      category: resolvedCat,
      selectionType: isSingle ? 'SINGLE' : 'MULTI',
      minSelections: resolvedMin,
      maxSelections: resolvedMax,
      displayOrder: displayOrder ?? (list.filter((a) => a.category === resolvedCat).length + 1),
    };
    list.push(newAddOn);
    this.setStorage('addons', list);
    return newAddOn;
  }

  public deleteAddOn(id: string): void {
    const list = this.getAddOns().filter((a) => a.id !== id);
    this.setStorage('addons', list);
  }

  public toggleAddOn(id: string): AddOn {
    const list = this.getAddOns();
    const item = list.find((a) => a.id === id);
    if (item) {
      item.isActive = !item.isActive;
      this.setStorage('addons', list);
      return item;
    }
    throw new Error('Add-on not found');
  }

  public updateProductAddOns(productId: string, addOnIds: string[]): Product {
    const list = this.getProducts();
    const allAddons = this.getAddOns();
    const prod = list.find((p) => p.id === productId);
    if (!prod) {
      throw new Error('Product not found');
    }
    prod.addOns = allAddons.filter((a) => addOnIds.includes(a.id));
    this.setStorage('products', list);
    return prod;
  }

  // Products
  public getProducts(categoryId?: string): Product[] {
    const isCleared = this.getStorage('catalog_cleared', false);
    const list = this.getStorage('products', isCleared ? [] : INITIAL_PRODUCTS);
    if (isCleared) {
      if (!categoryId || categoryId === 'cat-all') {
        return list;
      }
      return list.filter((p) => p.category?.id === categoryId);
    }
    const allAddons = this.getAddOns();
    let updated = false;

    // Auto-heal: Ensure beverages have Choice Of Size and Boba customization
    list.forEach((p) => {
      const isBoba =
        p.name.toLowerCase().includes('tea') ||
        p.name.toLowerCase().includes('boba') ||
        p.name.toLowerCase().includes('latte') ||
        p.name.toLowerCase().includes('matcha') ||
        p.name.toLowerCase().includes('brew') ||
        p.category?.id?.includes('boba') ||
        p.category?.name?.toLowerCase().includes('boba') ||
        p.category?.name?.toLowerCase().includes('tea');

      const hasSize = p.addOns?.some((a) => a.category === 'Choice Of Size');
      if (isBoba && (!p.addOns || p.addOns.length === 0 || !hasSize)) {
        p.addOns = allAddons.filter((a) =>
          a.category === 'Choice Of Size' ||
          a.category === 'Choice Of Sweetness' ||
          a.category === 'Choice Of Boba & Toppings' ||
          a.category === 'Choice Of Ice Level' ||
          a.category === 'Choice Of Milk Base'
        );
        updated = true;
      }
    });

    if (updated) {
      this.setStorage('products', list);
    }

    if (!categoryId || categoryId === 'cat-all') {
      return list;
    }
    return list.filter((p) => p.category?.id === categoryId);
  }

  public createProduct(req: {
    name: string;
    basePrice: number;
    categoryId: string;
    description?: string;
    sku?: string;
    subcategory?: string;
    imageUrl?: string;
    badge?: string;
    dietaryType?: DietaryType;
    prepTimeMinutes?: number;
    displayOrder?: number;
    variants?: { name: string; sizeLabel?: string; price: number }[];
    addOnIds?: string[];
  }): Product {
    const list = this.getProducts();
    const categories = this.getCategories();
    const allAddons = this.getAddOns();

    const cat = categories.find((c) => c.id === req.categoryId);
    const selectedAddons = allAddons.filter((a) => req.addOnIds?.includes(a.id));
    const finalAddons = selectedAddons.length > 0 ? selectedAddons : allAddons;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: req.name,
      description: req.description,
      sku: req.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      basePrice: req.basePrice,
      isActive: true,
      category: cat,
      subcategory: req.subcategory,
      imageUrl: req.imageUrl,
      badge: req.badge,
      dietaryType: req.dietaryType || 'VEG',
      prepTimeMinutes: req.prepTimeMinutes || 5,
      displayOrder: req.displayOrder ?? (list.length + 1),
      variants: (req.variants || []).map((v, i) => ({
        id: `var-${Date.now()}-${i}`,
        name: v.name,
        sizeLabel: v.sizeLabel,
        price: v.price,
        isActive: true,
      })),
      addOns: finalAddons,
    };

    list.unshift(newProd); // place at top of catalog so newly added items are immediately prominent
    this.setStorage('products', list);
    return newProd;
  }

  public deactivateProduct(id: string): Product {
    const list = this.getProducts();
    const prod = list.find((p) => p.id === id);
    if (prod) {
      prod.isActive = !prod.isActive;
      this.setStorage('products', list);
      return prod;
    }
    throw new Error('Product not found');
  }

  public updateProduct(id: string, req: ProductRequest): Product {
    const list = this.getProducts();
    const categories = this.getCategories();
    const allAddons = this.getAddOns();

    const prodIndex = list.findIndex((p) => p.id === id);
    if (prodIndex === -1) {
      throw new Error('Product not found');
    }

    const current = list[prodIndex];
    const cat = req.categoryId ? categories.find((c) => c.id === req.categoryId) : current.category;
    let finalAddons = current.addOns;
    if (req.addOnIds) {
      finalAddons = allAddons.filter((a) => req.addOnIds!.includes(a.id));
    }

    const updatedProd: Product = {
      ...current,
      name: req.name ?? current.name,
      description: req.description !== undefined ? req.description : current.description,
      sku: req.sku ?? current.sku,
      basePrice: req.basePrice !== undefined ? req.basePrice : current.basePrice,
      category: cat,
      subcategory: req.subcategory !== undefined ? req.subcategory : current.subcategory,
      imageUrl: req.imageUrl !== undefined ? req.imageUrl : current.imageUrl,
      badge: req.badge !== undefined ? req.badge : current.badge,
      dietaryType: req.dietaryType ?? current.dietaryType,
      prepTimeMinutes: req.prepTimeMinutes ?? current.prepTimeMinutes,
      displayOrder: req.displayOrder !== undefined ? req.displayOrder : current.displayOrder,
      variants: req.variants
        ? req.variants.map((v: { name: string; sizeLabel?: string; price: number; isActive?: boolean }, i: number) => ({
            id: `var-${id}-${i}`,
            name: v.name,
            sizeLabel: v.sizeLabel,
            price: v.price,
            isActive: v.isActive ?? true,
          }))
        : current.variants,
      addOns: finalAddons,
      isActive: req.isActive !== undefined ? req.isActive : current.isActive,
    };

    list[prodIndex] = updatedProd;
    this.setStorage('products', list);
    return updatedProd;
  }

  public deleteProduct(id: string): void {
    const list = this.getProducts().filter((p) => p.id !== id);
    this.setStorage('products', list);
  }

  // Tables
  public getTables(): RestaurantTable[] {
    const list = this.getStorage('tables', INITIAL_TABLES);
    const orders = this.getOrders();
    return list.map((tbl) => {
      if (tbl.currentOrderId) {
        const order = orders.find((o) => o.id === tbl.currentOrderId);
        if (order) {
          tbl.orderNumber = order.orderNumber;
          tbl.currentTotal = order.totalAmount;
          tbl.amountDue = Math.max(0, order.totalAmount - (tbl.amountPaid || 0));
          tbl.items = (order.items || []).map((it) => ({
            name: it.productNameSnapshot,
            variant: it.variantNameSnapshot,
            quantity: it.quantity,
            lineTotal: it.lineTotalSnapshot,
          }));
          tbl.durationMinutes = Math.max(
            1,
            Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000)
          );
        }
      }
      return tbl;
    });
  }

  public createTable(tableNumber: string, capacity: number): RestaurantTable {
    const list = this.getTables();
    const newTbl: RestaurantTable = {
      id: `tbl-${Date.now()}`,
      tableNumber,
      capacity,
      status: 'AVAILABLE',
    };
    list.push(newTbl);
    this.setStorage('tables', list);
    return newTbl;
  }

  public updateTableStatus(tableId: string, status: TableStatus): RestaurantTable {
    const list = this.getTables();
    const tbl = list.find((t) => t.id === tableId);
    if (!tbl) throw new Error('Table not found');

    tbl.status = status;
    if (status === 'AVAILABLE' || status === 'CLOSED') {
      tbl.currentOrderId = undefined;
      tbl.orderNumber = undefined;
      tbl.currentTotal = undefined;
      tbl.amountPaid = undefined;
      tbl.amountDue = undefined;
      tbl.durationMinutes = undefined;
      tbl.items = undefined;
    }
    this.setStorage('tables', list);
    return tbl;
  }

  public deleteTable(tableId: string): void {
    const list = this.getTables().filter((t) => t.id !== tableId);
    this.setStorage('tables', list);
  }

  // Orders & Calculations
  public calculatePricing(items: { productId: string; variantId?: string; addOnIds: string[]; quantity: number }[]): CalculationResponse {
    const products = this.getProducts();
    const allAddons = this.getAddOns();

    let subtotal = 0;
    const calcDetails = items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const prodName = prod?.name || 'Item';
      let unitPrice = prod?.basePrice || 0;

      if (item.variantId && prod) {
        const variant = prod.variants.find((v) => v.id === item.variantId);
        if (variant) unitPrice = variant.price;
      }

      const addOnSum = item.addOnIds.reduce((sum, id) => {
        const addon = allAddons.find((a) => a.id === id);
        return sum + (addon ? addon.price : 0);
      }, 0);

      const finalUnit = unitPrice + addOnSum;
      const lineTotal = finalUnit * item.quantity;
      subtotal += lineTotal;

      const itemTax = lineTotal * 0.05; // 5% GST (CGST 2.5% + SGST 2.5%)

      return {
        productName: prodName,
        quantity: item.quantity,
        unitPrice: finalUnit,
        lineTotal,
        taxRatePercent: 5,
        isTaxInclusive: false,
        itemTax,
      };
    });

    const taxAmount = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    return {
      subtotal,
      discountAmount: 0,
      taxableAmount: subtotal,
      taxAmount,
      totalAmount,
      items: calcDetails,
    };
  }

  public createOrder(req: CreateOrderRequest): Order {
    const products = this.getProducts();
    const allAddons = this.getAddOns();
    const orders = this.getOrders();
    const tickets = this.getKitchenTickets();
    const tables = this.getTables();

    const orderSeq = 100 + orders.length + 1;
    const orderNumber = `ORD-2026-${orderSeq}`;
    const orderId = `ord-${Date.now()}`;

    let subtotal = 0;
    const orderItems = req.items.map((it, i) => {
      const prod = products.find((p) => p.id === it.productId);
      let unitPrice = prod?.basePrice || 0;
      let variantName: string | undefined;

      if (it.variantId && prod) {
        const variant = prod.variants.find((v) => v.id === it.variantId);
        if (variant) {
          unitPrice = variant.price;
          variantName = variant.name;
        }
      }

      const addOns = allAddons.filter((a) => it.addOnIds.includes(a.id));
      const addOnTotal = addOns.reduce((s, a) => s + a.price, 0);
      const lineUnit = unitPrice + addOnTotal;
      const lineTotal = lineUnit * it.quantity;
      subtotal += lineTotal;

      const addOnNames = addOns.map((a) => a.name).join(', ');
      const fullVariant = variantName
        ? (addOnNames ? `${variantName} • +${addOnNames}` : variantName)
        : (addOnNames ? `+${addOnNames}` : undefined);

      return {
        id: `oi-${orderId}-${i}`,
        productNameSnapshot: prod?.name || 'Item',
        variantNameSnapshot: fullVariant,
        quantity: it.quantity,
        unitPriceSnapshot: lineUnit,
        lineTotalSnapshot: lineTotal,
        itemNotes: it.itemNotes,
        addOns: addOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      };
    });

    const taxAmount = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    let assignedTable: RestaurantTable | undefined;
    if (req.tableId || req.tableNumber) {
      assignedTable = tables.find(
        (t) => (req.tableId && t.id === req.tableId) || (req.tableNumber && t.tableNumber === req.tableNumber)
      );
      if (assignedTable) {
        assignedTable.status = 'RUNNING';
        assignedTable.currentOrderId = orderId;
        assignedTable.orderNumber = orderNumber;
        assignedTable.durationMinutes = 1;
        assignedTable.currentTotal = totalAmount;
        assignedTable.amountPaid = 0;
        assignedTable.amountDue = totalAmount;
        assignedTable.items = orderItems.map((it) => ({
          name: it.productNameSnapshot,
          variant: it.variantNameSnapshot,
          quantity: it.quantity,
          lineTotal: it.lineTotalSnapshot,
        }));
        this.setStorage('tables', tables);
      }
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      orderType: req.orderType,
      status: 'CONFIRMED',
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      subtotal,
      discountAmount: 0,
      taxableAmount: subtotal,
      taxAmount,
      totalAmount,
      items: orderItems,
      customerNotes: req.customerNotes,
      table: assignedTable,
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    this.setStorage('orders', orders);

    // Create Kitchen Ticket (KOT)
    const ticketSeq = tickets.length + 1;
    const formattedKotNumber = `KOT #${String(ticketSeq).padStart(3, '0')}`;
    newOrder.kotNumber = formattedKotNumber;
    const newTicket: KitchenTicket = {
      id: `kt-${orderId}`,
      ticketNumber: formattedKotNumber,
      status: 'QUEUED',
      orderNumberSnapshot: orderNumber,
      orderTypeSnapshot: req.orderType,
      customerNotesSnapshot: assignedTable
        ? `Table ${assignedTable.tableNumber}${req.customerNotes ? ' • ' + req.customerNotes : ''}`
        : req.customerNotes,
      items: req.items.map((it, i) => {
        const prod = products.find((p) => p.id === it.productId);
        let variantName: string | undefined;
        if (it.variantId && prod) {
          const variant = prod.variants.find((v) => v.id === it.variantId);
          if (variant) variantName = variant.name;
        }
        const selectedAddons = allAddons.filter((a) => it.addOnIds.includes(a.id));

        return {
          id: `kti-${orderId}-${i}`,
          productNameSnapshot: prod?.name || 'Item',
          variantNameSnapshot: variantName,
          quantity: it.quantity,
          itemNotesSnapshot: it.itemNotes,
          status: 'QUEUED',
          addOns: selectedAddons.map((a) => ({ id: a.id, addOnNameSnapshot: a.name })),
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    this.setStorage('tickets', tickets);

    return newOrder;
  }

  public addOrderItems(orderId: string, req: AddOrderItemsRequest): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const products = this.getProducts();
    const allAddons = this.getAddOns();
    const tickets = this.getKitchenTickets();
    const tables = this.getTables();

    let additionalSubtotal = 0;
    const newItems = req.items.map((it, i) => {
      const prod = products.find((p) => p.id === it.productId);
      let unitPrice = prod?.basePrice || 0;
      let variantName: string | undefined;

      if (it.variantId && prod) {
        const variant = prod.variants.find((v) => v.id === it.variantId);
        if (variant) {
          unitPrice = variant.price;
          variantName = variant.name;
        }
      }

      const addOns = allAddons.filter((a) => it.addOnIds.includes(a.id));
      const addOnTotal = addOns.reduce((s, a) => s + a.price, 0);
      const lineUnit = unitPrice + addOnTotal;
      const lineTotal = lineUnit * it.quantity;
      additionalSubtotal += lineTotal;

      const addOnNames = addOns.map((a) => a.name).join(', ');
      const fullVariant = variantName
        ? (addOnNames ? `${variantName} • +${addOnNames}` : variantName)
        : (addOnNames ? `+${addOnNames}` : undefined);

      return {
        id: `oi-${orderId}-addon-${Date.now()}-${i}`,
        productNameSnapshot: prod?.name || 'Item',
        variantNameSnapshot: fullVariant,
        quantity: it.quantity,
        unitPriceSnapshot: lineUnit,
        lineTotalSnapshot: lineTotal,
        itemNotes: it.itemNotes,
        addOns: addOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      };
    });

    order.items = [...(order.items || []), ...newItems];
    order.subtotal += additionalSubtotal;
    order.taxableAmount = order.subtotal;
    order.taxAmount = Number((order.subtotal * 0.05).toFixed(2));
    order.totalAmount = Number((order.subtotal + order.taxAmount).toFixed(2));

    if (order.table) {
      const tbl = tables.find((t) => t.id === order.table?.id || t.tableNumber === order.table?.tableNumber);
      if (tbl) {
        tbl.currentTotal = order.totalAmount;
        tbl.amountDue = Math.max(0, order.totalAmount - (tbl.amountPaid || 0));
        tbl.items = order.items.map((it) => ({
          name: it.productNameSnapshot,
          variant: it.variantNameSnapshot,
          quantity: it.quantity,
          lineTotal: it.lineTotalSnapshot,
        }));
        this.setStorage('tables', tables);
      }
    }

    this.setStorage('orders', orders);

    // Supplementary KOT Ticket for added items
    const ticketSeq = tickets.length + 1;
    const formattedKotNumber = `KOT #${String(ticketSeq).padStart(3, '0')} (Round 2)`;
    order.kotNumber = formattedKotNumber;
    const addOnTicket: KitchenTicket = {
      id: `kt-${orderId}-rnd2`,
      ticketNumber: formattedKotNumber,
      status: 'QUEUED',
      orderNumberSnapshot: order.orderNumber,
      orderTypeSnapshot: order.orderType,
      customerNotesSnapshot: order.table ? `Table ${order.table.tableNumber} • Round 2 Order` : 'Add-on order',
      items: req.items.map((it, i) => {
        const prod = products.find((p) => p.id === it.productId);
        let variantName: string | undefined;
        if (it.variantId && prod) {
          const variant = prod.variants.find((v) => v.id === it.variantId);
          if (variant) variantName = variant.name;
        }
        const selectedAddons = allAddons.filter((a) => it.addOnIds.includes(a.id));

        return {
          id: `kti-add-${orderId}-${i}`,
          productNameSnapshot: prod?.name || 'Item',
          variantNameSnapshot: variantName,
          quantity: it.quantity,
          itemNotesSnapshot: it.itemNotes,
          status: 'QUEUED',
          addOns: selectedAddons.map((a) => ({ id: a.id, addOnNameSnapshot: a.name })),
        };
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tickets.unshift(addOnTicket);
    this.setStorage('tickets', tickets);

    return order;
  }

  public voidOrderItem(orderId: string, itemId: string, quantityToVoid: number, _reason: string): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const tables = this.getTables();

    if (itemId === 'cart-all') {
      order.items = [];
      order.subtotal = 0;
      order.taxableAmount = 0;
      order.taxAmount = 0;
      order.totalAmount = 0;
    } else if (order.items) {
      order.items = order.items
        .map((it) => {
          if (it.id === itemId) {
            const newQty = it.quantity - quantityToVoid;
            if (newQty <= 0) return null;
            return {
              ...it,
              quantity: newQty,
              lineTotalSnapshot: Number((it.unitPriceSnapshot * newQty).toFixed(2)),
            };
          }
          return it;
        })
        .filter((it): it is OrderItem => it !== null);

      const newSubtotal = Number(order.items.reduce((s, it) => s + it.lineTotalSnapshot, 0).toFixed(2));
      order.subtotal = newSubtotal;
      order.taxableAmount = newSubtotal;
      order.taxAmount = Number((newSubtotal * 0.05).toFixed(2));
      order.totalAmount = Number((newSubtotal + order.taxAmount).toFixed(2));
    }

    // Update associated table
    if (order.table) {
      const tbl = tables.find((t) => t.id === order.table?.id || t.tableNumber === order.table?.tableNumber);
      if (tbl) {
        tbl.currentTotal = order.totalAmount;
        tbl.amountDue = Math.max(0, order.totalAmount - (tbl.amountPaid || 0));
        const currentItems = order.items || [];
        tbl.items = currentItems.map((it) => ({
          name: it.productNameSnapshot,
          variant: it.variantNameSnapshot,
          quantity: it.quantity,
          lineTotal: it.lineTotalSnapshot,
        }));
        if (currentItems.length === 0) {
          tbl.status = 'AVAILABLE';
          tbl.currentOrderId = undefined;
          tbl.orderNumber = undefined;
        }
        this.setStorage('tables', tables);
      }
    }

    this.setStorage('orders', orders);
    return order;
  }

  public getOrders(): Order[] {
    return this.getStorage('orders', INITIAL_ORDERS);
  }

  public getOrderById(orderId: string): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    return order;
  }

  public updateOrderStatus(orderId: string, status: any): Order {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.setStorage('orders', orders);
    return order;
  }

  // Kitchen Tickets
  public getKitchenTickets(): KitchenTicket[] {
    return this.getStorage('tickets', INITIAL_TICKETS);
  }

  public updateKitchenTicketStatus(ticketId: string, status: KitchenTicketStatus, reason?: string): KitchenTicket {
    const tickets = this.getKitchenTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.status = status;
    if (reason) ticket.cancellationReason = reason;
    ticket.updatedAt = new Date().toISOString();
    // also update child items
    ticket.items.forEach((it) => {
      it.status = status;
    });

    this.setStorage('tickets', tickets);
    return ticket;
  }

  public updateKitchenTicketItemStatus(itemId: string, status: KitchenTicketStatus): KitchenTicketItem {
    const tickets = this.getKitchenTickets();
    for (const t of tickets) {
      const it = t.items.find((item) => item.id === itemId);
      if (it) {
        it.status = status;
        this.setStorage('tickets', tickets);
        return it;
      }
    }
    throw new Error('Ticket item not found');
  }

  // Bills & Payments
  public getBills(): Bill[] {
    return this.getStorage('bills', INITIAL_BILLS);
  }

  public getBillByOrderId(orderId: string): Bill | null {
    const bills = this.getBills();
    return bills.find((b) => b.order?.id === orderId) || null;
  }

  public issueBill(orderId: string, _notes?: string): Bill {
    const order = this.getOrderById(orderId);
    const existing = this.getBillByOrderId(orderId);
    if (existing) return existing;

    const bills = this.getBills();
    const tables = this.getTables();
    const invoiceNum = `INV-2026-${Math.floor(100 + bills.length + 1)}`;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      invoiceNumber: invoiceNum,
      status: 'ISSUED',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      taxableAmount: order.taxableAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      paidAmount: 0,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        table: order.table,
        items: order.items,
        customerNotes: order.customerNotes,
      },
      payments: [],
      createdAt: new Date().toISOString(),
    };

    bills.unshift(newBill);
    this.setStorage('bills', bills);

    if (order.table) {
      const tbl = tables.find((t) => t.id === order.table?.id);
      if (tbl) {
        tbl.status = 'BILL_REQUESTED';
        tbl.amountDue = order.totalAmount;
        this.setStorage('tables', tables);
      }
    }

    return newBill;
  }

  public recordPayment(
    billId: string,
    amount: number,
    method: PaymentMethod,
    idempotencyKey?: string,
    transRef?: string
  ): Payment {
    const bills = this.getBills();
    const bill = bills.find((b) => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    const payment: Payment = {
      id: `pmt-${Date.now()}`,
      paymentMethod: method,
      status: 'SUCCESSFUL',
      amount,
      transactionReference: transRef || idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    bill.payments = [...(bill.payments || []), payment];
    bill.paidAmount = Number(((bill.paidAmount || 0) + amount).toFixed(2));

    if (bill.paidAmount >= bill.totalAmount - 0.01) {
      bill.status = 'PAID';
    } else {
      bill.status = 'PARTIALLY_PAID';
    }

    this.setStorage('bills', bills);

    // Update associated order & table
    if (bill.order?.id) {
      const orders = this.getOrders();
      const order = orders.find((o) => o.id === bill.order?.id);
      if (order) {
        if (bill.status === 'PAID') {
          order.status = 'COMPLETED';
        }
        if (order.table) {
          const tables = this.getTables();
          const tbl = tables.find((t) => t.id === order.table?.id);
          if (tbl) {
            tbl.amountPaid = bill.paidAmount;
            tbl.amountDue = Math.max(0, tbl.currentTotal ? tbl.currentTotal - bill.paidAmount : 0);
            if (bill.status === 'PAID') {
              tbl.status = 'AVAILABLE';
              tbl.currentOrderId = undefined;
              tbl.orderNumber = undefined;
              tbl.currentTotal = undefined;
              tbl.amountPaid = undefined;
              tbl.amountDue = undefined;
            } else {
              tbl.status = 'PAYMENT_DUE';
            }
            this.setStorage('tables', tables);
          }
        }
        this.setStorage('orders', orders);
      }
    }

    return payment;
  }

  // Outlets
  public getOutlets(): Outlet[] {
    return this.getStorage<Outlet[]>('outlets', INITIAL_OUTLETS);
  }

  public createOutlet(req: CreateOutletRequest): Outlet {
    const outlets = this.getOutlets();
    const newId = `outlet-${Date.now()}`;
    const newOutlet: Outlet = {
      id: newId,
      name: req.name.trim(),
      code: req.code?.trim() || `OUTLET-0${outlets.length + 1}`,
      address: req.address?.trim() || 'Hyderabad, Telangana',
      phone: req.phone?.trim() || '+91 98765 00000',
      managerName: req.managerName?.trim() || 'Store Manager',
      paymentPolicy: req.paymentPolicy || 'FLEXIBLE',
    };
    const updated = [...outlets, newOutlet];
    this.setStorage('outlets', updated);
    return newOutlet;
  }

  public updatePaymentPolicy(policy: PaymentPolicy, outletId?: string): Outlet {
    const outlets = this.getOutlets();
    const targetId = outletId || outlets[0]?.id || INITIAL_OUTLET.id;
    const updated = outlets.map((o) => (o.id === targetId ? { ...o, paymentPolicy: policy } : o));
    this.setStorage('outlets', updated);
    INITIAL_OUTLET.paymentPolicy = policy;
    return updated.find((o) => o.id === targetId) || { ...INITIAL_OUTLET, paymentPolicy: policy };
  }
}

export const mockStore = new MockStore();
