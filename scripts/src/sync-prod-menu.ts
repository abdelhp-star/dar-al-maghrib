/**
 * sync-prod-menu.ts
 *
 * Syncs the canonical menu_items and categories data (sourced from development)
 * into whatever database DATABASE_URL points to.
 *
 * Safety features:
 *  - Full backup tables are created before any write (timestamped).
 *  - All writes run in a single transaction; any failure rolls back automatically.
 *  - Sequences for both tables are realigned after upsert.
 *  - Verification checks are run after commit; failure is reported with details.
 *
 * Idempotent: safe to run multiple times (uses INSERT … ON CONFLICT DO UPDATE).
 *
 * Usage:
 *   DATABASE_URL=<url> pnpm --filter @workspace/scripts run sync-prod-menu
 */

import pg from "pg";

const { Client } = pg;

// ---------------------------------------------------------------------------
// Canonical data (sourced from development DB on 2026-07-18)
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: 1,  name: "Breakfast",            name_ar: "الإفطار",                      name_fr: "Petit-déjeuner",                    icon: "☀️", image_url: null, sort_order: 1,  active: true },
  { id: 2,  name: "Tagines",              name_ar: "الطاجين",                      name_fr: "Tajines",                           icon: "🍲", image_url: null, sort_order: 2,  active: true },
  { id: 3,  name: "Couscous",             name_ar: "الكسكس",                       name_fr: "Couscous",                          icon: "🥘", image_url: null, sort_order: 3,  active: true },
  { id: 4,  name: "Pastilla",             name_ar: "البسطيلة",                     name_fr: "Pastilla",                          icon: "🥧", image_url: null, sort_order: 4,  active: true },
  { id: 5,  name: "Grilled Food",         name_ar: "المشويات",                     name_fr: "Grillades",                         icon: "🍖", image_url: null, sort_order: 5,  active: false },
  { id: 6,  name: "Sandwiches",           name_ar: "السندويشات",                   name_fr: "Sandwichs",                         icon: "🥪", image_url: null, sort_order: 6,  active: false },
  { id: 7,  name: "Pizza",               name_ar: "البيتزا",                       name_fr: "Pizza",                             icon: "🍕", image_url: null, sort_order: 7,  active: false },
  { id: 8,  name: "Burgers",             name_ar: "البرغر",                        name_fr: "Burgers",                           icon: "🍔", image_url: null, sort_order: 8,  active: false },
  { id: 9,  name: "Moroccan Desserts",   name_ar: "حلويات مغربية",                 name_fr: "Desserts Marocains",                icon: "🍯", image_url: null, sort_order: 9,  active: true },
  { id: 10, name: "Juices",             name_ar: "العصائر",                        name_fr: "Jus",                               icon: "🥤", image_url: null, sort_order: 10, active: false },
  { id: 11, name: "Coffee",             name_ar: "القهوة",                         name_fr: "Café",                              icon: "☕", image_url: null, sort_order: 11, active: false },
  { id: 12, name: "Tea",               name_ar: "الشاي",                           name_fr: "Thé",                               icon: "🍵", image_url: null, sort_order: 12, active: true },
  { id: 13, name: "Soft Drinks",       name_ar: "المشروبات الغازية",               name_fr: "Boissons",                          icon: "🥛", image_url: null, sort_order: 13, active: true },
  { id: 14, name: "Traditional Moroccan", name_ar: "أطباق مغربية تقليدية",        name_fr: "Plats Marocains Traditionnels",     icon: "🫕", image_url: null, sort_order: 14, active: true },
] as const;

interface MenuItem {
  id: number; name: string; name_ar: string; name_fr: string;
  description: string; description_ar: string; description_fr: string;
  price: string; image_url: string | null; category_id: number;
  available: boolean; spice_level: string; preparation_time: number;
  calories: number | null; ingredients: string;
  is_popular: boolean; is_featured: boolean; is_today_special: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 1,  name: "Chicken Tagine with Preserved Lemon & Olives",    name_ar: "طاجين الدجاج بالليمون المحفوظ والزيتون",          name_fr: "Tajine de Poulet au Citron Confit et Olives",          description: "Slow-cooked chicken in a rich saffron broth with preserved lemons and green olives",                                                                                description_ar: "دجاج مطهو ببطء في مرق زعفران غني مع الليمون المحفوظ والزيتون الأخضر",                         description_fr: "Poulet mijoté dans un bouillon de safran avec des citrons confits et des olives vertes",              price: "85.00",  image_url: "https://images.pexels.com/photos/2287524/pexels-photo-2287524.jpeg?auto=compress&cs=tinysrgb&w=800",           category_id: 2,  available: false, spice_level: "mild",   preparation_time: 40, calories: 420, ingredients: "Chicken, saffron, preserved lemon, olives, onion, garlic, ginger, cumin",                         is_popular: true,  is_featured: true,  is_today_special: true },
  { id: 2,  name: "Lamb Tagine with Prunes & Almonds",               name_ar: "طاجين الخروف بالبرقوق واللوز",                    name_fr: "Tajine d'Agneau aux Pruneaux et Amandes",             description: "Tender braised lamb with sweet prunes, toasted almonds and warm spices",                                                                                           description_ar: "لحم ضأن مطهو مع البرقوق الحلو واللوز المحمص والتوابل الدافئة",                                description_fr: "Agneau braisé avec des pruneaux sucrés, des amandes grillées et des épices chaudes",                price: "110.00", image_url: "https://images.pexels.com/photos/30068444/pexels-photo-30068444.jpeg?auto=compress&cs=tinysrgb&w=800",          category_id: 2,  available: true, spice_level: "none",   preparation_time: 50, calories: 520, ingredients: "Lamb, prunes, almonds, honey, cinnamon, saffron, onion",                                           is_popular: true,  is_featured: false, is_today_special: false },
  { id: 3,  name: "Vegetable Tagine",                                name_ar: "طاجين الخضار",                                    name_fr: "Tajine de Légumes",                                   description: "A colorful medley of seasonal vegetables slow-cooked in aromatic Moroccan spices",                                                                                description_ar: "خضار موسمية ملونة مطهوة ببطء في توابل مغربية عطرية",                                          description_fr: "Légumes de saison mijotés dans des épices marocaines aromatiques",                                  price: "65.00",  image_url: "https://fooddrinkdestinations.com/wp-content/uploads/2022/11/Carrot-And-Chickpea-Tagine-27.jpg",             category_id: 2,  available: false, spice_level: "mild",   preparation_time: 35, calories: 310, ingredients: "Carrots, zucchini, chickpeas, tomato, ras el hanout, turmeric",                                    is_popular: false, is_featured: false, is_today_special: false },
  { id: 4,  name: "Royal Couscous with Seven Vegetables",            name_ar: "الكسكس الملكي بسبع خضروات",                       name_fr: "Couscous Royal aux Sept Légumes",                     description: "Traditional Moroccan couscous topped with tender meat and seven seasonal vegetables",                                                                             description_ar: "كسكس مغربي تقليدي مع لحم طري وسبع خضروات موسمية",                                             description_fr: "Couscous marocain traditionnel garni de viande tendre et de sept légumes de saison",                price: "95.00",  image_url: "https://afrifoodnetwork.com/wp-content/uploads/2022/06/Couscous-Royale.jpg",                                  category_id: 3,  available: false, spice_level: "none",   preparation_time: 60, calories: 580, ingredients: "Semolina, lamb, chicken, carrots, turnip, zucchini, pumpkin, chickpeas, raisins",                   is_popular: true,  is_featured: true,  is_today_special: false },
  { id: 5,  name: "Chicken Pastilla",                                name_ar: "بسطيلة الدجاج",                                   name_fr: "Pastilla au Poulet",                                  description: "Flaky golden pastry filled with spiced chicken, eggs and almonds, dusted with cinnamon sugar",                                                                   description_ar: "فطيرة ذهبية هشة محشوة بالدجاج المتبل والبيض واللوز مع السكر والقرفة",                          description_fr: "Feuilleté doré croustillant garni de poulet épicé, œufs et amandes, saupoudré de sucre et cannelle",price: "75.00",  image_url: "/dishes/chicken-pastilla.jpg",                                                                                category_id: 4,  available: true, spice_level: "none",   preparation_time: 45, calories: 480, ingredients: "Phyllo dough, chicken, eggs, almonds, cinnamon, saffron, powdered sugar",                           is_popular: true,  is_featured: true,  is_today_special: true },
  { id: 6,  name: "Mixed Grill Platter",                             name_ar: "تشكيلة المشويات",                                 name_fr: "Plateau de Grillades Mixtes",                         description: "A generous platter of kefta, merguez, chicken skewers and lamb chops with harissa",                                                                              description_ar: "طبق سخي من الكفتة والمرقاز وأسياخ الدجاج وضلوع الغنم مع الهريسة",                             description_fr: "Généreux plateau de kefta, merguez, brochettes de poulet et côtelettes d'agneau avec harissa",     price: "130.00", image_url: null,                                                                                                  category_id: 5,  available: true, spice_level: "medium", preparation_time: 30, calories: 650, ingredients: "Ground beef, merguez sausage, chicken, lamb, harissa, onion, parsley",                              is_popular: true,  is_featured: true,  is_today_special: false },
  { id: 7,  name: "Moroccan Kefta Sandwich",                         name_ar: "ساندويش الكفتة المغربي",                          name_fr: "Sandwich Kefta Marocain",                             description: "Spiced ground beef kefta in a crusty baguette with tomato, onion and chermoula",                                                                                description_ar: "كفتة لحم مفروم متبلة في باغيت مقرمش مع الطماطم والبصل والشرمولة",                               description_fr: "Kefta de bœuf épicé dans une baguette croustillante avec tomate, oignon et chermoula",             price: "35.00",  image_url: null,                                                                                                  category_id: 6,  available: false, spice_level: "medium", preparation_time: 15, calories: 380, ingredients: "Ground beef, baguette, tomato, onion, chermoula, parsley, cumin",                                   is_popular: false, is_featured: false, is_today_special: false },
  { id: 8,  name: "Chebakia",                                        name_ar: "الشباكية",                                        name_fr: "Chebakia",                                            description: "Traditional sesame cookies fried and dipped in warm honey, garnished with sesame seeds",                                                                         description_ar: "حلوى سمسم تقليدية مقلية ومغمسة في العسل الدافئ مع حبات السمسم",                                 description_fr: "Biscuits traditionnels au sésame frits et trempés dans du miel chaud, garnis de graines de sésame", price: "25.00",  image_url: "https://images.pexels.com/photos/30068451/pexels-photo-30068451.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop", category_id: 9, available: true, spice_level: "none", preparation_time: 10, calories: 220, ingredients: "Flour, sesame, honey, anise, orange blossom water, cinnamon",                                       is_popular: true,  is_featured: false, is_today_special: false },
  { id: 9,  name: "Moroccan Cream Bastilla",                         name_ar: "بسطيلة بالكريمة",                                 name_fr: "Bastilla Crème",                                      description: "Sweet layered pastry filled with milk cream, almonds and rose water, dusted with cinnamon",                                                                      description_ar: "فطيرة حلوة بطبقات محشوة بكريمة الحليب واللوز وماء الورد ومرشوشة بالقرفة",                       description_fr: "Pâtisserie feuilletée sucrée garnie de crème de lait, amandes et eau de rose, saupoudrée de cannelle", price: "40.00", image_url: null,                                                                                                 category_id: 9,  available: false, spice_level: "none",   preparation_time: 20, calories: 380, ingredients: "Phyllo dough, milk cream, almonds, rose water, cinnamon, sugar",                                    is_popular: false, is_featured: true,  is_today_special: false },
  { id: 11, name: "Avocado Smoothie",                                name_ar: "عصير الأفوكادو",                                  name_fr: "Smoothie à l'Avocat",                                 description: "Creamy blended avocado with cold milk, honey and a hint of vanilla",                                                                                             description_ar: "أفوكادو كريمي ممزوج مع الحليب البارد والعسل وقليل من الفانيليا",                               description_fr: "Avocat crémeux mixé avec du lait froid, du miel et une touche de vanille",                          price: "25.00",  image_url: "/dishes/avocado-smoothie.jpg",              category_id: 10, available: true, spice_level: "none",   preparation_time: 5,  calories: 210, ingredients: "Avocado, cold milk, honey, vanilla, ice",                                                         is_popular: true,  is_featured: false, is_today_special: true },
  { id: 12, name: "Moroccan Mint Tea",                               name_ar: "الشاي المغربي بالنعناع",                          name_fr: "Thé Marocain à la Menthe",                            description: "The classic Moroccan welcome — gunpowder green tea brewed with fresh mint and honey, poured from a height",                                                      description_ar: "الترحيب المغربي الكلاسيكي - شاي أخضر مخمر بالنعناع الطازج والعسل، يصب من ارتفاع",             description_fr: "Le classique bienvenu marocain — thé vert brassé avec de la menthe fraîche et du miel, versé de hauteur", price: "12.00", image_url: "/dishes/moroccan-tea.jpg",                                                                             category_id: 12, available: true, spice_level: "none", preparation_time: 5, calories: 35, ingredients: "Gunpowder green tea, fresh mint, sugar",                                                              is_popular: true,  is_featured: true,  is_today_special: false },
  { id: 13, name: "Moroccan Spiced Coffee",                          name_ar: "القهوة المغربية المتبلة",                         name_fr: "Café Épicé Marocain",                                 description: "Rich espresso infused with cardamom, ginger and a touch of cinnamon",                                                                                            description_ar: "إسبريسو غني منقوع بالهيل والزنجبيل ولمسة من القرفة",                                          description_fr: "Espresso corsé infusé à la cardamome, au gingembre et à une touche de cannelle",                   price: "18.00",  image_url: null,                                                                                                  category_id: 11, available: true, spice_level: "none",   preparation_time: 5,  calories: 45,  ingredients: "Espresso, cardamom, ginger, cinnamon, milk foam",                                                  is_popular: false, is_featured: false, is_today_special: false },
  { id: 14, name: "Pack Ftour Beldi",                                name_ar: "الفطور المغربي",                                  name_fr: "Petit-déjeuner Marocain",                             description: "Traditional Moroccan breakfast with msemen, beghrir, honey, argan oil, olives, cheese and mint tea",                                                             description_ar: "فطور مغربي تقليدي مع المسمن والبغرير والعسل وزيت الأركان والزيتون والجبن والشاي بالنعناع",    description_fr: "Petit-déjeuner marocain traditionnel avec msemen, beghrir, miel, huile d'argan, olives, fromage et thé à la menthe", price: "55.00", image_url: "/dishes/pack-ftour-beldi.jpg", category_id: 1, available: true, spice_level: "none", preparation_time: 20, calories: 650, ingredients: "Msemen, beghrir, honey, argan oil, olives, cheese, eggs, mint tea",                               is_popular: true,  is_featured: true,  is_today_special: false },
  { id: 15, name: "Beef Tagine with Prunes",                         name_ar: "طاجين اللحم بالبرقوق",                            name_fr: "Tajine de Bœuf aux Pruneaux",                         description: "Slow-braised beef with sweet prunes, caramelised onions and warming Moroccan spices in a traditional clay pot.",                                                  description_ar: "لحم بقري مطهو ببطء مع البرقوق الحلو والبصل المكرمل والتوابل المغربية في طاجين طيني.",          description_fr: "Bœuf braisé lentement avec des pruneaux sucrés, des oignons caramélisés et des épices marocaines.", price: "95.00",  image_url: "/dishes/lamb-tagine-prunes.jpg",                      category_id: 2,  available: true,  spice_level: "mild",   preparation_time: 55, calories: 490, ingredients: "Beef, prunes, onion, ginger, cinnamon, saffron, honey, almonds",                                   is_popular: false, is_featured: false, is_today_special: false },
  { id: 16, name: "Fish Tagine",                                     name_ar: "طاجين السمك",                                     name_fr: "Tajine de Poisson",                                   description: "Tender white fish slow-cooked in chermoula marinade with potatoes, peppers and olives.",                                                                        description_ar: "سمك طري مطهو ببطء في مارينادة الشرمولة مع البطاطس والفلفل والزيتون.",                          description_fr: "Poisson blanc cuit lentement dans une marinade chermoula avec pommes de terre, poivrons et olives.", price: "105.00", image_url: "https://feastwithsafiya.com/wp-content/uploads/2022/04/moroccan-fish-tagine.jpg",                            category_id: 2,  available: false, spice_level: "mild",   preparation_time: 40, calories: 380, ingredients: "White fish, chermoula, potatoes, bell peppers, olives, tomatoes",                                  is_popular: false, is_featured: false, is_today_special: false },
  { id: 17, name: "Kefta Tagine",                                    name_ar: "طاجين الكفتة بالبيض والطماطم",                    name_fr: "Tajine de Kefta aux Œufs et Tomates",                description: "Spiced meatballs simmered in a rich tomato sauce, finished with poached eggs and fresh herbs.",                                                                  description_ar: "كرات لحم متبلة مطبوخة في صلصة طماطم غنية، مع بيض مسلوق والأعشاب الطازجة.",                     description_fr: "Boulettes de viande épicées mijotées dans une sauce tomate riche, avec œufs pochés et herbes fraîches.", price: "80.00", image_url: "https://images.unsplash.com/photo-1759216280661-e785edc3922e?w=800&auto=format&fit=crop&q=80", category_id: 2, available: false, spice_level: "medium", preparation_time: 30, calories: 420, ingredients: "Ground beef, tomatoes, eggs, cumin, paprika, parsley, onion",                                        is_popular: true,  is_featured: false, is_today_special: false },
  { id: 18, name: "Chicken Couscous",                                name_ar: "كسكس بالدجاج",                                    name_fr: "Couscous au Poulet",                                  description: "Fluffy steamed couscous topped with tender chicken and a rich golden broth with seasonal vegetables.",                                                            description_ar: "كسكس مطهو على البخار مع دجاج طري ومرق ذهبي غني والخضروات الموسمية.",                           description_fr: "Couscous vapeur moelleux avec poulet tendre et un riche bouillon doré aux légumes de saison.",      price: "75.00",  image_url: "/dishes/chicken-couscous.jpg",                                                                                category_id: 3,  available: true, spice_level: "none",   preparation_time: 50, calories: 520, ingredients: "Semolina, chicken, carrots, zucchini, turnip, chickpeas, saffron broth",                             is_popular: false, is_featured: false, is_today_special: false },
  { id: 19, name: "Beef Couscous",                                   name_ar: "كسكس باللحم البقري",                              name_fr: "Couscous au Bœuf",                                   description: "Traditional steamed couscous with slow-cooked beef and seven seasonal vegetables in a rich smen-scented broth.",                                                  description_ar: "كسكس مطهو تقليدي مع لحم بقري وسبع خضروات موسمية في مرق عطري.",                                description_fr: "Couscous vapeur traditionnel avec bœuf mijoté et sept légumes de saison dans un bouillon au smen.", price: "85.00",  image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Couscous_Royal_Marocain.JPG/960px-Couscous_Royal_Marocain.JPG", category_id: 3, available: false, spice_level: "none", preparation_time: 55, calories: 560, ingredients: "Semolina, beef, seven vegetables, chickpeas, smen, ras el hanout",                                  is_popular: false, is_featured: false, is_today_special: false },
  { id: 20, name: "Tfaya Couscous",                                  name_ar: "كسكس بالتفاية",                                   name_fr: "Couscous Tfaya",                                      description: "A sublime sweet-savoury couscous crowned with caramelised onion and raisin tfaya, tender chicken and toasted almonds.",                                           description_ar: "كسكس رائع حلو ومالح مع التفاية من البصل المكرمل والزبيب، ودجاج طري واللوز المحمص.",            description_fr: "Couscous subtilement sucré-salé surmonté de tfaya aux oignons caramélisés et raisins, poulet tendre et amandes.", price: "90.00", image_url: "https://images.pexels.com/photos/37369301/pexels-photo-37369301.jpeg?auto=compress&cs=tinysrgb&w=800", category_id: 3, available: false, spice_level: "none", preparation_time: 60, calories: 590, ingredients: "Semolina, chicken, caramelised onion, raisins, almonds, cinnamon, saffron",                           is_popular: true,  is_featured: true,  is_today_special: true },
  { id: 21, name: "Seven Vegetable Couscous",                        name_ar: "كسكس بسبع خضروات",                                name_fr: "Couscous aux Sept Légumes",                           description: "A vegetarian celebration of Moroccan flavours — seven vegetables slow-cooked over fluffy hand-rolled couscous.",                                                  description_ar: "احتفال نباتي بنكهات مغربية — سبع خضروات مطهوة ببطء فوق كسكس طري.",                             description_fr: "Une célébration végétarienne des saveurs marocaines — sept légumes mijotés sur couscous moelleux.",  price: "70.00",  image_url: "https://tasteofmaroc.com/wp-content/uploads/2017/10/couscous-hayat-2.jpg",                                    category_id: 3,  available: false, spice_level: "none",   preparation_time: 50, calories: 420, ingredients: "Semolina, carrots, zucchini, turnip, pumpkin, potato, onion, chickpeas",                              is_popular: false, is_featured: false, is_today_special: false },
  { id: 22, name: "Tangia Marrakchia",                               name_ar: "الطنجية المراكشية",                               name_fr: "Tangia Marrakchia",                                   description: "Marrakech's iconic slow-cooked lamb, sealed in an urn and buried in embers for hours until meltingly tender.",                                                    description_ar: "الطبق الأيقوني لمراكش — لحم خروف مطهو ببطء في جرة مدفونة في الجمر لساعات.",                    description_fr: "L'emblématique agneau de Marrakech, scellé dans une jarre et cuit des heures dans les braises.",   price: "120.00", image_url: "https://www.saveur.com/uploads/2023/02/28/tangia-Recipe-Saveur-01-scaled.jpg?auto=webp&width=1600&height=2000", category_id: 14, available: false, spice_level: "none", preparation_time: 360, calories: 540, ingredients: "Lamb, preserved lemon, saffron, ras el hanout, garlic, cumin, olive oil",                              is_popular: true,  is_featured: true,  is_today_special: false },
  { id: 23, name: "Rfissa",                                          name_ar: "الرفيسة",                                         name_fr: "Rfissa",                                              description: "A festive dish of shredded msemen drenched in a rich fenugreek and saffron chicken broth with lentils.",                                                         description_ar: "طبق احتفالي من المسمن المقطع المغموس في مرق دجاج غني بالحلبة والزعفران والعدس.",               description_fr: "Plat festif de msemen effilochés imbibés d'un riche bouillon de poulet au fenugrec et au safran.",  price: "85.00",  image_url: "https://tasteofmaroc.com/wp-content/uploads/2017/11/rfissa-2b-1024x678.jpg.webp",                            category_id: 14, available: true, spice_level: "none",   preparation_time: 90, calories: 580, ingredients: "Msemen, chicken, lentils, fenugreek, saffron, onion, ras el hanout",                                 is_popular: false, is_featured: false, is_today_special: false },
  { id: 24, name: "Harira",                                          name_ar: "الحريرة",                                         name_fr: "Harira",                                              description: "Morocco's beloved thick soup of tomatoes, chickpeas and lentils, perfumed with coriander, celery and lemon.",                                                    description_ar: "شوربة مغربية سميكة بالطماطم والحمص والعدس، معطرة بالكزبرة والكرفس والليمون.",                  description_fr: "La soupe bien-aimée du Maroc — tomates, pois chiches et lentilles parfumés à la coriandre et au citron.", price: "35.00", image_url: "/dishes/harira.jpg",                                                                                    category_id: 14, available: true, spice_level: "mild", preparation_time: 45, calories: 280, ingredients: "Tomatoes, chickpeas, lentils, lamb, coriander, celery, lemon, vermicelli",                              is_popular: true,  is_featured: false, is_today_special: true },
  { id: 25, name: "Seffa Medfouna",                                  name_ar: "السفة المدفونة",                                  name_fr: "Seffa Medfouna",                                      description: "Sweet steamed vermicelli or couscous dusted with powdered sugar and cinnamon, hiding slow-cooked chicken or lamb beneath.",                                       description_ar: "شعيرية أو كسكس مطهو على البخار مع السكر البودرة والقرفة، تحتها دجاج أو لحم مطهو.",             description_fr: "Vermicelles ou couscous vapeur sucrés à la cannelle, cachant dessous poulet ou agneau mijoté.",     price: "80.00",  image_url: "https://tasteofmaroc.com/wp-content/uploads/2017/11/seffa-vermicelli-picturepartners-bigstock-300x300.jpg.webp", category_id: 14, available: true, spice_level: "none", preparation_time: 60, calories: 510, ingredients: "Vermicelli, chicken or lamb, cinnamon, powdered sugar, raisins, almonds",                            is_popular: false, is_featured: false, is_today_special: false },
  { id: 26, name: "Bissara",                                         name_ar: "البيصارة",                                        name_fr: "Bessara",                                             description: "A warming fava bean soup drizzled with olive oil, cumin and paprika — a beloved Moroccan street food and winter staple.",                                         description_ar: "شوربة فول دافئة مع زيت الزيتون والكمون والبابريكا — طعام شعبي مغربي مشهور.",                   description_fr: "Soupe de fèves réconfortante arrosée d'huile d'olive, de cumin et de paprika — un classique marocain.", price: "25.00", image_url: "https://tasteofmaroc.com/wp-content/uploads/2020/10/bessara-in-chefchaouen-1024x678.jpg.webp", category_id: 14, available: true, spice_level: "mild", preparation_time: 20, calories: 220, ingredients: "Fava beans, olive oil, garlic, cumin, paprika, dried chilli",                                        is_popular: false, is_featured: false, is_today_special: false },
  { id: 27, name: "Msemen",                                          name_ar: "المسمن",                                          name_fr: "Msemen",                                              description: "Flaky square-folded Moroccan flatbread, pan-fried until golden and crispy, served with honey and argan oil.",                                                    description_ar: "خبز مغربي مربع الشكل هش، مقلي حتى يصبح ذهبياً ومقرمشاً، يقدم مع العسل وزيت الأركان.",        description_fr: "Pain marocain feuilleté carré, grillé à la poêle jusqu'à dorure, servi avec miel et huile d'argan.", price: "30.00", image_url: "/dishes/msemen.jpg", category_id: 1, available: true, spice_level: "none", preparation_time: 20, calories: 320, ingredients: "Semolina, flour, butter, oil, honey, argan oil",                                                      is_popular: true,  is_featured: false, is_today_special: false },
  { id: 28, name: "Baghrir",                                         name_ar: "البغرير",                                         name_fr: "Baghrir",                                             description: "The \"thousand-hole\" semolina pancake — spongy, golden and delicate, soaked in honey-butter and served warm.",                                                   description_ar: "فطيرة السميد ذات الألف ثقب — إسفنجية وذهبية ورقيقة، مغموسة بزبدة العسل وتقدم دافئة.",        description_fr: "La crêpe semoule aux «mille trous» — spongieuse, dorée et délicate, imbibée de beurre au miel.",   price: "28.00",  image_url: "/dishes/baghrir.jpg",          category_id: 1,  available: true, spice_level: "none",   preparation_time: 15, calories: 280, ingredients: "Fine semolina, yeast, salt, honey, butter",                                                        is_popular: false, is_featured: true,  is_today_special: false },
  { id: 29, name: "Harcha",                                          name_ar: "الهرشة",                                          name_fr: "Harcha",                                              description: "A rustic Moroccan semolina bread with a golden crust and soft crumb, traditionally served with olive oil and honey.",                                             description_ar: "خبز سميد مغربي بقشرة ذهبية وفتات طري، يقدم تقليدياً مع زيت الزيتون والعسل.",                  description_fr: "Pain semoule rustique marocain à croûte dorée et mie tendre, servi avec huile d'olive et miel.",    price: "25.00",  image_url: "/dishes/harcha.jpg",             category_id: 1,  available: true, spice_level: "none",   preparation_time: 15, calories: 260, ingredients: "Coarse semolina, butter, milk, baking powder, salt, sugar",                                        is_popular: false, is_featured: false, is_today_special: false },
  { id: 30, name: "Seafood Pastilla",                                name_ar: "بسطيلة البحرية",                                  name_fr: "Pastilla aux Fruits de Mer",                          description: "Golden flaky pastry filled with spiced shrimp, fish and vermicelli in a creamy chermoula sauce.",                                                                description_ar: "فطيرة ذهبية هشة محشوة بالجمبري والسمك والشعيرية في صلصة شرمولة كريمية.",                       description_fr: "Feuilleté doré croustillant garni de crevettes, poisson et vermicelles dans une sauce chermoula crémeuse.", price: "85.00", image_url: "https://marocmama.com/wp-content/uploads/2021/01/Topview-of-Moroccan-Seafood-Bastilla.jpg", category_id: 4, available: true, spice_level: "mild", preparation_time: 45, calories: 460, ingredients: "Phyllo dough, shrimp, fish, vermicelli, chermoula, cream, parsley",                                  is_popular: false, is_featured: false, is_today_special: false },
  { id: 31, name: "Kaab El Ghazal",                                  name_ar: "كعب الغزال",                                      name_fr: "Kaab El Ghazal",                                      description: "Crescent-shaped almond pastries filled with orange blossom-scented marzipan, dipped in white icing — the gazelle's horn.",                                       description_ar: "معجنات على شكل هلال محشوة بمرزبان معطر بماء الزهر، مغموسة في الغلاسة البيضاء.",               description_fr: "Pâtisseries en croissant remplies de massepain à la fleur d'oranger, trempées dans un glaçage blanc.", price: "30.00", image_url: "/dishes/kaab-el-ghazal.jpg",                                               category_id: 9, available: true, spice_level: "none", preparation_time: 30, calories: 240, ingredients: "Flour, almond paste, orange blossom water, powdered sugar, butter",                                  is_popular: true,  is_featured: false, is_today_special: false },
  { id: 32, name: "Sellou",                                          name_ar: "السلو",                                           name_fr: "Sellou",                                              description: "A dense, sweet Moroccan energy mix of toasted flour, sesame seeds, almonds and honey — served especially at Ramadan.",                                            description_ar: "مزيج مغربي كثيف وحلو من الدقيق المحمص وبذور السمسم واللوز والعسل — يقدم في رمضان.",           description_fr: "Mélange marocain dense et sucré de farine grillée, sésame, amandes et miel — servi surtout au Ramadan.", price: "25.00", image_url: "https://tasteofmaroc.com/wp-content/uploads/2018/05/sellou-picturepartners-bigstock-Traditional-Moroccan-dish-with-124901411-1-1024x682.jpg.webp", category_id: 9, available: true, spice_level: "none", preparation_time: 10, calories: 320, ingredients: "Toasted flour, sesame, almonds, honey, anise, cinnamon",                                           is_popular: false, is_featured: false, is_today_special: false },
  { id: 41, name: "Prestige Moroccan Plate",                          name_ar: "طبق مغربي بريستيج",                               name_fr: "Plateau Marocain Prestige",                           description: "An elegant assortment of fine Moroccan pastries — kaab el ghazal, chebakia, mhancha, almond briouat and seasonal sweets — presented on a traditional ceramic plate.",  description_ar: "تشكيلة راقية من أجود الحلويات المغربية — كعب الغزال، الشباكية، المحنشة، بريوات اللوز وحلويات موسمية — مقدمة في طبق خزفي تقليدي.",                description_fr: "Un élégant assortiment de pâtisseries marocaines fines — kaab el ghazal, chebakia, mhancha, briouat aux amandes et douceurs de saison — présenté sur un plateau céramique traditionnel.", price: "75.00", image_url: "/dishes/prestige-moroccan-plate.jpg",          category_id: 9, available: true, spice_level: "none", preparation_time: 15, calories: 480, ingredients: "Almond paste, phyllo dough, honey, sesame, orange blossom water, rose water, cinnamon, powdered sugar, butter", is_popular: true,  is_featured: true,  is_today_special: false },
  { id: 40, name: "Soft Drinks",                                     name_ar: "المشروبات الغازية",                               name_fr: "Boissons Gazeuses",                                   description: "A selection of refreshing cold soft drinks to complement your meal.",                                                                                            description_ar: "تشكيلة من المشروبات الغازية الباردة المنعشة لمرافقة وجبتك.",                                  description_fr: "Une sélection de boissons gazeuses froides et rafraîchissantes pour accompagner votre repas.",    price: "5.00",   image_url: "/dishes/soft-drinks.jpg",                        category_id: 13, available: true,  spice_level: "none",   preparation_time: 2,   calories: 120, ingredients: "Assorted soft drinks",                                                                                 is_popular: false, is_featured: false, is_today_special: false },
  { id: 42, name: "Za3za3 Jus",                                      name_ar: "عصير الزعزاع",                                    name_fr: "Jus Za3za3",                                          description: "A vibrant Moroccan layered smoothie with avocado cream, fresh kiwi, strawberries, banana and a drizzle of chocolate, topped with crushed nuts and Oreo cookies.", description_ar: "سموذي مغربي متعدد الطبقات بكريمة الأفوكادو، الكيوي الطازج، الفراولة، الموز ورذاذ الشوكولاتة، مزين بالمكسرات المطحونة وبسكويت الأوريو.", description_fr: "Smoothie marocain en couches avec crème d'avocat, kiwi frais, fraises, banane et filet de chocolat, garni de noix concassées et de biscuits Oreo.", price: "30.00",  image_url: "/dishes/za3za3-jus.jpg",                         category_id: 13, available: true,  spice_level: "none",   preparation_time: 10,  calories: 380, ingredients: "Avocado, kiwi, strawberry, banana, chocolate sauce, crushed nuts, Oreo cookies, milk",              is_popular: true,  is_featured: false, is_today_special: false },
  { id: 33, name: "Lemon Mint Juice",                                name_ar: "عصير الليمون والنعناع",                           name_fr: "Jus de Citron à la Menthe",                           description: "Freshly squeezed lemon juice blended with fresh mint, a touch of sugar and ice — bright, cooling and refreshing.",                                               description_ar: "عصير ليمون طازج ممزوج بالنعناع الطازج ولمسة من السكر والثلج — منعش وبارد.",                    description_fr: "Jus de citron frais mixé avec menthe fraîche, un peu de sucre et glace — vif, rafraîchissant et désaltérant.", price: "20.00", image_url: "https://images.unsplash.com/photo-1763379978357-482f322c93f5?w=800&auto=format&fit=crop&q=80", category_id: 10, available: true, spice_level: "none", preparation_time: 5, calories: 80, ingredients: "Lemon juice, fresh mint, sugar, ice, water",                                                           is_popular: false, is_featured: false, is_today_special: false },
  { id: 35, name: "Chicken Tagine with Fries",                      name_ar: "طاجين الدجاج بالفريت",                            name_fr: "Tajine de Poulet aux Frites",                         description: "Traditional Moroccan chicken tagine served with crispy golden fries, cooked with authentic spices and homemade flavor.",                                          description_ar: "طاجين دجاج مغربي تقليدي يقدم مع فريت مقرمش، محضر بالتوابل المغربية الأصيلة.",                description_fr: "Tajine marocain traditionnel au poulet accompagné de frites croustillantes, préparé avec des épices authentiques.", price: "85.00",  image_url: "/dishes/chicken-tagine-fries.jpg",               category_id: 2,  available: true,  spice_level: "mild",   preparation_time: 45, calories: 520, ingredients: "Chicken, fries, onion, tomato, olive oil, saffron, cumin, paprika, coriander, olives",          is_popular: true,  is_featured: false, is_today_special: false },
  { id: 38, name: "Moroccan Couscous with Vegetables & Meat",        name_ar: "الكسكس المغربي بالخضر واللحم",                    name_fr: "Couscous Marocain aux Légumes et à la Viande",        description: "Traditional Moroccan couscous served with tender meat, seasonal vegetables and flavorful homemade broth.",                                                      description_ar: "كسكس مغربي تقليدي يقدم مع اللحم الطري والخضر الموسمية ومرق مغربي غني بالنكهات.",           description_fr: "Couscous marocain traditionnel servi avec de la viande tendre, des légumes de saison et un bouillon maison savoureux.", price: "90.00",  image_url: "/dishes/couscous-vegetables-meat.jpg",           category_id: 3,  available: true,  spice_level: "mild",   preparation_time: 60,  calories: 540, ingredients: "Couscous semolina, lamb, carrot, turnip, courgette, chickpeas, onion, tomato, saffron, ras el hanout", is_popular: true,  is_featured: false, is_today_special: false },
  { id: 39, name: "Couscous Tfaya",                                  name_ar: "الكسكس بالتفاية",                                name_fr: "Couscous Tfaya",                                      description: "Traditional Moroccan couscous topped with sweet caramelized onions, raisins and aromatic spices, served with tender meat.",                                     description_ar: "كسكس مغربي بالتفاية، مزين بالبصل المعسل والزبيب والتوابل المغربية الأصيلة ويقدم مع اللحم.", description_fr: "Couscous marocain traditionnel garni de tfaya, un mélange d'oignons caramélisés, de raisins secs et d'épices, servi avec une viande tendre.", price: "95.00",  image_url: "/dishes/couscous-tfaya.jpg",                     category_id: 3,  available: true,  spice_level: "none",   preparation_time: 60,  calories: 580, ingredients: "Couscous semolina, chicken, caramelized onions, raisins, almonds, chickpeas, saffron, cinnamon, butter", is_popular: true,  is_featured: false, is_today_special: false },
  { id: 36, name: "Lamb Tagine with Raisins & Caramelized Onions", name_ar: "طاجين الغنم بالزبيب والبصل المعسل",           name_fr: "Tajine d'Agneau aux Raisins et Oignons Caramélisés", description: "Slow-cooked Moroccan lamb tagine with sweet raisins, caramelized onions and authentic Moroccan spices.",                                                              description_ar: "طاجين غنم مغربي مطهو ببطء مع الزبيب والبصل المعسل والتوابل المغربية الأصيلة.",             description_fr: "Tajine marocain d'agneau mijoté aux raisins, oignons caramélisés et épices traditionnelles.", price: "95.00",  image_url: "/dishes/lamb-tagine-raisins-onions.jpg",         category_id: 2,  available: true,  spice_level: "mild",   preparation_time: 60,  calories: 510, ingredients: "Lamb, raisins, caramelized onions, saffron, cinnamon, ginger, butter, almonds",                    is_popular: true,  is_featured: false, is_today_special: false },
  { id: 37, name: "Moroccan Fish Tagine",                            name_ar: "طاجين السمك المغربي",                             name_fr: "Tajine de Poisson Marocain",                          description: "Traditional Moroccan fish tagine prepared with fresh fish, vegetables, preserved lemon, olives and authentic Moroccan spices.",                                  description_ar: "طاجين سمك مغربي تقليدي محضر بالسمك الطازج والخضر والليمون المصبر والزيتون والتوابل المغربية الأصيلة.", description_fr: "Tajine marocain de poisson préparé avec du poisson frais, des légumes, du citron confit, des olives et des épices marocaines.", price: "90.00",  image_url: "/dishes/moroccan-fish-tagine.jpg",               category_id: 2,  available: true,  spice_level: "mild",   preparation_time: 45,  calories: 380, ingredients: "Fish, potato, tomato, carrot, preserved lemon, olives, chermoula, coriander, garlic",            is_popular: false, is_featured: false, is_today_special: false },
  { id: 34, name: "Tangia Marrakchia",                               name_ar: "الطنجية المراكشية",                               name_fr: "Tangia Marrakchia",                                   description: "Marrakech's iconic slow-cooked lamb, sealed in a clay urn with preserved lemon, saffron and ras el hanout, cooked for hours in the embers of a hammam furnace.", description_ar: "الطبق الأيقوني لمراكش — لحم خروف مطهو ببطء في طنجية طينية مع الليمون المحفوظ والزعفران ورأس الحانوت على جمر الحمام.", description_fr: "L'emblématique plat de Marrakech — agneau cuit lentement dans une jarre en terre cuite avec citron confit, safran et ras el hanout, dans les braises d'un hammam.", price: "120.00", image_url: "/dishes/tangia-marrakchia.jpg",                   category_id: 2,  available: true,  spice_level: "mild",   preparation_time: 240, calories: 520, ingredients: "Lamb, preserved lemon, saffron, ras el hanout, garlic, cumin, olive oil, butter",               is_popular: true,  is_featured: true,  is_today_special: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return "NULL";
  return `'${v.replace(/'/g, "''")}'`;
}

function bool(v: boolean): string {
  return v ? "TRUE" : "FALSE";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL is not set");

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log("=== Dar Al Maghrib — Menu Sync ===");
  console.log(`Target: ${dbUrl.replace(/:[^:@]+@/, ":***@")}`);

  // ------------------------------------------------------------------
  // Step 1: Snapshot before state
  // ------------------------------------------------------------------
  const before = await client.query(
    "SELECT COUNT(*)::int AS cnt FROM menu_items"
  );
  const beforeCount: number = before.rows[0].cnt;

  const beforeCats = await client.query(
    "SELECT COUNT(*)::int AS cnt FROM categories"
  );
  const beforeCatCount: number = beforeCats.rows[0].cnt;

  const beforeSpecials = await client.query(
    "SELECT id, name, image_url FROM menu_items WHERE is_today_special = TRUE ORDER BY id"
  );

  console.log(`\nBEFORE: ${beforeCatCount} categories, ${beforeCount} menu_items`);
  console.log(`Before today's specials (${beforeSpecials.rows.length}):`);
  for (const r of beforeSpecials.rows) {
    console.log(`  #${r.id} ${r.name}: ${r.image_url || "(no image)"}`);
  }

  // ------------------------------------------------------------------
  // Step 2: Create timestamped backup tables
  // ------------------------------------------------------------------
  const ts = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const backupCats  = `categories_backup_${ts}`;
  const backupItems = `menu_items_backup_${ts}`;

  console.log(`\nCreating backups: ${backupCats}, ${backupItems}`);

  await client.query(
    `CREATE TABLE ${backupCats} AS SELECT * FROM categories`
  );
  await client.query(
    `CREATE TABLE ${backupItems} AS SELECT * FROM menu_items`
  );

  // Verify backup row counts
  const bkCat  = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${backupCats}`);
  const bkItem = await client.query(`SELECT COUNT(*)::int AS cnt FROM ${backupItems}`);
  if (bkCat.rows[0].cnt !== beforeCatCount || bkItem.rows[0].cnt !== beforeCount) {
    throw new Error("Backup row counts do not match live tables — aborting");
  }
  console.log(
    `Backup verified: ${bkCat.rows[0].cnt} categories, ${bkItem.rows[0].cnt} menu_items`
  );

  // ------------------------------------------------------------------
  // Step 3: Upsert inside a transaction
  // ------------------------------------------------------------------
  console.log("\nStarting sync transaction …");

  try {
    await client.query("BEGIN");

    // --- Categories ---
    for (const c of CATEGORIES) {
      await client.query(`
        INSERT INTO categories (id, name, name_ar, name_fr, icon, image_url, sort_order, active)
        VALUES (${c.id}, ${esc(c.name)}, ${esc(c.name_ar)}, ${esc(c.name_fr)},
                ${esc(c.icon)}, ${esc(c.image_url)}, ${c.sort_order}, ${bool(c.active)})
        ON CONFLICT (id) DO UPDATE SET
          name       = EXCLUDED.name,
          name_ar    = EXCLUDED.name_ar,
          name_fr    = EXCLUDED.name_fr,
          icon       = EXCLUDED.icon,
          image_url  = EXCLUDED.image_url,
          sort_order = EXCLUDED.sort_order,
          active     = EXCLUDED.active
      `);
    }
    console.log(`  Upserted ${CATEGORIES.length} categories`);

    // --- Menu items ---
    for (const m of MENU_ITEMS) {
      await client.query(`
        INSERT INTO menu_items (
          id, name, name_ar, name_fr,
          description, description_ar, description_fr,
          price, image_url, category_id,
          available, spice_level, preparation_time, calories, ingredients,
          is_popular, is_featured, is_today_special
        ) VALUES (
          ${m.id}, ${esc(m.name)}, ${esc(m.name_ar)}, ${esc(m.name_fr)},
          ${esc(m.description)}, ${esc(m.description_ar)}, ${esc(m.description_fr)},
          ${esc(m.price)}, ${esc(m.image_url)}, ${m.category_id},
          ${bool(m.available)}, ${esc(m.spice_level)}, ${m.preparation_time},
          ${m.calories ?? "NULL"}, ${esc(m.ingredients)},
          ${bool(m.is_popular)}, ${bool(m.is_featured)}, ${bool(m.is_today_special)}
        )
        ON CONFLICT (id) DO UPDATE SET
          name             = EXCLUDED.name,
          name_ar          = EXCLUDED.name_ar,
          name_fr          = EXCLUDED.name_fr,
          description      = EXCLUDED.description,
          description_ar   = EXCLUDED.description_ar,
          description_fr   = EXCLUDED.description_fr,
          price            = EXCLUDED.price,
          image_url        = EXCLUDED.image_url,
          category_id      = EXCLUDED.category_id,
          available        = EXCLUDED.available,
          spice_level      = EXCLUDED.spice_level,
          preparation_time = EXCLUDED.preparation_time,
          calories         = EXCLUDED.calories,
          ingredients      = EXCLUDED.ingredients,
          is_popular       = EXCLUDED.is_popular,
          is_featured      = EXCLUDED.is_featured,
          is_today_special = EXCLUDED.is_today_special
      `);
    }
    console.log(`  Upserted ${MENU_ITEMS.length} menu_items`);

    // Realign sequences
    await client.query(`
      SELECT setval('categories_id_seq',  (SELECT MAX(id) FROM categories));
      SELECT setval('menu_items_id_seq',  (SELECT MAX(id) FROM menu_items));
    `);
    console.log("  Sequences realigned");

    await client.query("COMMIT");
    console.log("  Transaction committed ✓");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction failed — rolled back. Restoring from backup …");

    // Restore from backup
    await client.query("DELETE FROM menu_items");
    await client.query(`INSERT INTO menu_items SELECT * FROM ${backupItems}`);
    await client.query("DELETE FROM categories");
    await client.query(`INSERT INTO categories SELECT * FROM ${backupCats}`);
    await client.query(`
      SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
      SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));
    `);
    console.error("Restore complete. Production left unchanged.");
    console.error("Error:", err);
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // Step 4: Verification
  // ------------------------------------------------------------------
  console.log("\nRunning verification checks …");
  let allPassed = true;

  // Check 4a: menu_items count = 33
  const afterItems = await client.query("SELECT COUNT(*)::int AS cnt FROM menu_items");
  const afterCount: number = afterItems.rows[0].cnt;
  const countOk = afterCount === MENU_ITEMS.length;
  console.log(`  [${countOk ? "PASS" : "FAIL"}] menu_items count: ${afterCount} (expected ${MENU_ITEMS.length})`);
  if (!countOk) allPassed = false;

  // Check 4b: today's specials have matching image_url vs canonical data
  const specials = await client.query(
    "SELECT id, name, image_url FROM menu_items WHERE is_today_special = TRUE ORDER BY id"
  );
  console.log(`  Today's specials (${specials.rows.length}):`);
  for (const row of specials.rows) {
    const canonical = MENU_ITEMS.find(m => m.id === row.id);
    const expected = canonical?.image_url ?? null;
    const match = row.image_url === expected;
    if (!match) allPassed = false;
    console.log(`    [${match ? "PASS" : "FAIL"}] #${row.id} ${row.name}: ${row.image_url || "(none)"}`);
  }

  // Check 4c: review FK on menu_item_id = 1 still intact
  const fkCheck = await client.query(
    "SELECT COUNT(*)::int AS cnt FROM reviews WHERE menu_item_id = 1"
  );
  const fkCount: number = fkCheck.rows[0].cnt;
  const fkOk = fkCount >= 0; // just ensure query doesn't error (FK means item exists)
  const item1 = await client.query("SELECT id FROM menu_items WHERE id = 1");
  const item1Exists = item1.rows.length === 1;
  console.log(`  [${item1Exists ? "PASS" : "FAIL"}] menu_item id=1 exists (reviews FK safe): ${fkCount} review(s)`);
  if (!item1Exists) allPassed = false;

  // Check 4d: no dangling category_id references
  const dangling = await client.query(`
    SELECT m.id, m.name, m.category_id
    FROM menu_items m
    LEFT JOIN categories c ON c.id = m.category_id
    WHERE c.id IS NULL
  `);
  const danglingOk = dangling.rows.length === 0;
  console.log(`  [${danglingOk ? "PASS" : "FAIL"}] No dangling category references (${dangling.rows.length} found)`);
  if (!danglingOk) allPassed = false;

  // Check 4e: category 14 exists
  const cat14 = await client.query("SELECT id, name FROM categories WHERE id = 14");
  const cat14Ok = cat14.rows.length === 1;
  console.log(`  [${cat14Ok ? "PASS" : "FAIL"}] Category 14 exists: ${cat14.rows[0]?.name ?? "(missing)"}`);
  if (!cat14Ok) allPassed = false;

  // ------------------------------------------------------------------
  // Step 5: Report
  // ------------------------------------------------------------------
  const afterCats = await client.query("SELECT COUNT(*)::int AS cnt FROM categories");
  const afterCatCount: number = afterCats.rows[0].cnt;

  // Items with no image
  const noImage = MENU_ITEMS.filter(m => !m.image_url);

  console.log("\n=== Migration Report ===");
  console.log(`BEFORE: ${beforeCatCount} categories, ${beforeCount} menu_items`);
  console.log(`AFTER:  ${afterCatCount} categories, ${afterCount} menu_items`);
  console.log(`Backup tables: ${backupCats}, ${backupItems}`);
  console.log(`\n${noImage.length} items have no image (will still show fallback image):`);
  for (const m of noImage) {
    console.log(`  #${m.id} ${m.name}`);
  }

  if (!allPassed) {
    console.error("\n❌ One or more verification checks FAILED.");
    console.error("Restoring from backup …");
    await client.query("DELETE FROM menu_items");
    await client.query(`INSERT INTO menu_items SELECT * FROM ${backupItems}`);
    await client.query("DELETE FROM categories");
    await client.query(`INSERT INTO categories SELECT * FROM ${backupCats}`);
    await client.query(`
      SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
      SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));
    `);
    console.error("Restore complete. Production left unchanged.");
    process.exit(1);
  }

  console.log("\n✅ Migration complete — all verification checks passed.");
  await client.end();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
