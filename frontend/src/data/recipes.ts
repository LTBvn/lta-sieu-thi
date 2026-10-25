import { Recipe } from '../types'

const recipes: Recipe[] = [
  {
    id: 'canh-chua',
    name: 'Canh Chua Cá Hồi',
    image: '/images/recipes/canh-chua.jpg',
    time: '30 phút',
    servings: 4,
    description: 'Vị chua thanh của cà chua, thơm mùi rau, hợp bữa cơm gia đình.',
    ingredients: [
      { productId: 50, quantity: 0.5, note: '500g cá hồi' },
      { productId: 1, quantity: 0.5, note: '500g cà chua' },
      { productId: 73, quantity: 1 }
    ]
  },
  {
    id: 'thit-kho',
    name: 'Thịt Kho Trứng',
    image: '/images/recipes/thit-kho.jpg',
    time: '90 phút',
    servings: 4,
    description: 'Món kho tộ đậm đà, ăn với cơm trắng nóng hổi.',
    ingredients: [
      { productId: 40, quantity: 1, note: '1kg ba chỉ' },
      { productId: 44, quantity: 1, note: '10 quả trứng' },
      { productId: 82, quantity: 2, note: 'lấy nước dừa' },
      { productId: 73, quantity: 1 }
    ]
  },
  {
    id: 'bo-luc-lac',
    name: 'Bò Lúc Lắc',
    image: '/images/recipes/bo-luc-lac.jpg',
    time: '25 phút',
    servings: 3,
    description: 'Thăn bò mềm áp chảo lửa lớn, ăn kèm xà lách cà chua.',
    ingredients: [
      { productId: 42, quantity: 0.5, note: '500g thăn bò' },
      { productId: 11, quantity: 0.5 },
      { productId: 8, quantity: 0.5 },
      { productId: 3, quantity: 1 },
      { productId: 13, quantity: 0.5 }
    ]
  },
  {
    id: 'com-tam',
    name: 'Cơm Tấm Sườn',
    image: '/images/recipes/com-tam.jpg',
    time: '45 phút',
    servings: 4,
    description: 'Sườn nướng thơm lừng, đồ chua và mỡ hành kiểu Sài Gòn.',
    ingredients: [
      { productId: 41, quantity: 1, note: '1kg sườn' },
      { productId: 70, quantity: 1 },
      { productId: 9, quantity: 0.5 },
      { productId: 1, quantity: 0.5 },
      { productId: 73, quantity: 1 }
    ]
  },
  {
    id: 'goi-cuon',
    name: 'Gỏi Cuốn Tôm Thịt',
    image: '/images/recipes/goi-cuon.jpg',
    time: '40 phút',
    servings: 4,
    description: 'Món cuốn thanh mát, chấm tương đậu phộng hoặc mắm nêm.',
    ingredients: [
      { productId: 51, quantity: 0.5, note: '500g tôm' },
      { productId: 40, quantity: 0.5 },
      { productId: 71, quantity: 1 },
      { productId: 3, quantity: 1 }
    ]
  },
  {
    id: 'bun-cha',
    name: 'Bún Chả Hà Nội',
    image: '/images/recipes/bun-cha.jpg',
    time: '60 phút',
    servings: 4,
    description: 'Chả nướng than hoa thơm phức, nước chấm chua ngọt.',
    ingredients: [
      { productId: 40, quantity: 1 },
      { productId: 71, quantity: 2 },
      { productId: 3, quantity: 1 },
      { productId: 9, quantity: 0.5 },
      { productId: 13, quantity: 0.5 },
      { productId: 73, quantity: 1 }
    ]
  }
]

export default recipes
