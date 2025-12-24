import { createStore } from 'vuex'

export default createStore({
  state: {
    loading: false
  },
  getters: {
    isLoading: state => state.loading
  },
  mutations: {
    SET_LOADING(state, value) {
      state.loading = value
    }
  },
  actions: {
    setLoading({ commit }, value) {
      commit('SET_LOADING', value)
    }
  },
  modules: {
  }
})
