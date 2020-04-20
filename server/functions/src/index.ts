import * as functions from 'firebase-functions'
import { Request, Response } from 'express'
const webPush = require('web-push')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
admin.initializeApp()
const database = admin.database()
const storage = admin.storage().bucket('indexeddb-data')

app
  .use(cors({ origin: true }))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }));

const uuid = () => Math.floor((1 + Math.random()) * 0xfffff).toString(16).substring(1)

webPush.setVapidDetails(
  'mailto:a0972199950@gmail.com',
  'BKTn_27OfwSVV_mwzU4n3HYf7N7tmH2GgXFFEy2MkMu5WGirakkmFkEmL-kTjEeOoaLTM1LQl_YGOQwGaJ41Z_I',
  '56-16ZjIlF68hA6cno_lA2NuzvHRrhhracj-_4VdPPA'
)

app.get('/posts', async (req: Request, res: Response) => {
  try {
    const postsSnap = await database.ref('posts').once('value')
    let posts = postsSnap.val()

    posts = posts ? Object.keys(posts).map(postId => ({ id: postId, ...posts[postId] })) : []
    
    res.json({ posts })
  } catch(e) {
    res.status(500).json({ error: true, message: e.message })
  }
})

app.post('/posts', async (req: Request, res: Response) => {
  try {
    const { postTitle, postContent, postCover } = req.body
    const ref = await database.ref('posts').push({ postTitle, postContent, postCover })

    const subsSnap = await database.ref('subs').once('value')
    subsSnap.forEach((subSnap: any) => {
      const sub = subSnap.val()

      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys.auth,
          p256dh: sub.keys.p256dh
        }
      }

      webPush.sendNotification(pushConfig, JSON.stringify({
        type: 'NEW_POST',
        title: postTitle,
        body: postContent,
        image: postCover,
        url: `/posts/${ref.key}`
      }))  
    })

    
    res.json({ message: 'success' })
  } catch(e) {
    res.status(500).json({ error: true, message: e.message })
  }
})

app.post('/image', async (req: Request, res: Response) => {
  try {
    const image = req.body.image
    const result = await storage.ref().child(`${uuid()}.jpg`).put(image)
    res.json({ result })
  } catch(e) {
    res.status(500).json({ error: true, message: e.message })
  }
})

app.post('/subs', async (req: Request, res: Response) => {
  try {
    const { sub } = req.body
    await database.ref('subs').push(sub)

    res.json({ message: 'success' })
  } catch(e) {
    res.status(500).json({ error: true, message: e.message })
  }
})

export const api = functions.https.onRequest(app)
