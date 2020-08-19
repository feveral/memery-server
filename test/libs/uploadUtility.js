const axios = require('axios')

module.exports = {
    async uploadImage (endpoint, meme_token, imagePath) {
        const formData = new FormData()
        formData.append('image', fs.createReadStream(filePath))
        const uploadImageOption = {
            headers: {
                'Authorization': `Bearer ${memeToken}`,
                ...formData.getHeaders()
            }
        }
        return await api.post(endpoint, formData, uploadImageOption)
    }
}