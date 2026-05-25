module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://172.30.101.52:3001',
        changeOrigin: true
      }
    }
  }
}
