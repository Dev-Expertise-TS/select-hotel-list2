'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { fetchHotels } from '../data/hotels';
import type { FilterState, Hotel } from '../types/hotel';
import Image from 'next/image';

const ITEMS_PER_PAGE = 12;

// 브랜드명을 정규화하는 함수
function normalizeBrandName(brandName: string): string {
  if (!brandName) return '기타';

  let normalized = brandName.trim();

  // 괄호 안의 내용 제거 (예: "LXR Hotels & Resorts (Hilton)" -> "LXR Hotels & Resorts")
  normalized = normalized.replace(/\s*\([^)]*\)/g, '');

  // 쉼표 이후 내용 제거
  normalized = normalized.split(',')[0].trim();

  // 공통 접미사 제거
  const suffixesToRemove = [
    'Hotels & Resorts',
    'Hotels and Resorts',
    'International',
    'Worldwide',
    'Collection',
    'Group',
    'Hotels',
    'Resorts',
    '& Resorts',
    'and Resorts',
  ];

  for (const suffix of suffixesToRemove) {
    const regex = new RegExp(`\\s+${suffix.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i');
    normalized = normalized.replace(regex, '');
  }

  // 최종적으로 남길 브랜드 리스트
  const allowedBrands = [
    'Hilton', 'Marriott', 'Hyatt', 'InterContinental', 'Four Seasons', 'Ritz-Carlton',
    'Sheraton', 'Westin', 'Sofitel', 'Accor', 'Conrad', 'Park Hyatt', 'JW Marriott',
    'Waldorf Astoria', 'Peninsula', 'Shangri-La', 'Aman', 'Pullman', 'St. Regis', 'Mandarin Oriental'
  ];

  // 브랜드 매핑
  const brandMappings: { [key: string]: string } = {
    'Hilton': 'Hilton',
    'Conrad': 'Conrad',
    'Waldorf Astoria': 'Waldorf Astoria',
    'Marriott': 'Marriott',
    'JW Marriott': 'JW Marriott',
    'Ritz-Carlton': 'Ritz-Carlton',
    'Hyatt': 'Hyatt',
    'Park Hyatt': 'Park Hyatt',
    'InterContinental': 'InterContinental',
    'Four Seasons': 'Four Seasons',
    'Sheraton': 'Sheraton',
    'Westin': 'Westin',
    'Sofitel': 'Sofitel',
    'Accor': 'Accor',
    'Peninsula': 'Peninsula',
    'Shangri-La': 'Shangri-La',
    'Aman': 'Aman',
    'Pullman': 'Pullman',
    'St. Regis': 'St. Regis',
    'Mandarin Oriental': 'Mandarin Oriental',
  };

  // 매핑된 브랜드명이 있으면 사용
  for (const [key, value] of Object.entries(brandMappings)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // allowedBrands에 포함된 브랜드명만 남기고, 나머지는 '기타'로 분류
  if (allowedBrands.some((b) => normalized.toLowerCase() === b.toLowerCase())) {
    return allowedBrands.find((b) => normalized.toLowerCase() === b.toLowerCase())!;
  }

  return '기타';
}

// 유럽 관련 지역명 통합 함수
function normalizeRegion(region: string): string {
  if (!region) return '';
  const trimmed = region.trim();
  if (
    trimmed === '유럽' ||
    trimmed === '유럽/아시아' ||
    trimmed === '유럽, 아프리카'
  ) {
    return '유럽';
  }
  return trimmed;
}

export default function HotelDirectory() {
  const [currentPage, setCurrentPage] = useState(1);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    regions: [],
    brands: [],
    priceRange: [0, 1000],
    minRating: 0,
  });

  // 브랜드 체크박스 영역 ref
  const brandListRef = useRef<HTMLDivElement>(null);

  // 데이터 로드
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await fetchHotels();
      // 이미지가 있는 호텔만 필터링
      const hotelsWithImage = data.filter((hotel) => hotel.image);
      // 한국인이 선호하는 지역 우선순위 배열
      const priorityCities = ['오사카', '후쿠오카', '도쿄', '홋카이도', '다낭', '필리핀', '싱가폴', '터키', '태국', 'LA', '뉴욕', '호주', '대만', '중국'];
      // 우선순위 지역 호텔만 추출
      const priorityHotels = hotelsWithImage.filter(hotel => hotel.city && priorityCities.some(city => hotel.city.includes(city)));
      // 지역별로 하나씩 랜덤 추출
      const selectedByCity: { [city: string]: typeof hotelsWithImage[0] } = {};
      priorityCities.forEach(city => {
        const cityHotels = priorityHotels.filter(hotel => hotel.city && hotel.city.includes(city));
        if (cityHotels.length > 0) {
          const randomHotel = cityHotels[Math.floor(Math.random() * cityHotels.length)];
          selectedByCity[city] = randomHotel;
        }
      });
      // 첫 페이지에 중복 없는 우선순위 지역 호텔만 랜덤 순서로 노출
      const firstPageHotels = Object.values(selectedByCity);
      function shuffle<T>(array: T[]): T[] {
        return array
          .map((value) => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value);
      }
      setHotels([...shuffle(firstPageHotels), ...shuffle(hotelsWithImage.filter(hotel => !firstPageHotels.includes(hotel)))]);
      setLoading(false);
    }

    fetchData();
  }, []);

  // 지역(대륙) 필터: continentKor 기준 (유럽 통합)
  const uniqueRegions = useMemo(() => {
    const regions = [...new Set(hotels.map((hotel) => normalizeRegion(hotel.continentKor || '')))];
    return regions.filter((region) => region && region !== '');
  }, [hotels]);

  const regionCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    hotels.forEach((hotel) => {
      const region = normalizeRegion(hotel.continentKor || '');
      counts[region] = (counts[region] || 0) + 1;
    });
    return counts;
  }, [hotels]);

  // 호텔 체인 필터: normalizeBrandName 기준
  const uniqueBrands = useMemo(() => {
    const brands = [...new Set(hotels.map((hotel) => normalizeBrandName(hotel.brand || '')))].filter((brand) => brand && brand !== '');
    // 유명 브랜드 우선순위 배열
    const popularBrands = [
      'Hilton', 'Marriott', 'Hyatt', 'InterContinental', 'Four Seasons', 'Ritz-Carlton',
      'Sheraton', 'Westin', 'DoubleTree', 'Crowne Plaza', 'Holiday Inn', 'Sofitel',
      'Novotel', 'Mercure', 'Radisson', 'Best Western', 'Accor', 'Conrad', 'Park Hyatt',
      'JW Marriott', 'Waldorf Astoria', 'Peninsula', 'Shangri-La', 'Banyan Tree', 'Aman',
      'Rosewood', 'Edition', 'Pullman', 'MGallery', 'Le Meridien', 'St. Regis', 'W Hotels',
      'Autograph Collection', 'Delta Hotels', 'Courtyard', 'Four Points', 'SpringHill Suites',
      'Fairfield Inn', 'Residence Inn', 'TownePlace Suites', 'AC Hotels', 'Aloft', 'Element', 'Moxy',
      'Kimpton', 'Mandarin Oriental', 'Regent', 'Six Senses', 'HUALUXE', 'Homewood Suites', 'Tru',
      'Curio Collection', 'Tapestry Collection', 'LXR', 'Embassy Suites', 'Home2 Suites', 'Marriott Executive Apartments'
    ];
    // 유명 브랜드 먼저, 나머지는 알파벳 순
    return [
      ...popularBrands.filter((brand) => brands.includes(brand)),
      ...brands.filter((brand) => !popularBrands.includes(brand)).sort((a, b) => a.localeCompare(b))
    ];
  }, [hotels]);

  const brandCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    hotels.forEach((hotel) => {
      const brand = normalizeBrandName(hotel.brand || '');
      counts[brand] = (counts[brand] || 0) + 1;
    });
    return counts;
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        (hotel.name?.toLowerCase() || '').includes(searchLower) ||
        (hotel.nameEng?.toLowerCase() || '').includes(searchLower) ||
        (hotel.city?.toLowerCase() || '').includes(searchLower) ||
        (hotel.cityEng?.toLowerCase() || '').includes(searchLower) ||
        (hotel.country?.toLowerCase() || '').includes(searchLower) ||
        (hotel.countryEng?.toLowerCase() || '').includes(searchLower) ||
        (hotel.brand?.toLowerCase() || '').includes(searchLower) ||
        (hotel.chain?.toLowerCase() || '').includes(searchLower);

      const matchesRegion =
        filters.regions.length === 0 ||
        (hotel.continentKor && filters.regions.includes(normalizeRegion(hotel.continentKor)));

      // 브랜드 필터링 시 정규화된 브랜드명으로 비교
      const normalizedHotelBrand = normalizeBrandName(hotel.brand || '');
      const matchesBrand =
        filters.brands.length === 0 || filters.brands.includes(normalizedHotelBrand);

      const matchesPrice =
        hotel.price >= filters.priceRange[0] && hotel.price <= filters.priceRange[1];
      const matchesRating = hotel.rating >= filters.minRating;

      return matchesSearch && matchesRegion && matchesBrand && matchesPrice && matchesRating;
    });
  }, [hotels, filters]);

  const totalPages = Math.ceil(filteredHotels.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHotels = filteredHotels.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleRegionChange = (region: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      regions: checked ? [...prev.regions, region] : prev.regions.filter((r) => r !== region),
    }));
    setCurrentPage(1);
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    // 스크롤 위치 기억
    const scrollTop = brandListRef.current?.scrollTop;
    setFilters((prev) => ({
      ...prev,
      brands: checked ? [...prev.brands, brand] : prev.brands.filter((b) => b !== brand),
    }));
    // 리렌더 후 스크롤 복원
    setTimeout(() => {
      if (brandListRef.current && typeof scrollTop === 'number') {
        brandListRef.current.scrollTop = scrollTop;
      }
    }, 0);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      regions: [],
      brands: [],
      priceRange: [0, 1000],
      minRating: 0,
    });
    setCurrentPage(1);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">지역별</h3>
        <div className="space-y-2">
          {uniqueRegions.map((region) => (
            <div
              key={region}
              className="flex items-center justify-between space-x-2"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`region-${region}`}
                  checked={filters.regions.includes(region)}
                  onCheckedChange={(checked) => handleRegionChange(region, checked as boolean)}
                />
                <Label
                  htmlFor={`region-${region}`}
                  className="text-sm"
                >
                  {region ? region : '기타'}
                </Label>
              </div>
              <span className="text-xs text-gray-500">
                {regionCounts[region || '기타'] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">호텔 브랜드</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto" ref={brandListRef}>
          {uniqueBrands.map((brand) => (
            <div
              key={brand}
              className="flex items-center justify-between space-x-2"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                />
                <Label
                  htmlFor={`brand-${brand}`}
                  className="text-sm"
                >
                  {brand}
                </Label>
              </div>
              <span className="text-xs text-gray-500">{brandCounts[brand] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={clearFilters}
        variant="outline"
        className="w-full"
      >
        필터 초기화
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="flex flex-col items-center sm:flex-row sm:items-end gap-2 sm:gap-4 text-center sm:text-left mb-2"
          >
            <a href="https://luxury-select.co.kr" target="_blank" rel="noopener noreferrer">
              <Image
                src="/tourvis_select_logo.png"
                alt="Tourvis Select Logo"
                width={120}
                height={32}
                priority
                className="w-28 h-auto object-contain sm:h-full sm:max-h-[55px] sm:w-auto"
              />
            </a>
            <span
              className="text-sm font-semibold sm:text-4xl sm:font-bold text-gray-900 mt-2 sm:mt-0 flex items-center sm:self-end"
            >
              투어비스 럭셔리 셀렉트 호텔 디렉토리
            </span>
          </h1>
          <p className="text-gray-600 text-center sm:text-left">
            전 세계 럭셔리 호텔을 지역과 브랜드별로 찾아보세요.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="호텔명, 도시, 브랜드로 검색..."
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  regions: [],
                  brands: [],
                }));
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="sm:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                필터
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>필터</SheetTitle>
                <SheetDescription>원하는 조건으로 호텔을 필터링하세요</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filter */}
          <div className="hidden sm:block w-80 shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  필터
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterContent />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Summary */}
            <div className="mb-6">
              <div className="text-gray-600">
                <span className="hidden sm:inline">
                  투어스 셀렉트 혜택이 동일하게 제공되는 총
                  <span className="text-blue-700 font-bold"> {filteredHotels.length}</span>개의 호텔이 검색되었습니다.
                </span>
                <span className="inline sm:hidden">
                  투어스 셀렉트 혜택이 동일하게 제공되는<br />
                  총 <span className="text-blue-700 font-bold">{filteredHotels.length}</span>개의 호텔이 검색되었습니다.
                </span>
                {filters.regions.length > 0 && (
                  <span className="ml-2">
                    지역:{' '}
                    {filters.regions.map((region) => (
                      <Badge
                        key={region}
                        variant="secondary"
                        className="ml-1"
                      >
                        {region}
                      </Badge>
                    ))}
                  </span>
                )}
                {filters.brands.length > 0 && (
                  <span className="ml-2">
                    브랜드:{' '}
                    {filters.brands.slice(0, 3).map((brand) => (
                      <Badge
                        key={brand}
                        variant="secondary"
                        className="ml-1"
                      >
                        {brand}
                      </Badge>
                    ))}
                    {filters.brands.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="ml-1"
                      >
                        +{filters.brands.length - 3}
                      </Badge>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">호텔 데이터를 불러오는 중...</span>
              </div>
            ) : (
              <>
                {/* Hotel Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  {paginatedHotels.map((hotel, index) => (
                    <div
                      key={hotel.id}
                      className="group cursor-pointer"
                      onClick={() => {
                        const url = `https://concierge.luxury-select.co.kr/?hotel=${encodeURIComponent(
                          hotel.name
                        )}&id=${encodeURIComponent(hotel.sabreId)}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <div className="relative mb-3">
                        <div className="relative aspect-square rounded-xl overflow-hidden">
                          {hotel.image ? (
                            <Image
                              src={hotel.image}
                              alt={hotel.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              placeholder="blur"
                              blurDataURL={hotel.thumbnail || "/placeholder.svg"}
                              sizes="(max-width: 768px) 50vw, 25vw"
                              priority={index < 4}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500 text-sm">
                              이미지 준비중
                            </div>
                          )}
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-white text-black text-xs font-medium px-2 py-1 shadow-sm">
                              {normalizeBrandName(hotel.brand || '')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">
                                {hotel.name}
                              </h3>
                            </div>
                            <p className="text-gray-500 text-xs sm:text-sm truncate">
                              {hotel.city}, {hotel.country}
                            </p>
                          </div>
                        </div>

                        <div className="pt-1">
                          <p className="text-gray-500 text-xs truncate">{hotel.address}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Empty State */}
                {paginatedHotels.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <p className="text-gray-500 mb-4">검색 결과가 없습니다.</p>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                    >
                      필터 초기화
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      이전
                    </Button>

                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10 h-10 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
