import LogHelper from './LogHelper'

interface INotificationPayload {
  title: string
  body: string
  image: string
  data?: object
}

declare var self: ServiceWorkerGlobalScope

const logHelper = new LogHelper('Notification')

class NotificationHelper {
  public show(payload: INotificationPayload) {
    const { title, body, image, data = {} } = payload

    self.registration.showNotification(title, {
      body, image, data: { ...data },
      icon: '/assets/favicon.ico',
      badge: '/assets/icon-96.png',
      vibrate: [100, 500, 100, 500, 100, 100, 500],
      actions: [
        { action: 'confirm', title: '打開看看' },
        { action: 'cancel', title: '取消' }
      ]
    })

    logHelper
      .log('通知內容:')
      .table({ title, body, image, data })
  }

  public async handleClick(e: NotificationEvent) {
    const action = e.action

    logHelper.log(`使用者點擊: ${action}`)

    if(action === 'cancel') { return }

    const url = e.notification.data.url
    const clis = await self.clients.matchAll()

    const currentCli = clis.find((cli: WindowClient) => {
      return cli.visibilityState === 'visible'
    })

    if(currentCli) {
      (currentCli as WindowClient).navigate(url);
      (currentCli as WindowClient).focus()
    } else {
      self.clients.openWindow(url)
    }
  }
}

export default NotificationHelper