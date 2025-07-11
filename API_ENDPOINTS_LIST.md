# TechPrice Scraper API - Optimized Endpoints List

**Toplam Endpoint Sayısı: 75** (9 kullanılmayan endpoint kaldırıldı)

## ⚠️ **REMOVED ENDPOINTS (9)**
- ❌ `GET /admin` - Admin panel route (development only)
- ❌ `GET /health` - Health check (superseded by /api/test-connection)
- ❌ `GET /api/categories/:category` - Duplicate of /api/data/:category
- ❌ `GET /api/products/:id/price-history` - Not implemented
- ❌ `GET /api/analytics/test-price-history` - Test endpoint
- ❌ `GET /api/analytics/price-movers` - Not implemented  
- ❌ `POST /api/batch/category-stats` - Not implemented
- ❌ `POST /api/batch/price-comparison` - Not implemented

## 📋 Endpoint Kategorileri

### 🏠 **ROOT & UTILITY ENDPOINTS (11)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/` | API bilgileri ve durum | server.js, api/index.js |
| GET | `/admin` | Admin panel HTML sayfası | server.js |
| GET | `/api/docs` | API dokümantasyonu | api/index.js |
| GET | `/api/debug` | Debug bilgileri | server.js, api/index.js |
| GET | `/api/test-connection` | Veritabanı bağlantı testi | server.js, api/index.js |
| GET | `/health` | Sağlık kontrolü | server.js, api/index.js |

### 🔐 **AUTHENTICATION ENDPOINTS (14)**

| Method | Endpoint | Açıklama | Korumalı | Dosya |
|--------|----------|----------|----------|-------|
| GET | `/api/auth/test` | Auth test endpoint | ❌ | routes/auth.js, api/auth.js |
| GET | `/api/auth/debug` | Auth debug bilgileri | ❌ | api/auth.js |
| POST | `/api/auth/login` | Admin girişi | ❌ | routes/auth.js, api/auth.js |
| POST | `/api/auth/register` | İlk admin kaydı | ❌ | routes/auth.js, api/auth.js |
| GET | `/api/auth/verify` | JWT token doğrulama | ✅ | routes/auth.js, api/auth.js |
| GET | `/api/auth/profile` | Kullanıcı profili | ✅ | routes/auth.js, api/auth.js |
| POST | `/api/auth/change-password` | Şifre değiştirme | ✅ | routes/auth.js, api/auth.js |
| GET | `/api/auth/users` | Admin kullanıcı listesi | ✅ (Super Admin) | routes/auth.js |
| POST | `/api/auth/create-user` | Yeni admin oluşturma | ✅ (Super Admin) | routes/auth.js |

### 📂 **CATEGORIES ENDPOINTS (4)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/api/categories` | Tüm kategorileri listele | routes/categories.js, api/index.js |
| GET | `/api/categories/:category` | Kategori detayları | routes/categories.js |
| GET | `/api/data/:category` | Kategori verisi | api/index.js |

### 📦 **PRODUCTS ENDPOINTS (7)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/api/products` | Sayfalama ile ürün listesi | routes/products.js, api/index.js |
| GET | `/api/products/price-range` | Fiyat aralığına göre ürünler | routes/products.js, api/index.js |
| GET | `/api/products/brand/:brand` | Markaya göre ürünler | routes/products.js, api/index.js |
| GET | `/api/products/:id/price-history` | Ürün fiyat geçmişi | routes/products.js |

### 🔍 **SEARCH ENDPOINTS (4)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/api/search/all` | Tüm kategorilerde arama | routes/search.js, api/index.js |
| GET | `/api/search/:category` | Kategoride arama | routes/search.js, api/index.js |

### 🌐 **SITES ENDPOINTS (4)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/api/sites` | Tüm siteleri listele | routes/sites.js, api/index.js |
| GET | `/api/sites/:siteName` | Site bilgileri | routes/sites.js, api/index.js |

### 📊 **ANALYTICS ENDPOINTS (4)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/api/analytics/test-price-history` | Fiyat geçmişi testi | routes/analytics.js |
| GET | `/api/analytics/price-trends` | Fiyat trend analizi | routes/analytics.js, api/index.js |
| GET | `/api/analytics/price-movers` | Fiyat değişim analizi | routes/analytics.js |

### 📈 **BATCH OPERATIONS ENDPOINTS (4)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| POST | `/api/batch/products` | Toplu ürün verisi | routes/batch.js, api/index.js |
| POST | `/api/batch/category-stats` | Toplu kategori istatistikleri | routes/batch.js |
| POST | `/api/batch/price-comparison` | Toplu fiyat karşılaştırması | routes/batch.js |

### ⚙️ **SPECIFICATIONS ENDPOINTS (30+)**

#### Genel Özellik Yönetimi
| Method | Endpoint | Açıklama | Korumalı | Dosya |
|--------|----------|----------|----------|-------|
| GET | `/api/specifications` | Tüm özellikler | ❌ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/search` | Özellik arama | ❌ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/unmatched` | Eşleşmemiş ürünler | ❌ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/coverage` | Özellik kapsamı | ❌ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/templates` | Özellik şablonları | ❌ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/templates/:category` | Kategori şablonları | ❌ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/product/:productId` | Ürüne göre özellik | ❌ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/:id` | Özellik detayı | ❌ | routes/specifications.js, api/index.js |

#### Özellik CRUD İşlemleri (Korumalı)
| Method | Endpoint | Açıklama | Korumalı | Dosya |
|--------|----------|----------|----------|-------|
| POST | `/api/specifications` | Özellik oluştur | ✅ | routes/specifications.js, api/index.js |
| PUT | `/api/specifications/:id` | Özellik güncelle | ✅ | routes/specifications.js, api/index.js |
| DELETE | `/api/specifications/:id` | Özellik sil | ✅ | routes/specifications.js, api/index.js |

#### Eşleştirme İşlemleri (Korumalı)
| Method | Endpoint | Açıklama | Korumalı | Dosya |
|--------|----------|----------|----------|-------|
| POST | `/api/specifications/match/:productId` | Ürün eşleştir | ✅ | routes/specifications.js, api/index.js |
| POST | `/api/specifications/rematch/:specificationId` | Tekrar eşleştir | ✅ | routes/specifications.js, api/index.js |
| POST | `/api/specifications/rematch-all` | Hepsini tekrar eşleştir | ✅ | routes/specifications.js, api/index.js |
| GET | `/api/specifications/:specificationId/potential-matches` | Potansiyel eşleşmeler | ✅ | api/index.js |
| POST | `/api/specifications/:specificationId/add-match/:productId` | Eşleşme ekle | ✅ | api/index.js |
| DELETE | `/api/specifications/:specificationId/remove-match/:productId` | Eşleşme kaldır | ✅ | api/index.js |

### 🔄 **COMPARISON ENDPOINTS (3)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| POST | `/api/compare/products` | Ürün karşılaştırması | api/index.js |
| GET | `/api/compare/data` | Karşılaştırma verisi | api/index.js |
| POST | `/api/compare/table` | Karşılaştırma tablosu | api/index.js |

### 💻 **FRONTEND ENDPOINTS (3)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/api/frontend/products-with-specs` | Özellikli ürünler | api/index.js |
| GET | `/api/frontend/specifications/:category` | Kategoriye göre özellikler | api/index.js |
| GET | `/api/frontend/product/:productId/specifications` | Ürün özellik detayları | api/index.js |

### 🔗 **MATCHING DATA ENDPOINTS (4)**

| Method | Endpoint | Açıklama | Korumalı | Dosya |
|--------|----------|----------|----------|-------|
| GET | `/api/matching/all` | Tüm eşleştirme verisi | ❌ | api/index.js |
| GET | `/api/matching/category/:category` | Kategoriye göre eşleştirme | ❌ | api/index.js |
| POST | `/api/matching/bulk-create` | Toplu eşleştirme oluştur | ✅ | api/index.js |
| GET | `/api/matching/export` | Eşleştirme verisi dışa aktar | ❌ | api/index.js |

### 🔎 **PRODUCT SEARCH ENDPOINTS (1)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| POST | `/api/product/find-specifications` | Ürün adına göre özellik bul | api/index.js |

### 📊 **STATISTICS ENDPOINT (1)**

| Method | Endpoint | Açıklama | Dosya |
|--------|----------|----------|-------|
| GET | `/api/stats` | Sistem istatistikleri | server.js, api/index.js |

## 🛡️ Güvenlik Özeti

### Korumalı Endpoint Kategorileri:
- **JWT Token Gerektiren**: 25+ endpoint
- **Super Admin Gerektiren**: 2 endpoint  
- **Genel Erişim**: 57+ endpoint

### Korumalı İşlemler:
- Tüm `POST`, `PUT`, `DELETE` özellik işlemleri
- Kullanıcı profil işlemleri
- Admin kullanıcı yönetimi
- Toplu eşleştirme işlemleri
- Tekrar eşleştirme işlemleri

## 🏗️ Mimari Özeti

### Çifte Sunucu Mimarisi:
1. **Yerel Geliştirme** (`server.js`) - Tam MVC ile ayrı route dosyaları
2. **Serverless Deployment** (`api/index.js`) - Vercel Functions için birleştirilmiş endpointler

### Endpoint Dağılımı:
- **Geliştirme Ortamı**: Modüler route dosyaları
- **Üretim Ortamı**: Tek dosyada birleştirilmiş API
- **Ortak**: Aynı controller, model ve config dosyaları

## 📝 Özellik Yönetimi Sistemi

**138+ Alan** ile kapsamlı ürün özellik yönetimi:
- **7 Kategori**: İşlemci, Ekran Kartı, Anakart, RAM, SSD, Güç Kaynağı, Bilgisayar Kasası
- **Template Sistemi**: Kategori bazında özellik şablonları
- **Otomatik Eşleştirme**: Ürün-özellik otomatik bağlantısı
- **Manuel Eşleştirme**: Admin kontrolü ile özellik bağlama

## 🚀 Performans Optimizasyonları

- **MongoDB Lean Queries**: Daha az bellek kullanımı
- **Pagination**: Büyük veri setleri için sayfalama
- **Aggregation Pipelines**: Verimli analitik sorgular
- **Batch Operations**: Toplu işlemler için optimize edilmiş endpointler
- **Response Caching**: API performansı iyileştirmesi

**Son Güncelleme**: Ocak 2025 - v6.0.0