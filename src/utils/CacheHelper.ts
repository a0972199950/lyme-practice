import LogHelper from './LogHelper'
import { uuid } from './utils'

const debug = true
const logHelper = new LogHelper('Service Worker', debug)

class CacheHelper {
  private STATIC_CACHE_KEY: string = null

  private DYNAMIC_CACHE_KEY: string = null

  get cacheToKeep() {
    return [this.STATIC_CACHE_KEY, this.DYNAMIC_CACHE_KEY]
  }

  private staticPaths = [
    'http://localhost:8080/',
    'https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css',
    'https://code.jquery.com/jquery-3.3.1.slim.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.6/umd/popper.min.js',
    'https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/js/bootstrap.min.js',
    // 'http://localhost:8080/app.js',
    'http://localhost:8080/assets/favicon.ico'
  ]

  private excludePaths = [
    'chrome-extension://gppongmhjkpfnbhagpmjfkannfbllamg/js/inject.js'
  ]
  
  private async fetchAndUpdateCache(req: Request, cacheKeyToUpdate: string) {
    try {
      const res = await fetch(req)

      if(cacheKeyToUpdate) {
        const cache = await caches.open(cacheKeyToUpdate)
        cache.put(req, res.clone())
        logHelper.log(`成功更新cache: ${cacheKeyToUpdate}，url: ${req.url}`)
      }
      
      return res
    } catch(e) {
      logHelper.log(`無法fetch並更新cache: ${cacheKeyToUpdate}，url: ${req.url}`)
      throw new Error()
    }
  }

  constructor() {
    this.STATIC_CACHE_KEY = `static-${uuid()}`
    this.DYNAMIC_CACHE_KEY = 'dynamic'
  }

  public async cacheStatic() {
    const staticCache = await caches.open(this.STATIC_CACHE_KEY)
    staticCache.addAll(this.staticPaths)
    logHelper.log('成功新增static cache')
  }

  public async clearOldCache() {
    const cacheKeys = await caches.keys()

    return Promise.all(cacheKeys.map(cacheKey => {
      if(!this.cacheToKeep.includes(cacheKey)) {
        logHelper.log(`成功刪除cache: ${cacheKey}`)
        return caches.delete(cacheKey)
      }
    }))
  }

  public async respondWithCacheOrFetch(req: Request) {

    let cacheKeyToUpdate: string = null
      switch(true) {
        // 處理static cache
        case this.staticPaths.includes(req.url):
          cacheKeyToUpdate = this.STATIC_CACHE_KEY

          const cachedRes = await caches.match(req)

          this.fetchAndUpdateCache(req, cacheKeyToUpdate)

          logHelper.log('req.url為static名單，使用cache respond', req.url)
          return cachedRes

        // 處理exclude cache
        case this.excludePaths.includes(req.url):
          cacheKeyToUpdate = null

          try {
            const res = await this.fetchAndUpdateCache(req, cacheKeyToUpdate)
            logHelper.log('req.url為exclude名單，使用fetch respond', req.url)
            return res
          } catch(e) {
            logHelper.log(`req.url為exclude名單，無法使用fetch respond。url: ${req.url}`, req, e)
            return new Response()
          }

        // 處理dynamic cache
        default:
          cacheKeyToUpdate = this.DYNAMIC_CACHE_KEY

          try {
            const res = await this.fetchAndUpdateCache(req, cacheKeyToUpdate)
            logHelper.log('req.url為dynamic名單，使用fetch respond', req.url)
            return res
          } catch(e) {
            // 有可能找得到或找不到，端看本次dynamic cache有沒有被cache住過
            const cachedRes = await caches.match(req)
            logHelper.log('req.url為dynamic名單，使用cache respond', req.url)
            return cachedRes
          }
          
      }

    // try {
    //   const res = await this.fetchAndUpdateCache(req, cacheKeyToUpdate)
    //   logHelper.log('使用fetch respond', req.url)
    //   return res
    // } catch(e) {
    //   logHelper.log(`無法fetch或更新cache, url: ${req.url}, cache: ${cacheKeyToUpdate}`, req, e)
    //   const cachedRes = await caches.match(req)

    //   if(cachedRes) {
    //     logHelper.log('使用cache respond', req.url)
    //   } else {
    //     logHelper.error(`無法使用cache respond, req.url可能為exclude名單, 或是尚未被cache的dynamic名單。url: ${req.url}`, req, e)
    //   }
      
    //   return cachedRes
    // }
  }
}

export default CacheHelper
