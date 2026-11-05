module.exports = {
  // ไม่สร้าง source map ตอน build — เดิมใครเข้าถึงเว็บก็โหลดซอร์สโค้ดได้โดยไม่ต้อง login
  productionSourceMap: false,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://172.30.101.52:3001',
        changeOrigin: true
      }
    }
  }
}
