interface Window {
  installPromptEvent: any
}

const createPostBtn = document.querySelector('#createPostBtn')
createPostBtn.addEventListener('click', async () => {
  const postTitle = (document.querySelector('#postTitle') as HTMLInputElement).value
  const postContent =  (document.querySelector('#postContent') as HTMLInputElement).value
  const postCover =  (document.querySelector('#postCover') as HTMLInputElement).value

  try {
    await fetch('https://us-central1-indexeddb-data.cloudfunctions.net/api/posts', {
      method: 'POST',
      headers: new Headers({
        'content-type': 'application/json'
      }),
      body: JSON.stringify({ postTitle, postContent, postCover })
    })

    // location.reload()
  } catch(e) {
    console.log(e)
  }
})

const installAppBtn = document.querySelector('#installApp')
installAppBtn.addEventListener('click', async () => {
  const installPromptEvent = (window as any).installPromptEvent

  if(!installPromptEvent) {
    alert('installPromptEvent不存在，無法安裝應用程式')
  } else {
    installPromptEvent.prompt()
    const userAns = await installPromptEvent.userChoice

    console.log(userAns)
  }
})

const enableNotificationBtn = document.querySelector('#enableNotification')
enableNotificationBtn.addEventListener('click', async () => {
  console.log('click')
  const userAns = await Notification.requestPermission()
  console.log(userAns)
  console.log(Notification)
})

const notificationBtn = document.querySelector('#notification')
notificationBtn.addEventListener('click', async () => {
  const sw = await navigator.serviceWorker.ready

  sw.showNotification('通知標題', {
    body: 'Buzz! Buzz!',
    icon: '/assets/favicon.ico',
    image: 'https://picsum.photos/300/200',
    badge: 'https://picsum.photos/96/96',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: 'vibration-sample',
    actions: [
      { action: '點開看看', title: '點開看看內容', icon: 'https://picsum.photos/50/50' },
      { action: '取消', title: '取消並關閉內容', icon: 'https://picsum.photos/50/50' }
    ]
  })
})

const subscribeNotificationBtn = document.querySelector('#subscribeNotification')
subscribeNotificationBtn.addEventListener('click', async () => {
  const sw = await navigator.serviceWorker.ready
  const sub = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'BKTn_27OfwSVV_mwzU4n3HYf7N7tmH2GgXFFEy2MkMu5WGirakkmFkEmL-kTjEeOoaLTM1LQl_YGOQwGaJ41Z_I'
  })

  console.log(sub)
  console.log(JSON.parse(JSON.stringify(sub)))
  
  await fetch('https://us-central1-indexeddb-data.cloudfunctions.net/api/subs', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ sub })
  })

  alert('訂閱成功')
})

window.addEventListener('beforeinstallprompt', (e: Event) => {
  e.preventDefault()
  Object.assign(window, { installPromptEvent: e })
})

const fetchData = async () => {
  try {
    const postsRes = await fetch('https://us-central1-indexeddb-data.cloudfunctions.net/api/posts')
    const { posts }: { posts: any[] } = await postsRes.json()

    const postsHtml = posts.reduce((html, post) => {
      return (html += `
        <div class="card" style="width: 18rem;">
          <img class="card-img-top" src="${post.postCover}" alt="Card image cap">
          <div class="card-body">
            <h5 class="card-title">${post.postTitle}</h5>
            <p class="card-text">${post.postContent}</p>
          </div>
        </div>
      `)
    }, '')

    const postsArea = document.querySelector('#postsArea')
    postsArea.innerHTML = postsHtml
  } catch(e) {
    console.log(e)
  }
}

const registerServiceWorker = () => {
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
}

const start = () => {
  registerServiceWorker()
  fetchData()
}

start()