export interface Hotel {
  id: number
  name: string
  brand: string
  region: string
  city: string
  country: string
  address: string
  starRating: number
  price: number
  rating: number
  image: string
  amenities: string[]
  description: string
  popularityScore: number
  // 기존 필드
  slug: string
  sabreId: string
  paragonId: string
  nameEng: string
  publish: boolean
  continent: string
  // 새로 추가된 필드
  cityEng?: string
  countryEng?: string
  continentKor?: string
  chain?: string
}

export interface FilterState {
  search: string
  regions: string[]
  brands: string[]
  priceRange: [number, number]
  minRating: number
}
