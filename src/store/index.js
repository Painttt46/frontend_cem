import { createStore } from 'vuex'

export default createStore({
  state: {
    loading: false,
    darkMode: localStorage.getItem('darkMode') === 'true'
  },
  getters: {
    isLoading: state => state.loading,
    isDarkMode: state => state.darkMode
  },
  mutations: {
    SET_LOADING(state, value) {
      state.loading = value
    },
    SET_DARK_MODE(state, value) {
      state.darkMode = value
      localStorage.setItem('darkMode', value)
      document.documentElement.setAttribute('data-theme', value ? 'dark' : 'light')
    }
  },
  actions: {
    setLoading({ commit }, value) {
      commit('SET_LOADING', value)
    },
    toggleDarkMode({ commit, state }) {
      commit('SET_DARK_MODE', !state.darkMode)
    },
    initTheme({ state }) {
      document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light')
    }
  },
  modules: {
  }
})
