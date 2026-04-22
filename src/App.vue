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

      <section class="tag-search-section">
        <div class="section-heading">
          <h2># 태그 검색</h2>
          <p>태그를 고르면 당일 기록과 전체 여행 기록을 같이 좁혀서 볼 수 있다.</p>
        </div>

        <div class="tag-toolbar">
          <input
            v-model.trim="tagQuery"
            type="search"
            class="tag-search-input"
            placeholder="태그 검색 예: 커피, 해산물, 과일"
          />
          <button
            v-if="selectedTags.length > 0 || tagQuery"
            @click="clearTagSearch"
            class="btn-clear"
            type="button"
          >
            초기화
          </button>
        </div>

        <p v-if="!tagQuery" class="search-hint">
          태그 이름을 입력하면 관련 태그가 나타난다.
        </p>

        <div v-if="selectedTags.length > 0" class="selected-tags">
          <button
            v-for="tag in selectedTags"
            :key="`selected-${tag}`"
            class="tag-chip active"
            type="button"
            @click="toggleTag(tag)"
          >
            #{{ tag }} <span class="tag-chip-action">x</span>
          </button>
        </div>

        <div v-if="tagQuery && filteredTagOptions.length > 0" class="tag-chip-list">
          <button
            v-for="tag in filteredTagOptions"
            :key="tag.name"
            class="tag-chip"
            type="button"
            @click="toggleTag(tag.name)"
          >
            <span>#{{ tag.name }}</span>
          </button>
        </div>

        <div v-else-if="tagQuery" class="empty-state compact">
          검색어에 맞는 태그가 없습니다.
        </div>
      </section>

      <section v-if="hasActiveTagFilters" class="search-results-section">
        <div class="section-heading">
          <h2>{{ activeTagTitle }} 전체 기록</h2>
          <p>{{ tagSearchResults.length }}개의 음식이 선택한 태그를 포함한다. 카드를 누르면 그 날짜로 이동한다.</p>
        </div>

        <div v-if="tagSearchResults.length === 0" class="empty-state compact">
          선택한 태그에 맞는 기록이 없습니다.
        </div>

        <div v-else class="search-results-grid">
          <button
            v-for="result in tagSearchResults"
            :key="`${result.date}-${result.restaurant || '식당'}-${result.name}-${result.addedAt}`"
            class="search-result-card"
            type="button"
            @click="jumpToDate(result.date)"
          >
            <div class="search-result-meta">
              <span>{{ formatDate(result.date) }}</span>
              <span>{{ formatTime(result.addedAt) }}</span>
            </div>
            <strong class="search-result-name">{{ result.name }}</strong>
            <p class="search-result-restaurant">{{ result.restaurant || '식당 정보 없음' }}</p>
            <div class="inline-tags">
              <span
                v-for="tag in result.tags"
                :key="`${result.name}-${tag}`"
                class="inline-tag"
              >
                #{{ tag }}
              </span>
            </div>
          </button>
        </div>
      </section>

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
        <div class="section-heading">
          <h2>{{ formatDate(selectedDate) }} 먹은 음식</h2>
          <p v-if="hasActiveTagFilters">
            {{ activeTagTitle }} 태그가 붙은 음식만 {{ selectedDateFoodCount }}개 보여준다.
          </p>
        </div>

        <div v-if="selectedDateRestaurants.length === 0" class="empty-state">
          이 날짜에 아직 음식을 추가하지 않았습니다.
        </div>

        <div
          v-else-if="hasActiveTagFilters && filteredSelectedDateRestaurants.length === 0"
          class="empty-state"
        >
          이 날짜에는 선택한 태그에 맞는 음식이 없습니다.
        </div>

        <div v-else class="timeline">
          <div
            v-for="(restaurant, restaurantIndex) in filteredSelectedDateRestaurants"
            :key="restaurantIndex"
            class="timeline-item"
          >
            <div class="timeline-time">{{ formatTime(restaurant.addedAt) }}</div>
            <div class="timeline-content">
              <div v-if="restaurant.restaurant" class="restaurant-name">📍 {{ restaurant.restaurant }}</div>
              <div v-for="(food, foodIndex) in restaurant.foods" :key="foodIndex" class="food-item">
                <div class="food-content">
                  <div class="food-info">
                    <span class="food-name">{{ food.name }}</span>
                    <p v-if="food.description" class="food-description">{{ food.description }}</p>
                    <div v-if="food.tags && food.tags.length > 0" class="inline-tags">
                      <button
                        v-for="tag in food.tags"
                        :key="`${food.name}-${tag}`"
                        class="inline-tag button-tag"
                        :class="{ active: selectedTags.includes(tag) }"
                        type="button"
                        @click="toggleTag(tag)"
                      >
                        #{{ tag }}
                      </button>
                    </div>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { LMap, LMarker, LPopup, LTileLayer } from '@vue-leaflet/vue-leaflet'
import restaurantsData from './data/restaurants.json'

export default {
  name: 'App',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup
  },
  setup() {
    const getTodayDate = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const getDateFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      const dateParam = params.get('date')

      if (dateParam) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (dateRegex.test(dateParam)) {
          return dateParam
        }
      }

      return getTodayDate()
    }

    const selectedDate = ref(getDateFromUrl())
    const tagQuery = ref('')
    const selectedTags = ref([])
    const zoom = ref(13)

    const updateUrl = (date) => {
      const url = new URL(window.location)
      url.searchParams.set('date', date)
      window.history.pushState({ date }, '', url)
    }

    const sortRestaurantsByTime = (restaurants) => {
      return [...restaurants].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    }

    const selectedDateRestaurants = computed(() => {
      const dateEntry = restaurantsData.find((entry) => entry.date === selectedDate.value)
      if (!dateEntry) {
        return []
      }

      return sortRestaurantsByTime(dateEntry.restaurants)
    })

    const hasActiveTagFilters = computed(() => selectedTags.value.length > 0)

    const matchesSelectedTags = (food) => {
      if (!hasActiveTagFilters.value) {
        return true
      }

      const tags = Array.isArray(food.tags) ? food.tags : []
      return selectedTags.value.every((tag) => tags.includes(tag))
    }

    const filteredSelectedDateRestaurants = computed(() => {
      if (!hasActiveTagFilters.value) {
        return selectedDateRestaurants.value
      }

      return selectedDateRestaurants.value
        .map((restaurant) => ({
          ...restaurant,
          foods: restaurant.foods.filter(matchesSelectedTags)
        }))
        .filter((restaurant) => restaurant.foods.length > 0)
    })

    const selectedDateFoodCount = computed(() => {
      return filteredSelectedDateRestaurants.value.reduce((count, restaurant) => {
        return count + restaurant.foods.length
      }, 0)
    })

    const restaurantsWithLocation = computed(() => {
      return filteredSelectedDateRestaurants.value.filter((restaurant) => {
        if (!restaurant.location) {
          return false
        }

        const { lat, lng } = restaurant.location
        return typeof lat === 'number' &&
          typeof lng === 'number' &&
          !Number.isNaN(lat) &&
          !Number.isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
      })
    })

    const mapCenter = computed(() => {
      if (restaurantsWithLocation.value.length > 0) {
        const lats = restaurantsWithLocation.value.map((restaurant) => restaurant.location.lat)
        const lngs = restaurantsWithLocation.value.map((restaurant) => restaurant.location.lng)
        const avgLat = lats.reduce((sum, value) => sum + value, 0) / lats.length
        const avgLng = lngs.reduce((sum, value) => sum + value, 0) / lngs.length
        return [avgLat, avgLng]
      }

      return [16.0470, 108.2068]
    })

    const allTagOptions = computed(() => {
      const counts = new Map()

      restaurantsData.forEach((dateEntry) => {
        dateEntry.restaurants.forEach((restaurant) => {
          restaurant.foods.forEach((food) => {
            const tags = Array.isArray(food.tags) ? food.tags : []
            tags.forEach((tag) => {
              counts.set(tag, (counts.get(tag) || 0) + 1)
            })
          })
        })
      })

      return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count
          }

          return a.name.localeCompare(b.name, 'ko')
        })
    })

    const filteredTagOptions = computed(() => {
      const query = tagQuery.value.trim().toLowerCase()

      return allTagOptions.value.filter((tag) => {
        const matchesQuery = !query || tag.name.toLowerCase().includes(query)
        return matchesQuery && !selectedTags.value.includes(tag.name)
      })
    })

    const activeTagTitle = computed(() => {
      return selectedTags.value.map((tag) => `#${tag}`).join(' ')
    })

    const tagSearchResults = computed(() => {
      if (!hasActiveTagFilters.value) {
        return []
      }

      return restaurantsData
        .flatMap((dateEntry) => dateEntry.restaurants.flatMap((restaurant) => {
          return restaurant.foods
            .filter(matchesSelectedTags)
            .map((food) => ({
              date: dateEntry.date,
              restaurant: restaurant.restaurant,
              addedAt: restaurant.addedAt,
              name: food.name,
              tags: food.tags || []
            }))
        }))
        .sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt))
    })

    const toggleTag = (tagName) => {
      if (selectedTags.value.includes(tagName)) {
        selectedTags.value = selectedTags.value.filter((tag) => tag !== tagName)
        return
      }

      selectedTags.value = [...selectedTags.value, tagName]
    }

    const clearTagSearch = () => {
      tagQuery.value = ''
      selectedTags.value = []
    }

    const jumpToDate = (date) => {
      selectedDate.value = date
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const getImageUrl = (imagePath) => {
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath
      }

      const base = import.meta.env.BASE_URL
      const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
      return `${base}${cleanPath}`
    }

    const handleImageError = (event) => {
      console.error('이미지 로드 실패:', event.target.src)
      event.target.style.display = 'none'
    }

    const goToPreviousDate = () => {
      const date = new Date(`${selectedDate.value}T00:00:00`)
      date.setDate(date.getDate() - 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      selectedDate.value = `${year}-${month}-${day}`
    }

    const goToNextDate = () => {
      const date = new Date(`${selectedDate.value}T00:00:00`)
      date.setDate(date.getDate() + 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      selectedDate.value = `${year}-${month}-${day}`
    }

    const goToToday = () => {
      selectedDate.value = getTodayDate()
    }

    watch(selectedDate, (newDate) => {
      updateUrl(newDate)
    }, { immediate: true })

    const handlePopState = (event) => {
      if (event.state && event.state.date) {
        selectedDate.value = event.state.date
      } else {
        selectedDate.value = getDateFromUrl()
      }
    }

    onMounted(() => {
      window.addEventListener('popstate', handlePopState)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('popstate', handlePopState)
    })

    const formatDate = (dateString) => {
      const today = getTodayDate()
      const todayDate = new Date(`${today}T00:00:00`)
      const yesterdayDate = new Date(todayDate)
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`

      if (dateString === today) {
        return '오늘'
      }

      if (dateString === yesterday) {
        return '어제'
      }

      const date = new Date(`${dateString}T00:00:00`)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      })
    }

    const formatTime = (addedAtString) => {
      const match = addedAtString.match(/T(\d{2}):(\d{2})/)
      if (match) {
        return `${match[1]}:${match[2]}`
      }

      return '00:00'
    }

    const onMapReady = (mapObject) => {
      mapObject.invalidateSize()
    }

    return {
      activeTagTitle,
      clearTagSearch,
      filteredSelectedDateRestaurants,
      filteredTagOptions,
      formatDate,
      formatTime,
      getImageUrl,
      getTodayDate,
      goToNextDate,
      goToPreviousDate,
      goToToday,
      handleImageError,
      hasActiveTagFilters,
      jumpToDate,
      mapCenter,
      onMapReady,
      restaurantsWithLocation,
      selectedDate,
      selectedDateFoodCount,
      selectedDateRestaurants,
      selectedTags,
      tagQuery,
      tagSearchResults,
      toggleTag,
      zoom
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

.section-heading {
  margin-bottom: 1rem;
}

.section-heading h2 {
  margin-bottom: 0.35rem;
  font-size: 1.5rem;
  color: #667eea;
}

.section-heading p {
  color: #888;
  font-size: 0.95rem;
  line-height: 1.5;
}

.search-hint {
  margin-bottom: 1rem;
  color: #888;
  font-size: 0.9rem;
}

.date-navigation-section,
.tag-search-section,
.map-section,
.food-list-section,
.search-results-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

@media (prefers-color-scheme: light) {
  .date-navigation-section,
  .tag-search-section,
  .map-section,
  .food-list-section,
  .search-results-section {
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.date-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

@media (max-width: 768px) {
  .date-navigation {
    padding: 0;
    gap: 0.4rem;
    max-width: 100%;
    box-sizing: border-box;
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

.date-input,
.tag-search-input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 1rem;
  transition: border-color 0.3s, background 0.3s;
}

.date-input {
  text-align: center;
  cursor: pointer;
}

.date-input:focus,
.tag-search-input:focus {
  outline: none;
  border-color: #667eea;
}

@media (prefers-color-scheme: light) {
  .date-input,
  .tag-search-input {
    border-color: rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.8);
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

.btn-today,
.btn-clear {
  padding: 0.45rem 0.9rem;
  border: 1px solid #667eea;
  border-radius: 999px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-today:hover,
.btn-clear:hover {
  background: #667eea;
  color: white;
}

.tag-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.tag-chip-list,
.inline-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.tag-chip,
.inline-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  border: 1px solid rgba(102, 126, 234, 0.25);
  background: rgba(102, 126, 234, 0.08);
  color: inherit;
  font-size: 0.85rem;
  line-height: 1;
}

.tag-chip {
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s, border-color 0.2s;
}

.tag-chip:hover {
  transform: translateY(-1px);
  background: rgba(102, 126, 234, 0.14);
}

.tag-chip.active,
.button-tag.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: transparent;
}

.tag-chip-action,
.tag-count {
  opacity: 0.8;
  font-size: 0.75rem;
}

.search-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
}

.search-result-card {
  text-align: left;
  padding: 1rem;
  border: 1px solid rgba(102, 126, 234, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, background 0.2s;
}

.search-result-card:hover {
  transform: translateY(-2px);
  border-color: rgba(102, 126, 234, 0.4);
  background: rgba(102, 126, 234, 0.08);
}

.search-result-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.6rem;
  color: #888;
  font-size: 0.8rem;
}

.search-result-name {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 1rem;
}

.search-result-restaurant {
  margin-bottom: 0.75rem;
  color: #667eea;
  font-size: 0.9rem;
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

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

.empty-state.compact {
  padding: 1rem 0;
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
  .food-item,
  .search-result-card {
    background: rgba(0, 0, 0, 0.02);
  }

  .food-item:hover,
  .search-result-card:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .timeline-item::before {
    border-color: rgba(255, 255, 255, 0.9);
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
  gap: 0.6rem;
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

.button-tag {
  padding: 0.45rem 0.7rem;
  cursor: pointer;
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
    font-size: 0.75rem;
    padding: 0.4rem 0.35rem;
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

  .date-label-wrapper {
    flex-direction: column;
    gap: 0.25rem;
  }

  .btn-today,
  .btn-clear {
    font-size: 0.72rem;
    padding: 0.3rem 0.7rem;
  }

  .tag-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .map-container {
    height: 300px;
  }

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
