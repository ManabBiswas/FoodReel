import 'dotenv/config';
import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadImage(file, fileName) {
    const response = await imagekit.upload({
        file,
        fileName
    });
    return response.url;
}


export default {
    uploadImage
};