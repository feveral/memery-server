const fs = require('fs')
const axios = require('axios')
var FormData = require('form-data')


const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { 'Content-Type': 'application/json' },
})

let memeToken = ''
let imageFolderPath = './example-images'

async function login() {
    try {
        return (await api.post('/api/auth/login', {})).data.meme_token
    } catch (e) {
        console.log(e.response.data)
    }
}

async function uploadMeme(filePath, ext, description, tags) {
    const formData = new FormData()
    formData.append('image', fs.createReadStream(filePath))

    const uploadImageOption = {
        headers: {
            'Authorization': `Bearer ${memeToken}`,
            ...formData.getHeaders()
        }
    }
    let imageUrl
    try {
        imageUrl = (await api.post(`/api/image?ext=${ext}`, formData, uploadImageOption)).data.image_url
    } catch (e) {
        console.log(e.response.data)
    }

    try {
        const meme = (await api.post('/api/meme', {
            image_url: imageUrl,
            description: description,
            tags: tags
        }, { 
            headers: {'Authorization': `Bearer ${memeToken}`}
        })).data
        return meme
    } catch (e) {
        console.log(e.response.data)
    }

}

async function uploadAllMemes () {
    const fileNames = fs.readdirSync(imageFolderPath)
    for(let i = 0; i < fileNames.length; i++) {
        const ext = fileNames[i].split('.')[1]
        try {
            const meme = await uploadMeme(
                `${imageFolderPath}/${fileNames[i]}`,
                ext,
                `This is description ${i}`, 
                [`tag${i}`, `tag${i+1}`]
            )
            uploadComment(meme.id, meme.user_id, 'this is comment 1')
            uploadComment(meme.id, meme.user_id, 'this is comment 2')
        } catch (e) {
            console.log(e)
        }
    }
}

async function uploadComment(memeId, userId, content) {
    try {
        const comment = (await api.post('/api/comment', {
            meme_id: memeId,
            user_id: userId,
            content
        }, { 
            headers: {'Authorization': `Bearer ${memeToken}`}
        })).data
        return comment
    } catch (e) {
        console.log(e.response.data)
    }

}

async function main () {
    memeToken = await login()
    await uploadAllMemes()
}

main()
