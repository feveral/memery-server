
module.exports = {
    port: parseInt(process.env.PORT),
    mongoUrl: process.env.MONGO_URL,
    mongoDatabaseName: process.env.MONGO_DATABASE_NAME,
    customIdStart: parseInt(process.env.CUSTOM_ID_START),
    tokenSecret: process.env.TOKEN_SECRET,
    serverBaseUrl: process.env.SERVER_BASE_URL,
    googleValidateTokenUrl: process.env.GOOGLE_VALIDATE_TOKEN_URL,
    facebookValidateTokenUrl: process.env.FACEBOOK_VALIDATE_TOKEN_URL,
    firebaseAdminKeyPath: process.env.FIREBASE_ADMIN_KEY_PATH,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    awsS3MemeImageBucket: process.env.AWS_S3_MEME_IMAGE_BUCKET,
    awsS3MemeImageBaseUrl: process.env.AWS_S3_MEME_IMAGE_BASE_URL,
    awsS3UserAvatarBucket: process.env.AWS_S3_USER_AVATAR_BUCKET,
    awsS3UserAvatarBaseUrl: process.env.AWS_S3_USER_AVATAR_BASE_URL,

    gcpCloudStorageImageBucket: process.env.GCP_CLOUD_STORAGE_IMAGE_BUCKET,
    gcpCloudStorageImageBaseUrl: process.env.GCP_CLOUD_STORAGE_IMAGE_BASE_URL,
    gcpCloudStorageVideoBucket: process.env.GCP_CLOUD_STORAGE_VIDEO_BUCKET,
    gcpCloudStorageVideoBaseUrl: process.env.GCP_CLOUD_STORAGE_VIDEO_BASE_URL,

    slackWebHookUrl: process.env.SLACK_WEB_HOOK_URL,
    slackAnalyticsToken: process.env.SLACK_ANALYTICS_TOKEN,
}