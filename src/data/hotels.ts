import { supabase } from '@/lib/supabase';
import type { Hotel } from '@/types/hotel';

export async function fetchHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from('hotels')
    .select('*');
  if (error) throw error;
  if (!data) return [];

  // supabase 결과를 UI에서 기대하는 Hotel 타입으로 변환
  return data.map((item: any, idx: number) => ({
    id: item.sabre_id || idx + 1,
    name: item.property_name_kor,
    brand: item.chain_eng,
    region: item.continent_kor,
    city: item.city_kor,
    country: item.country_kor,
    address: item.property_address,
    starRating: 5, // 필요시 supabase에 컬럼 추가, 없으면 기본값
    price: 0, // 필요시 supabase에 컬럼 추가, 없으면 기본값
    rating: 0, // 필요시 supabase에 컬럼 추가, 없으면 기본값
    image: item.image_1 || '', // image_1 필드를 image로 매핑
    amenities: [],
    description: '',
    popularityScore: 0,
    slug: '',
    sabreId: String(item.sabre_id),
    paragonId: '',
    nameEng: '',
    publish: true,
    continent: item.continent_kor,
    cityEng: '',
    countryEng: '',
    continentKor: item.continent_kor,
    chain: item.chain_eng,
  }));
}

// 기존 더미 데이터 및 CSV 파싱 함수 등은 모두 주석 처리 또는 삭제
