import type { Hotel } from "../types/hotel"

// CSV 파일에서 가져온 호텔 데이터 타입
interface CSVHotel {
  Slug: string
  ID: string
  "Paragon ID": string
  "Property Name Kor": string
  "Property Name Eng": string
  City_Kor: string
  City_Eng: string
  Country_Kor: string
  Country_Eng: string
  Address: string
  Continent_Kor: string
  Continent_Eng: string
  Chain_Eng: string
  "Image 1": string
}

// CSV 파일을 파싱하는 함수
async function parseCSV(text: string): Promise<CSVHotel[]> {
  const lines = text.split("\n")
  const headers = lines[0].split(",").map((header) => header.trim().replace(/^"|"$/g, ""))

  const hotels: CSVHotel[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue

    // CSV 파싱 (따옴표 내 쉼표 처리)
    const values: string[] = []
    let currentValue = ""
    let insideQuotes = false

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j]

      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.replace(/^"|"$/g, ""))
        currentValue = ""
      } else {
        currentValue += char
      }
    }

    values.push(currentValue.replace(/^"|"$/g, ""))

    const hotel: any = {}
    headers.forEach((header, index) => {
      if (index < values.length) {
        hotel[header] = values[index]
      }
    })

    hotels.push(hotel as CSVHotel)
  }

  return hotels
}

// CSV 데이터를 Hotel 타입으로 변환하는 함수
function convertToHotelType(csvHotels: CSVHotel[]): Hotel[] {
  return csvHotels.map((csvHotel, index) => {
    // 브랜드는 Chain_Eng 필드 사용
    const brand = csvHotel.Chain_Eng || "Independent Hotel"

    // 성급 (랜덤 생성, 실제로는 데이터에 맞게 조정 필요)
    const starRating = Math.floor(Math.random() * 3) + 3 // 3-5성급

    // 인기도 점수 계산 (브랜드, 도시, 성급 기반)
    let popularityScore = Math.random() * 5 + 5 // 기본 5-10점

    // 유명 브랜드 보너스
    const famousBrands = ["Hilton", "Marriott", "Hyatt", "InterContinental", "Ritz-Carlton", "Four Seasons"]
    if (famousBrands.some((famousBrand) => brand.includes(famousBrand))) {
      popularityScore += 2
    }

    // 성급 보너스
    popularityScore += (starRating - 3) * 0.5

    return {
      id: Number.parseInt(csvHotel.ID) || index + 1,
      name: csvHotel["Property Name Kor"],
      brand: brand,
      region: csvHotel.Continent_Kor || "기타", // 빈 값인 경우 "기타"로 설정
      city: csvHotel.City_Kor, // 한국어 도시명 사용
      country: csvHotel.Country_Kor, // 한국어 국가명 사용
      address: csvHotel.Address || `${csvHotel.City_Kor}, ${csvHotel.Country_Kor}`,
      starRating: starRating,
      price: Math.floor(Math.random() * 800) + 100, // 랜덤 가격
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0 랜덤 평점
      image: csvHotel["Image 1"] || "/placeholder.svg", // 이미지 URL
      amenities: [], // 어메니티 정보 없음
      description: `${csvHotel["Property Name Kor"]} - ${csvHotel["Property Name Eng"]}`, // 설명
      popularityScore: popularityScore,
      slug: csvHotel.Slug,
      sabreId: csvHotel.ID, // ID를 sabreId로 사용
      paragonId: csvHotel["Paragon ID"],
      nameEng: csvHotel["Property Name Eng"],
      publish: true, // 모든 호텔을 게시된 것으로 처리
      continent: csvHotel.Continent_Eng,
      // 추가 필드들
      cityEng: csvHotel.City_Eng,
      countryEng: csvHotel.Country_Eng,
      continentKor: csvHotel.Continent_Kor,
      chain: csvHotel.Chain_Eng,
    }
  })
}

// 호텔 데이터 배열
export let hotelData: Hotel[] = []

// 데이터 로딩 함수
export async function loadHotelData(): Promise<Hotel[]> {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hotel_full_small_v1_upload2-fpVR48dfnfLRzOwwkDjjly0iKepTOI.csv",
    )
    const text = await response.text()
    const csvHotels = await parseCSV(text)
    hotelData = convertToHotelType(csvHotels)

    // 인기도 순으로 정렬
    hotelData.sort((a, b) => b.popularityScore - a.popularityScore)

    return hotelData
  } catch (error) {
    console.error("Error loading hotel data:", error)
    return []
  }
}

// 데이터 로딩 시작
loadHotelData()
