<template>
  <div class="app">
    <header class="header">
      <h1>🍜 TIA in Da Nang</h1>
      <p class="subtitle">다낭에서 먹은 음식들</p>
    </header>

    <main class="main-content">
      <div class="date-navigation-section">
        <div class="date-navigation">
          <button @click="goToPreviousDate" class="btn-nav">← 이전</button>
          <div class="date-display">
            <input
              v-model="selectedDate"
              type="date"
              class="date-input"
            />
            <span class="date-label">{{ formatDate(selectedDate) }}</span>
          </div>
          <button @click="goToNextDate" class="btn-nav">다음 →</button>
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
      return new Date().toISOString().split('T')[0]
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
      // 이미지 경로가 이미 /로 시작하면 그대로 사용, 아니면 base path 추가
      if (imagePath.startsWith('/')) {
        return imagePath
      }
      return `/tia-in-da-nang/${imagePath}`
    }

    const handleImageError = (event) => {
      // 이미지 로드 실패 시 숨김 처리
      event.target.style.display = 'none'
    }

    const goToPreviousDate = () => {
      const date = new Date(selectedDate.value)
      date.setDate(date.getDate() - 1)
      selectedDate.value = date.toISOString().split('T')[0]
    }

    const goToNextDate = () => {
      const date = new Date(selectedDate.value)
      date.setDate(date.getDate() + 1)
      selectedDate.value = date.toISOString().split('T')[0]
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
      const date = new Date(dateString)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (dateString === today.toISOString().split('T')[0]) {
        return '오늘'
      } else if (dateString === yesterday.toISOString().split('T')[0]) {
        return '어제'
      } else {
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

.btn-nav {
  padding: 0.75rem 1.5rem;
  border: 2px solid #667eea;
  border-radius: 8px;
  background: transparent;
  color: #667eea;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
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

.date-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: #764ba2;
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
