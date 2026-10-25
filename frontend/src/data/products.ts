import type { Product } from '../types'

const img = (name: string) => `/images/products/${name}.jpg`

const products: Product[] = [
  // Rau củ
  { id: 1, name: 'Cà Chua Đà Lạt', price: 25000, oldPrice: 32000, unit: 'kg', step: 0.5, image: img('ca-chua'), category: 'rau-cu', origin: 'Đà Lạt', rating: 4.8, sold: 1820, tags: ['hot', 'deal'], description: 'Cà chua chín cây, vỏ mỏng, thịt dày, vị chua ngọt tự nhiên. Thích hợp nấu canh chua, sốt cà hay ăn sống.' },
  { id: 2, name: 'Cà Rốt Hữu Cơ', price: 22000, unit: 'kg', step: 0.5, image: img('ca-rot'), category: 'rau-cu', origin: 'Đà Lạt', rating: 4.7, sold: 960, tags: ['organic'], description: 'Cà rốt trồng hữu cơ, giòn ngọt, giàu beta-caroten.' },
  { id: 3, name: 'Xà Lách Lô Lô Xanh', price: 18000, unit: 'bó 300g', image: img('xa-lach'), category: 'rau-cu', origin: 'Lâm Đồng', rating: 4.6, sold: 740, tags: ['organic'], description: 'Xà lách lá xoăn, giòn mát, dùng trộn salad hoặc ăn kèm.' },
  { id: 4, name: 'Bắp Cải Trắng', price: 16000, unit: 'kg', step: 0.5, image: img('bap-cai'), category: 'rau-cu', origin: 'Đà Lạt', rating: 4.5, sold: 1100, description: 'Bắp cải cuốn chặt, lá giòn, luộc hay xào đều ngon.' },
  { id: 5, name: 'Cải Thìa (Cải Chíp)', price: 15000, unit: 'bó 500g', image: img('cai-thia'), category: 'rau-cu', origin: 'Hóc Môn', rating: 4.6, sold: 880, tags: ['organic'], description: 'Cải thìa non, thân trắng mọng nước, xào tỏi hoặc nấu canh.' },
  { id: 6, name: 'Bí Đỏ Hồ Lô', price: 19000, unit: 'kg', step: 0.5, image: img('bi-do'), category: 'rau-cu', origin: 'Gia Lai', rating: 4.5, sold: 520, description: 'Bí đỏ dẻo bùi, nấu canh, cháo hay làm súp đều hợp.' },
  { id: 7, name: 'Khoai Tây Đà Lạt', price: 28000, unit: 'kg', step: 0.5, image: img('khoai-tay'), category: 'rau-cu', origin: 'Đà Lạt', rating: 4.7, sold: 1340, description: 'Khoai tây vỏ mỏng, ruột vàng, chiên hay hầm đều bở ngon.' },
  { id: 8, name: 'Hành Tây', price: 24000, unit: 'kg', step: 0.5, image: img('hanh-tay'), category: 'rau-cu', origin: 'Đà Lạt', rating: 4.4, sold: 690, description: 'Hành tây củ chắc, thơm, dùng xào, nướng hay làm salad.' },
  { id: 9, name: 'Dưa Leo Baby', price: 20000, unit: 'kg', step: 0.5, image: img('dua-leo'), category: 'rau-cu', origin: 'Củ Chi', rating: 4.6, sold: 870, tags: ['deal'], oldPrice: 26000, description: 'Dưa leo giòn, ít hạt, ăn kèm cơm tấm hay làm salad.' },
  { id: 10, name: 'Bông Cải Xanh', price: 45000, unit: 'kg', step: 0.5, image: img('bong-cai'), category: 'rau-cu', origin: 'Đà Lạt', rating: 4.8, sold: 640, tags: ['organic'], description: 'Bông cải xanh nụ nhỏ, chắc, giàu vitamin C và chất xơ.' },
  { id: 11, name: 'Ớt Chuông 3 Màu', price: 65000, unit: 'kg', step: 0.5, image: img('ot-chuong'), category: 'rau-cu', origin: 'Đà Lạt', rating: 4.6, sold: 410, tags: ['new'], description: 'Ớt chuông xanh, đỏ, vàng giòn ngọt, đẹp mắt cho món xào.' },
  { id: 12, name: 'Nấm Bào Ngư Trắng', price: 18000, unit: 'khay 200g', image: img('nam-trang'), category: 'rau-cu', origin: 'Đồng Nai', rating: 4.5, sold: 560, description: 'Nấm tươi trắng, thân giòn, nấu lẩu hoặc xào bơ tỏi.' },
  { id: 13, name: 'Tỏi Lý Sơn', price: 120000, unit: 'kg', step: 0.5, image: img('toi'), category: 'rau-cu', origin: 'Quảng Ngãi', rating: 4.9, sold: 980, tags: ['hot'], description: 'Tỏi Lý Sơn tép nhỏ, thơm nồng đặc trưng.' },
  { id: 14, name: 'Gừng Ta', price: 40000, unit: 'kg', step: 0.5, image: img('gung'), category: 'rau-cu', origin: 'Bắc Giang', rating: 4.5, sold: 450, description: 'Gừng củ già, cay thơm, dùng kho cá, pha trà gừng.' },

  // Trái cây
  { id: 20, name: 'Táo Gala New Zealand', price: 89000, oldPrice: 105000, unit: 'kg', step: 0.5, image: img('tao'), category: 'trai-cay', origin: 'New Zealand', rating: 4.8, sold: 1560, tags: ['deal'], description: 'Táo Gala giòn ngọt, thơm nhẹ, vỏ mỏng sọc đỏ vàng.' },
  { id: 21, name: 'Chuối Già Nam Mỹ', price: 25000, unit: 'nải ~1.2kg', image: img('chuoi'), category: 'trai-cay', origin: 'Đồng Nai', rating: 4.6, sold: 2100, tags: ['hot'], description: 'Chuối già chín tự nhiên, ngọt dịu, giàu kali.' },
  { id: 22, name: 'Nho Xanh & Đen Mix', price: 135000, unit: 'hộp 500g', image: img('nho'), category: 'trai-cay', origin: 'Ninh Thuận', rating: 4.7, sold: 620, description: 'Hộp nho mix xanh và đen, chùm mọng nước, ngọt thanh.' },
  { id: 23, name: 'Dâu Tây Đà Lạt', price: 95000, oldPrice: 120000, unit: 'hộp 500g', image: img('dau-tay'), category: 'trai-cay', origin: 'Đà Lạt', rating: 4.9, sold: 880, tags: ['deal', 'hot'], description: 'Dâu tây đỏ mọng, hái trong ngày, vị chua ngọt.' },
  { id: 24, name: 'Xoài Cát Hòa Lộc', price: 75000, unit: 'kg', step: 0.5, image: img('xoai'), category: 'trai-cay', origin: 'Tiền Giang', rating: 4.9, sold: 1430, tags: ['hot'], description: 'Đặc sản Hòa Lộc, thịt vàng dẻo, ngọt lịm, hạt lép.' },
  { id: 25, name: 'Thanh Long Ruột Trắng', price: 30000, unit: 'kg', step: 0.5, image: img('thanh-long'), category: 'trai-cay', origin: 'Bình Thuận', rating: 4.5, sold: 990, description: 'Thanh long Bình Thuận quả to, vỏ đỏ tươi, ngọt mát.' },
  { id: 26, name: 'Cam Sành Vĩnh Long', price: 35000, oldPrice: 42000, unit: 'kg', step: 0.5, image: img('cam'), category: 'trai-cay', origin: 'Vĩnh Long', rating: 4.7, sold: 1650, tags: ['deal'], description: 'Cam mọng nước, ép nước hoặc ăn trực tiếp đều ngon.' },
  { id: 27, name: 'Sầu Riêng Ri6', price: 145000, unit: 'kg', step: 0.5, image: img('sau-rieng'), category: 'trai-cay', origin: 'Bến Tre', rating: 4.8, sold: 540, tags: ['hot'], description: 'Sầu riêng Ri6 cơm vàng, hạt lép, béo ngậy.' },
  { id: 28, name: 'Dưa Hấu Long An', price: 18000, unit: 'kg', step: 0.5, image: img('dua-hau'), category: 'trai-cay', origin: 'Long An', rating: 4.5, sold: 760, description: 'Dưa hấu ruột đỏ, ngọt mát, giải nhiệt mùa hè.' },
  { id: 29, name: 'Bơ Sáp 034', price: 55000, unit: 'kg', step: 0.5, image: img('bo'), category: 'trai-cay', origin: 'Đắk Lắk', rating: 4.6, sold: 480, tags: ['new'], description: 'Bơ sáp dẻo, béo, xay sinh tố hoặc ăn với sữa đặc.' },
  { id: 30, name: 'Măng Cụt Lái Thiêu', price: 65000, unit: 'kg', step: 0.5, image: img('mang-cut'), category: 'trai-cay', origin: 'Bình Dương', rating: 4.7, sold: 390, description: 'Măng cụt múi trắng, ngọt thanh, chua nhẹ.' },
  { id: 31, name: 'Vải Thiều Lục Ngạn', price: 60000, unit: 'kg', step: 0.5, image: img('vai'), category: 'trai-cay', origin: 'Bắc Giang', rating: 4.8, sold: 610, tags: ['new'], description: 'Vải thiều cùi dày, hạt nhỏ, thơm ngọt đặc trưng.' },

  // Thịt & trứng
  { id: 40, name: 'Thịt Ba Chỉ Heo', price: 135000, unit: 'kg', step: 0.5, image: img('ba-chi'), category: 'thit-trung', origin: 'CP Việt Nam', rating: 4.7, sold: 2300, tags: ['hot'], description: 'Ba chỉ tỉ lệ nạc mỡ cân đối, luộc, kho hay nướng đều ngon.' },
  { id: 41, name: 'Sườn Non Heo', price: 165000, unit: 'kg', step: 0.5, image: img('suon-heo'), category: 'thit-trung', origin: 'CP Việt Nam', rating: 4.6, sold: 1180, description: 'Sườn non nhiều thịt, nấu canh, ram mặn hay nướng.' },
  { id: 42, name: 'Thăn Bò Úc', price: 320000, oldPrice: 360000, unit: 'kg', step: 0.5, image: img('thit-bo'), category: 'thit-trung', origin: 'Úc', rating: 4.9, sold: 720, tags: ['deal'], description: 'Thăn bò Úc mềm, vân mỡ đẹp, làm bò lúc lắc, bít tết.' },
  { id: 43, name: 'Đùi Gà Góc Tư', price: 69000, unit: 'kg', step: 0.5, image: img('thit-ga'), category: 'thit-trung', origin: 'Ba Huân', rating: 4.5, sold: 1560, description: 'Đùi gà tươi, chiên, nướng hay kho gừng đều tuyệt.' },
  { id: 44, name: 'Trứng Gà Ta', price: 42000, unit: 'vỉ 10 quả', image: img('trung-ga'), category: 'thit-trung', origin: 'Ba Huân', rating: 4.8, sold: 3200, tags: ['hot'], description: 'Trứng gà ta lòng đỏ đậm, thơm béo.' },

  // Hải sản
  { id: 50, name: 'Cá Hồi Na Uy Fillet', price: 450000, oldPrice: 520000, unit: 'kg', step: 0.5, image: img('ca-hoi'), category: 'hai-san', origin: 'Na Uy', rating: 4.9, sold: 860, tags: ['deal', 'hot'], description: 'Cá hồi Na Uy tươi, thịt cam đỏ, ăn sashimi hoặc áp chảo.' },
  { id: 51, name: 'Tôm Sú Cà Mau', price: 280000, unit: 'kg', step: 0.5, image: img('tom'), category: 'hai-san', origin: 'Cà Mau', rating: 4.7, sold: 940, description: 'Tôm sú size 30-35 con/kg, thịt chắc ngọt.' },
  { id: 52, name: 'Mực Lá Phú Quốc', price: 260000, unit: 'kg', step: 0.5, image: img('muc'), category: 'hai-san', origin: 'Phú Quốc', rating: 4.6, sold: 420, tags: ['new'], description: 'Mực lá tươi, thịt dày giòn, hấp gừng hay nướng sa tế.' },

  // Sữa
  { id: 60, name: 'Sữa Tươi Thanh Trùng', price: 38000, unit: 'chai 1L', image: img('sua-tuoi'), category: 'sua', origin: 'Mộc Châu', rating: 4.8, sold: 2600, tags: ['hot'], description: 'Sữa bò tươi thanh trùng, giữ trọn vị béo tự nhiên.' },
  { id: 61, name: 'Sữa Chua Không Đường', price: 32000, unit: 'lốc 4 hũ', image: img('sua-chua'), category: 'sua', origin: 'Việt Nam', rating: 4.6, sold: 1450, description: 'Sữa chua lên men tự nhiên, tốt cho tiêu hóa.' },
  { id: 62, name: 'Phô Mai Tổng Hợp', price: 159000, unit: 'khay 300g', image: img('pho-mai'), category: 'sua', origin: 'Pháp', rating: 4.5, sold: 280, tags: ['new'], description: 'Khay phô mai nhiều loại, dùng kèm bánh mì, rượu vang.' },
  { id: 63, name: 'Bơ Lạt Nhập Khẩu', price: 89000, unit: 'thanh 200g', image: img('bo-lat'), category: 'sua', origin: 'New Zealand', rating: 4.7, sold: 510, description: 'Bơ lạt nguyên chất, dùng làm bánh hoặc áp chảo.' },
  { id: 64, name: 'Đậu Hũ Non', price: 12000, unit: 'hộp 300g', image: img('dau-hu'), category: 'sua', origin: 'Việt Nam', rating: 4.5, sold: 1320, description: 'Đậu hũ non mềm mịn, nấu canh hay chiên sả ớt.' },

  // Đồ khô & gia vị
  { id: 70, name: 'Gạo ST25 Sóc Trăng', price: 185000, oldPrice: 210000, unit: 'túi 5kg', image: img('gao'), category: 'do-kho', origin: 'Sóc Trăng', rating: 4.9, sold: 2800, tags: ['hot', 'deal'], description: 'Gạo ngon nhất thế giới, hạt dài, dẻo thơm mùi lá dứa.' },
  { id: 71, name: 'Bún Gạo Khô', price: 22000, unit: 'gói 500g', image: img('bun'), category: 'do-kho', origin: 'Bình Định', rating: 4.5, sold: 860, description: 'Bún khô sợi nhỏ, trụng nhanh, dai mềm.' },
  { id: 72, name: 'Mì Trứng Sợi Vàng', price: 6000, unit: 'gói 75g', image: img('mi-goi'), category: 'do-kho', origin: 'Việt Nam', rating: 4.4, sold: 5200, description: 'Mì trứng sợi xoăn, nấu nhanh 3 phút.' },
  { id: 73, name: 'Nước Mắm Phú Quốc 40°N', price: 75000, unit: 'chai 500ml', image: img('nuoc-mam'), category: 'do-kho', origin: 'Phú Quốc', rating: 4.8, sold: 1900, tags: ['hot'], description: 'Nước mắm cá cơm truyền thống, độ đạm 40, vị ngọt hậu.' },
  { id: 74, name: 'Dầu Ăn Thực Vật', price: 58000, unit: 'chai 1L', image: img('dau-an'), category: 'do-kho', origin: 'Việt Nam', rating: 4.5, sold: 1700, description: 'Dầu thực vật tinh luyện, chiên xào không ngấy.' },

  // Đồ uống
  { id: 80, name: 'Cà Phê Hạt Robusta', price: 165000, unit: 'túi 500g', image: img('ca-phe'), category: 'do-uong', origin: 'Buôn Ma Thuột', rating: 4.8, sold: 940, tags: ['hot'], description: 'Hạt Robusta rang mộc, đậm đắng, hậu vị sô-cô-la.' },
  { id: 81, name: 'Trà Xanh Thái Nguyên', price: 120000, unit: 'hộp 200g', image: img('tra-xanh'), category: 'do-uong', origin: 'Thái Nguyên', rating: 4.7, sold: 530, description: 'Trà búp xanh, nước vàng sánh, chát dịu ngọt hậu.' },
  { id: 82, name: 'Dừa Xiêm Bến Tre', price: 18000, unit: 'trái', image: img('nuoc-dua'), category: 'do-uong', origin: 'Bến Tre', rating: 4.8, sold: 2400, tags: ['deal'], oldPrice: 22000, description: 'Dừa xiêm gọt sẵn, nước ngọt thanh mát lạnh.' }
]

export const productById = new Map(products.map(p => [p.id, p]))

export default products
