import { openDB, IDBPDatabase } from 'idb'
import LogHelper from './LogHelper'

interface IBgSync {
  method: 'POST' | 'PUT' | 'DELETE'
  url: string
  headers: object
  body: object
}

declare var self: ServiceWorkerGlobalScope

const debug = false
const logHelper = new LogHelper('IDB', debug)

class IDBHelper {
  private BG_SYNC = 'bg-sync'

  private idb: IDBPDatabase<IBgSync> = null

  private async initIDB() {
    this.idb = await openDB(this.BG_SYNC, 1, {
      upgrade: (idb: IDBPDatabase<IBgSync>) => {
        idb.createObjectStore(this.BG_SYNC, { keyPath: 'id', autoIncrement: true })
      }
    })
    logHelper.log('IDB成功init')
  }

  private async registerBgSync(req: Request) {
    if(!this.idb) {
      await this.initIDB()
    }

    const { method, url, headers } = req
    const bodyText = await req.text()
    const body = bodyText ? JSON.parse(bodyText) : null

    const tx = this.idb.transaction(this.BG_SYNC, 'readwrite')
    tx.store.add({ 
      method, 
      url, 
      headers: { 
        'content-type': headers.get('content-type') 
      }, 
      body 
    })

    await tx.done

    self.registration.sync.register('START_BG_SYNC')

    logHelper
      .log('成功註冊背景同步作業')
      .table({ method, url, body })

    return new Response(JSON.stringify({
      ok: false,
      statusKey: 'REGISTER_BG_SYNC',
      message: '應用離線中，將請求暫存到IDB等待網路重新連接'
    }))
  }

  public async fetchOrRegisterBgSync(req: Request) {
    try {
      return await fetch(req.clone())
    } catch(e) {
      return await this.registerBgSync(req.clone())
    }
  }

  public async startBgSync() {
    const bgSyncReqs = await this.idb.getAll(this.BG_SYNC)
    
    await Promise.all(bgSyncReqs.map(async (req) => {
      const { id, method, url, headers, body } = req

      try {
        const option: any = { 
          method, 
          headers
        }
        !!body && (option.body = JSON.stringify(body))

        const res = await fetch(url, option)
        const { error, message } = await res.json()
        if(error) {
          throw new Error(message)
        }

        await this.idb.delete(this.BG_SYNC, id)
        logHelper
          .log('成功執行背景同步作業')
          .table({ method, url, body })
      } catch(e) {
        logHelper
          .error('背景同步作業執行失敗', e)
          .table({ method, url, body })
      }
    }))
  }
}

export default IDBHelper
