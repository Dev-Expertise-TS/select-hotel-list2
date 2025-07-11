'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { loadHotelData } from '../data/hotels';
import type { FilterState, Hotel } from '../types/hotel';
import Image from 'next/image';

const ITEMS_PER_PAGE = 12;

// 브랜드명을 정규화하는 함수
function normalizeBrandName(brandName: string): string {
  if (!brandName) return '기타';

  let normalized = brandName.trim();

  // 괄호 안의 내용 제거 (예: "LXR Hotels & Resorts (Hilton)" -> "LXR Hotels & Resorts")
  normalized = normalized.replace(/\s*$$[^)]*$$/g, '');

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
    const regex = new RegExp(`\\s+${suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    normalized = normalized.replace(regex, '');
  }

  // 특별한 경우들 처리
  const brandMappings: { [key: string]: string } = {
    'DoubleTree by Hilton': 'DoubleTree',
    'Hampton Inn & Suites': 'Hampton Inn',
    'Hampton Inn by Hilton': 'Hampton Inn',
    'Hilton Garden Inn': 'Hilton Garden Inn',
    'Embassy Suites by Hilton': 'Embassy Suites',
    'Homewood Suites by Hilton': 'Homewood Suites',
    'Home2 Suites by Hilton': 'Home2 Suites',
    'Tru by Hilton': 'Tru',
    'Curio Collection by Hilton': 'Curio Collection',
    'Tapestry Collection by Hilton': 'Tapestry Collection',
    'LXR Hotels & Resorts': 'LXR',
    'Waldorf Astoria': 'Waldorf Astoria',
    'Conrad': 'Conrad',

    'Marriott Hotels': 'Marriott',
    'JW Marriott': 'JW Marriott',
    'The Ritz-Carlton': 'Ritz-Carlton',
    'W Hotels': 'W Hotels',
    'The Luxury Collection': 'Luxury Collection',
    'St. Regis': 'St. Regis',
    'Le Meridien': 'Le Meridien',
    'Westin': 'Westin',
    'Sheraton': 'Sheraton',
    'Renaissance': 'Renaissance',
    'Autograph Collection': 'Autograph Collection',
    'Delta Hotels': 'Delta Hotels',
    'Marriott Executive Apartments': 'Marriott Executive Apartments',
    'Courtyard by Marriott': 'Courtyard',
    'Four Points by Sheraton': 'Four Points',
    'SpringHill Suites': 'SpringHill Suites',
    'Fairfield Inn & Suites': 'Fairfield Inn',
    'Residence Inn': 'Residence Inn',
    'TownePlace Suites': 'TownePlace Suites',
    'AC Hotels by Marriott': 'AC Hotels',
    'Aloft': 'Aloft',
    'Element': 'Element',
    'Moxy': 'Moxy',

    'Park Hyatt': 'Park Hyatt',
    'Grand Hyatt': 'Grand Hyatt',
    'Hyatt Regency': 'Hyatt Regency',
    'Hyatt Centric': 'Hyatt Centric',
    'Andaz': 'Andaz',
    'Thompson': 'Thompson',
    'Hyatt House': 'Hyatt House',
    'Hyatt Place': 'Hyatt Place',

    'InterContinental': 'InterContinental',
    'Crowne Plaza': 'Crowne Plaza',
    'Holiday Inn Express': 'Holiday Inn Express',
    'Holiday Inn': 'Holiday Inn',
    'Staybridge Suites': 'Staybridge Suites',
    'Candlewood Suites': 'Candlewood Suites',
    'Hotel Indigo': 'Hotel Indigo',
    'EVEN': 'EVEN',
    'Kimpton': 'Kimpton',
    'Regent': 'Regent',
    'Six Senses': 'Six Senses',
    'HUALUXE': 'HUALUXE',

    'Four Seasons': 'Four Seasons',
    'Mandarin Oriental': 'Mandarin Oriental',
    'Peninsula': 'Peninsula',
    'Shangri-La': 'Shangri-La',
    'Banyan Tree': 'Banyan Tree',
    'Aman': 'Aman',
    'One&Only': 'One&Only',
    'Rosewood': 'Rosewood',
    'Edition': 'Edition',

    'Sofitel': 'Sofitel',
    'Pullman': 'Pullman',
    'MGallery': 'MGallery',
    'Novotel': 'Novotel',
    'Mercure': 'Mercure',
    'Adagio': 'Adagio',
    'ibis': 'ibis',
    'ibis Styles': 'ibis Styles',
    'ibis budget': 'ibis budget',
  };

  // 매핑된 브랜드명이 있으면 사용
  for (const [key, value] of Object.entries(brandMappings)) {
    if (normalized.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return normalized.trim() || '기타';
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

  // 데이터 로드
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const data = await loadHotelData();
      setHotels(data);
      setLoading(false);
    }

    fetchData();
  }, []);

  const uniqueRegions = useMemo(() => {
    const regions = [...new Set(hotels.map((hotel) => hotel.region))];
    const filteredRegions = regions.filter((region) => region && region !== '기타');

    // 우선순위 지역 정의
    const priorityRegions = ['아시아', '북아메리카'];
    const orderedRegions: string[] = [];

    // 우선순위 지역을 먼저 추가
    priorityRegions.forEach((priority) => {
      if (filteredRegions.includes(priority)) {
        orderedRegions.push(priority);
      }
    });

    // 나머지 지역을 알파벳 순으로 추가
    const remainingRegions = filteredRegions
      .filter((region) => !priorityRegions.includes(region))
      .sort();

    orderedRegions.push(...remainingRegions);

    // "기타" 항목이 있으면 마지막에 추가
    const hasOther = regions.includes('기타') || regions.includes('') || regions.includes(null);
    if (hasOther) {
      orderedRegions.push('기타');
    }

    return orderedRegions;
  }, [hotels]);

  const regionCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    hotels.forEach((hotel) => {
      const region = hotel.region || '기타';
      counts[region] = (counts[region] || 0) + 1;
    });
    return counts;
  }, [hotels]);

  const uniqueBrands = useMemo(() => {
    // 정규화된 브랜드명으로 그룹화
    const normalizedBrandCounts: { [key: string]: number } = {};
    const brandMapping: { [key: string]: string[] } = {}; // 정규화된 브랜드 -> 원본 브랜드들

    hotels.forEach((hotel) => {
      const originalBrand = hotel.brand;
      const normalizedBrand = normalizeBrandName(originalBrand);

      normalizedBrandCounts[normalizedBrand] =
        (normalizedBrandCounts[normalizedBrand] || 0) + 1;

      if (!brandMapping[normalizedBrand]) {
        brandMapping[normalizedBrand] = [];
      }
      if (!brandMapping[normalizedBrand].includes(originalBrand)) {
        brandMapping[normalizedBrand].push(originalBrand);
      }
    });

    const brands = Object.keys(normalizedBrandCounts);

    // 인기 브랜드 우선순위 정의
    const popularBrands = [
      'Marriott',
      'Hilton',
      'Hyatt',
      'InterContinental',
      'Four Seasons',
      'Ritz-Carlton',
      'Sheraton',
      'Westin',
      'DoubleTree',
      'Crowne Plaza',
      'Holiday Inn',
      'Sofitel',
      'Novotel',
      'Mercure',
      'Radisson',
      'Best Western',
      'Accor',
    ];

    // 브랜드를 인기도 순으로 정렬
    const sortedBrands = brands.sort((a, b) => {
      // 1. 인기 브랜드 우선순위 확인
      const aIsPopular = popularBrands.some((popular) => a.includes(popular));
      const bIsPopular = popularBrands.some((popular) => b.includes(popular));

      if (aIsPopular && !bIsPopular) return -1;
      if (!aIsPopular && bIsPopular) return 1;

      // 2. 둘 다 인기 브랜드이거나 둘 다 아닌 경우, 호텔 개수로 정렬
      const countDiff = normalizedBrandCounts[b] - normalizedBrandCounts[a];
      if (countDiff !== 0) return countDiff;

      // 3. 호텔 개수가 같으면 알파벳 순
      return a.localeCompare(b);
    });

    return sortedBrands;
  }, [hotels]);

  const brandCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    hotels.forEach((hotel) => {
      const normalizedBrand = normalizeBrandName(hotel.brand);
      counts[normalizedBrand] = (counts[normalizedBrand] || 0) + 1;
    });
    return counts;
  }, [hotels]);

  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const matchesSearch =
        hotel.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        hotel.city.toLowerCase().includes(filters.search.toLowerCase()) ||
        hotel.brand.toLowerCase().includes(filters.search.toLowerCase()) ||
        hotel.nameEng.toLowerCase().includes(filters.search.toLowerCase());

      const matchesRegion =
        filters.regions.length === 0 || filters.regions.includes(hotel.region);

      // 브랜드 필터링 시 정규화된 브랜드명으로 비교
      const normalizedHotelBrand = normalizeBrandName(hotel.brand);
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
    setFilters((prev) => ({
      ...prev,
      brands: checked ? [...prev.brands, brand] : prev.brands.filter((b) => b !== brand),
    }));
    setCurrentPage(1);
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

  const handleHotelClick = (hotel: Hotel) => {
    const url = `https://select-ai-concierge-746568200185.asia-northeast3.run.app/?hotel=${encodeURIComponent(
      hotel.nameEng
    )}&id=${encodeURIComponent(hotel.paragonId)}`;
    window.location.href = url;
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
        <div className="space-y-2 max-h-96 overflow-y-auto">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            투어비스 럭셔리 셀렉트 호텔 디렉토리
          </h1>
          <p className="text-gray-600">전 세계 럭셔리 호텔을 지역과 브랜드별로 찾아보세요</p>
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
              <p className="text-gray-600">
                셀렉트 예약 혜택을 받을 수 있는 총 {filteredHotels.length}개의 호텔이
                검색되었습니다
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
              </p>
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
                  {paginatedHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className="group cursor-pointer"
                    >
                      <div className="relative mb-3">
                        <div className="relative aspect-square rounded-xl overflow-hidden">
                          <Image
                            src={hotel.image || '/placeholder.svg'}
                            alt={hotel.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-3 left-3">
                            <Badge className="bg-white text-black text-xs font-medium px-2 py-1 shadow-sm">
                              {normalizeBrandName(hotel.brand)}
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
