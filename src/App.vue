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

      <div class="food-list-section">
        <h2>{{ formatDate(selectedDate) }} 먹은 음식</h2>
        <div v-if="selectedDateFoods.length === 0" class="empty-state">
          이 날짜에 아직 음식을 추가하지 않았습니다.
        </div>
        <ul v-else class="food-list">
          <li v-for="(food, index) in selectedDateFoods" :key="index" class="food-item">
            <div class="food-content">
              <div class="food-info">
                <span class="food-name">{{ food.name }}</span>
                <p v-if="food.description" class="food-description">{{ food.description }}</p>
                <p v-if="food.location" class="food-location">📍 {{ food.location }}</p>
                <img
                  v-if="food.image"
                  :src="getImageUrl(food.image)"
                  :alt="food.name"
                  class="food-image"
                  loading="eager"
                  decoding="async"
                  @error="handleImageError"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

// 형식:
// {
//   name: '음식 이름',
//   image: 'images/파일명.jpg',  // 선택사항
//   description: '음식 설명',  // 선택사항
//   location: '위치/가게명',  // 선택사항
//   date: '2024-01-01',  // YYYY-MM-DD 형식
//   addedAt: '2024-01-01T00:00:00.000Z'  // ISO 형식
// }
const foodsData = [
  {
    name: '곱창 쌀국수',
    image: 'images/IMG_8283.png',
    date: '2026-01-11',
    addedAt: '2026-01-11T12:00:00.000Z'
  },
  {
    name: '반세오',
    image: 'images/IMG_8285.png',
    date: '2026-01-11',
    addedAt: '2026-01-11T12:00:00.000Z'
  },
  {
    name: '코코넛 커피',
    image: 'images/IMG_8277.png',
    location: '콩 카페',
    date: '2026-01-11',
    addedAt: '2026-01-11T12:00:00.000Z'
  },
  {
    name: '코코넛 커피',
    image: 'images/IMG_8278.png',
    location: '콩 카페',
    date: '2026-01-11',
    addedAt: '2026-01-11T12:00:00.000Z'
  },
  {
    name: '새우 구이',
    image: 'images/IMG_8309.png',
    date: '2026-01-11',
    addedAt: '2026-01-11T12:00:00.000Z'
  },
  {
    name: '병어찜',
    image: 'images/IMG_8310.png',
    date: '2026-01-11',
    addedAt: '2026-01-11T12:00:00.000Z'
  },
  {
    name: '반미',
    image: 'images/IMG_8316.png',
    date: '2026-01-11',
    location: 'Nice Coffe',
    addedAt: '2026-01-11T12:00:00.000Z'
  },
]

export default {
  name: 'App',
  setup() {
    const foods = ref(foodsData)
    
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

    const selectedDateFoods = computed(() => {
      return foods.value
        .filter(food => food.date === selectedDate.value)
        .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    })

    const getImageUrl = (imagePath) => {
      // 이미지 경로가 이미 /로 시작하면 그대로 사용
      if (imagePath.startsWith('/')) {
        return imagePath
      }
      // base path 가져오기 (빌드 시 vite.config.js의 base 설정 사용)
      let base = import.meta.env.BASE_URL || '/tia-in-da-nang/'
      
      // 카카오톡 웹뷰에서 import.meta.env.BASE_URL이 제대로 동작하지 않을 수 있으므로
      // 현재 location.pathname을 기반으로 base path 추출
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname
        if (pathname.startsWith('/tia-in-da-nang')) {
          base = '/tia-in-da-nang/'
        }
      }
      
      // base path가 /로 끝나지 않으면 / 추가
      const basePath = base.endsWith('/') ? base : `${base}/`
      const fullPath = `${basePath}${imagePath}`
      
      // 절대 URL로 변환 (카카오톡 웹뷰 호환성)
      if (typeof window !== 'undefined' && !fullPath.startsWith('http')) {
        return new URL(fullPath, window.location.origin).href
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

    return {
      selectedDate,
      selectedDateFoods,
      goToPreviousDate,
      goToNextDate,
      goToToday,
      getTodayDate,
      formatDate,
      getImageUrl,
      handleImageError
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

.food-list {
  list-style: none;
}

.food-item {
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: background 0.2s;
}

.food-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

@media (prefers-color-scheme: light) {
  .food-item {
    background: rgba(0, 0, 0, 0.02);
  }
  
  .food-item:hover {
    background: rgba(0, 0, 0, 0.05);
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

.food-location {
  font-size: 0.9rem;
  color: #667eea;
  margin: 0.25rem 0 0.5rem 0;
  font-weight: 500;
}

.food-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: block;
}


</style>
