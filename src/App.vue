<template>
  <div class="app">
    <header class="header">
      <h1>🍜 TIA in Da Nang</h1>
      <p class="subtitle">다낭에서 먹은 음식들</p>
    </header>

    <main class="main-content">
      <div class="date-navigation-section">
        <div class="date-navigation">
          <button @click="goToPreviousDate" class="btn-nav" title="이전 날짜">◀</button>
          <div class="date-display">
            <input
              v-model="selectedDate"
              type="date"
              class="date-input"
            />
            <div class="date-label-wrapper">
              <span class="date-label">{{ formatDate(selectedDate) }}</span>
              <button 
                v-if="selectedDate !== getTodayDate()" 
                @click="goToToday" 
                class="btn-today"
                title="오늘로 이동"
              >
                오늘
              </button>
            </div>
          </div>
          <button @click="goToNextDate" class="btn-nav" title="다음 날짜">▶</button>
        </div>
      </div>

      <div v-if="restaurantsWithLocation.length > 0" class="map-section">
        <h2>📍 방문한 식당 위치</h2>
        <div class="map-container">
          <LMap
            ref="map"
            v-model:zoom="zoom"
            :center="mapCenter" 
            :use-global-leaflet="false"
            :options="{ zoomControl: true }"
            style="height: 100%; width: 100%;"
            @ready="onMapReady"
          >
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"
            />
            <LMarker
              v-for="(restaurant, index) in restaurantsWithLocation"
              :key="index"
              :lat-lng="[restaurant.location.lat, restaurant.location.lng]"
            >
              <LPopup>
                <div>{{ restaurant.restaurant || '식당' }}</div>
              </LPopup>
            </LMarker>
          </LMap>
        </div>
      </div>

      <div class="food-list-section">
        <h2>{{ formatDate(selectedDate) }} 먹은 음식</h2>
        <div v-if="selectedDateRestaurants.length === 0" class="empty-state">
          이 날짜에 아직 음식을 추가하지 않았습니다.
        </div>
        <div v-else class="timeline">
          <div v-for="(restaurant, restaurantIndex) in selectedDateRestaurants" :key="restaurantIndex" class="timeline-item">
            <div class="timeline-time">{{ formatTime(restaurant.addedAt) }}</div>
            <div class="timeline-content">
              <div v-if="restaurant.restaurant" class="restaurant-name">📍 {{ restaurant.restaurant }}</div>
              <div v-for="(food, foodIndex) in restaurant.foods" :key="foodIndex" class="food-item">
                <div class="food-content">
                  <div class="food-info">
                    <span class="food-name">{{ food.name }}</span>
                    <p v-if="food.description" class="food-description">{{ food.description }}</p>
                    <div v-if="food.images && food.images.length > 0" class="food-images">
                      <img
                        v-for="(image, imageIndex) in food.images"
                        :key="imageIndex"
                        :src="getImageUrl(image)"
                        :alt="`${food.name} ${imageIndex + 1}`"
                        class="food-image"
                        decoding="async"
                        @error="handleImageError"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import restaurantsData from './data/restaurants.json'

// 데이터 구조:
// [
//   {
//     date: '2024-01-01',  // YYYY-MM-DD 형식
//     restaurants: [
//       {
//         restaurant: '식당 이름',  // 선택사항 (null이면 식당 없음)
//         addedAt: '2024-01-01T00:00:00.000Z',  // ISO 형식
//         foods: [
//           {
//             name: '음식 이름',
//             description: '음식 설명',  // 선택사항
//             images: ['images/파일명1.jpg', 'images/파일명2.jpg']  // 이미지 배열
//           }
//         ]
//       }
//     ]
//   }
// ]

export default {
  name: 'App',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup
  },
  setup() {
    // 로컬 시간대의 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    const getTodayDate = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    // URL에서 날짜 읽기
    const getDateFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const dateParam = params.get('date')
      if (dateParam) {
        // 날짜 형식 검증 (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (dateRegex.test(dateParam)) {
          return dateParam
        }
      }
      return getTodayDate()
    }
    
    const selectedDate = ref(getDateFromUrl())
    
    // URL 업데이트
    const updateUrl = (date) => {
      const url = new URL(window.location)
      url.searchParams.set('date', date)
      window.history.pushState({ date }, '', url)
    }

    // 선택된 날짜의 레스토랑 목록을 반환
    const selectedDateRestaurants = computed(() => {
      const dateEntry = restaurantsData.find(entry => entry.date === selectedDate.value)
      if (!dateEntry) {
        return []
      }
      // addedAt 기준으로 정렬
      return dateEntry.restaurants.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    })

    // location 필드가 유효한 식당만 필터링
    const restaurantsWithLocation = computed(() => {
      return selectedDateRestaurants.value.filter(restaurant => {
        if (!restaurant.location) return false
        const { lat, lng } = restaurant.location
        return typeof lat === 'number' && typeof lng === 'number' && 
               !isNaN(lat) && !isNaN(lng) &&
               lat >= -90 && lat <= 90 && 
               lng >= -180 && lng <= 180
      })
    })

    // 지도 설정
    const zoom = ref(13)
    const mapCenter = computed(() => {
      if (restaurantsWithLocation.value.length > 0) {
        // 식당들의 중심점 계산
        const lats = restaurantsWithLocation.value.map(r => r.location.lat)
        const lngs = restaurantsWithLocation.value.map(r => r.location.lng)
        const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length
        const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
        return [avgLat, avgLng]
      }
      // 기본값: 다낭 중심
      return [16.0470, 108.2068]
    })

    const getImageUrl = (imagePath) => {
      // 1. http 로 시작하는 외부 이미지는 그대로 반환
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath
      }

      // 2. Base URL 가져오기
      // vite.config.js에 설정된 base 값 ('/tia-in-da-nang/')이 자동으로 들어옵니다.
      // 개발/배포 환경 모두 동일하게 적용됩니다.
      let base = import.meta.env.BASE_URL

      // 3. 경로 결합을 위해 imagePath 앞의 '/' 제거 (중복 슬래시 방지)
      const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
      
      // 4. 최종 경로 생성
      // 예: /tia-in-da-nang/ + images/IMG_8277.png
      const fullPath = `${base}${cleanPath}`

      // 5. (선택사항) 카카오톡 공유 등을 위해 절대 경로가 꼭 필요하다면 아래 로직 유지
      // 일반적인 <img src> 에서는 fullPath만 리턴해도 충분합니다.
      if (typeof window !== 'undefined' && !fullPath.startsWith('http')) {
         // 필요한 경우에만 origin을 붙임
         // return new URL(fullPath, window.location.origin).href
      }
      
      return fullPath
    }

    const handleImageError = (event) => {
      // 이미지 로드 실패 시 콘솔에 로그 출력 (디버깅용)
      console.error('이미지 로드 실패:', event.target.src)
      // 이미지 숨김 처리
      event.target.style.display = 'none'
    }

    const goToPreviousDate = () => {
      const date = new Date(selectedDate.value + 'T00:00:00')
      date.setDate(date.getDate() - 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      selectedDate.value = `${year}-${month}-${day}`
    }

    const goToNextDate = () => {
      const date = new Date(selectedDate.value + 'T00:00:00')
      date.setDate(date.getDate() + 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      selectedDate.value = `${year}-${month}-${day}`
    }
    
    const goToToday = () => {
      selectedDate.value = getTodayDate()
    }
    
    // 날짜 변경 감지하여 URL 업데이트
    watch(selectedDate, (newDate) => {
      updateUrl(newDate)
    }, { immediate: true })
    
    // 브라우저 뒤로가기/앞으로가기 처리
    onMounted(() => {
      window.addEventListener('popstate', (event) => {
        if (event.state && event.state.date) {
          selectedDate.value = event.state.date
        } else {
          const dateFromUrl = getDateFromUrl()
          selectedDate.value = dateFromUrl
        }
      })
    })

    const formatDate = (dateString) => {
      const today = getTodayDate()
      const todayDate = new Date(today + 'T00:00:00')
      const yesterdayDate = new Date(todayDate)
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`
      
      if (dateString === today) {
        return '오늘'
      } else if (dateString === yesterday) {
        return '어제'
      } else {
        const date = new Date(dateString + 'T00:00:00')
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short'
        })
      }
    }

    // addedAt에서 시간(시:분) 추출 (timezone 무시, 문자열에서 직접 추출)
    const formatTime = (addedAtString) => {
      // ISO 형식: "2026-01-11T10:35:00.000Z"
      // T와 : 사이의 시간 부분만 추출
      const match = addedAtString.match(/T(\d{2}):(\d{2})/)
      if (match) {
        return `${match[1]}:${match[2]}`
      }
      // 매칭 실패 시 기본값 반환
      return '00:00'
    }

    const onMapReady = (mapObject) => {
      mapObject.invalidateSize()
    }

    return {
      selectedDate,
      selectedDateRestaurants,
      restaurantsWithLocation,
      zoom,
      mapCenter,
      goToPreviousDate,
      goToNextDate,
      goToToday,
      getTodayDate,
      formatDate,
      formatTime,
      getImageUrl,
      handleImageError,
      onMapReady
    }
  }
}
</script>

<style scoped>
.app {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .app {
    padding: 1rem 0.75rem;
  }
}

.header {
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #888;
  font-size: 1.1rem;
}

.main-content {
  text-align: left;
}

.date-navigation-section {
  margin-bottom: 2rem;
}

.date-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

@media (prefers-color-scheme: light) {
  .date-navigation {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}

/* 모바일 반응형 스타일 */
@media (max-width: 768px) {
  .date-navigation {
    padding: 0.75rem 0.5rem;
    gap: 0.4rem;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .btn-nav {
    width: 44px;
    height: 44px;
    padding: 0.5rem;
    font-size: 1rem;
  }
  
  .date-display {
    min-width: 0;
    flex: 1 1 auto;
    gap: 0.25rem;
    overflow: hidden;
  }
  
  .date-input {
    width: 100%;
    max-width: 100%;
    font-size: 0.75rem;
    padding: 0.3rem 0.2rem;
    box-sizing: border-box;
  }
  
  .date-label {
    font-size: 0.75rem;
    text-align: center;
    word-break: keep-all;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
}

.btn-nav {
  padding: 0.75rem;
  border: 2px solid #667eea;
  border-radius: 50%;
  background: transparent;
  color: #667eea;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-nav:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.date-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
  flex: 1;
}

.date-input {
  padding: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
}

@media (prefers-color-scheme: light) {
  .date-input {
    border-color: rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.8);
  }
  
  .date-input:focus {
    border-color: #667eea;
  }
}

.date-label-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.date-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #764ba2;
}

.btn-today {
  padding: 0.25rem 0.75rem;
  border: 1px solid #667eea;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-today:hover {
  background: #667eea;
  color: white;
}

@media (max-width: 768px) {
  .date-label-wrapper {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .btn-today {
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
  }
}

.map-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

@media (prefers-color-scheme: light) {
  .map-section {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.map-section h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #667eea;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  z-index: 0;
}

.map-container :deep(.leaflet-container) {
  height: 100% !important;
  width: 100% !important;
}

@media (max-width: 768px) {
  .map-container {
    height: 300px;
  }
}

.food-list-section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

@media (prefers-color-scheme: light) {
  .food-list-section {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.food-list-section h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #667eea;
}


.empty-state {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

.timeline {
  position: relative;
  padding-left: 5rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 3.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #667eea, #764ba2);
}

@media (prefers-color-scheme: light) {
  .timeline::before {
    background: linear-gradient(to bottom, #667eea, #764ba2);
  }
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
  display: flex;
  gap: 1.5rem;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -1.5rem;
  top: 0.25rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #667eea;
  border: 2px solid rgba(255, 255, 255, 0.1);
  z-index: 1;
}

@media (prefers-color-scheme: light) {
  .timeline-item::before {
    border-color: rgba(255, 255, 255, 0.9);
  }
}

.timeline-time {
  position: absolute;
  left: -5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  white-space: nowrap;
  width: 4rem;
  text-align: right;
  padding-right: 1rem;
  top: 0.1rem;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.restaurant-name {
  font-size: 1rem;
  color: #667eea;
  margin-bottom: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 0;
}

.food-item {
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: background 0.2s;
}

.food-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.food-item:last-child {
  margin-bottom: 0;
}

@media (prefers-color-scheme: light) {
  .food-item {
    background: rgba(0, 0, 0, 0.02);
  }
  
  .food-item:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

@media (max-width: 768px) {
  .timeline {
    padding-left: 4rem;
  }

  .timeline::before {
    left: 2.5rem;
  }

  .timeline-item::before {
    left: -1.5rem;
    width: 10px;
    height: 10px;
  }

  .timeline-time {
    left: -5rem;
    font-size: 0.75rem;
    width: 3.5rem;
    padding-right: 0.5rem;
  }

  .timeline-content {
    padding-left: 0.5rem;
  }
}

.food-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.food-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.food-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: inherit;
}

.food-description {
  font-size: 0.95rem;
  color: #888;
  margin: 0.25rem 0;
  line-height: 1.5;
}

.food-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.food-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
}

@media (max-width: 768px) {
  .food-images {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .food-image {
    width: 100%;
    height: auto;
    max-width: 100%;
    display: block;
    object-fit: contain;
  }
}


</style>
