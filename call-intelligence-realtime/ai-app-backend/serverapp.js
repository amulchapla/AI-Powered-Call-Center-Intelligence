require('dotenv').config()
const express = require('express')
const axios = require('axios');
const app = express()
const multer = require('multer');
// const azure = require('azure-storage');
// const speech = require('@azure/cognitiveservices-speech');

const  router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');

app.use(express.urlencoded({ extended: true }));

// get router
const openaiRouter = require('./routes/openai-gpt')
const azurelanguageRouter = require('./routes/azureai-language')   

var connectionString ='';

// get config
const config = require('./config.json')
const port = config[0].web_port
const speechKey = config[0].speech_subscription_key;
const speechRegion = config[0].speech_region;
const endpoint_id = config[0].speech_custom_endpoint_id_optional;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/openai', openaiRouter);
app.use('/azure/language', azurelanguageRouter);

app.get('/api/sayhello', (req, res) => {
    const currentDateTime = new Date();    
    res.send('Hello World from the backend root! ' + currentDateTime)
});

app.get('/api/get-speech-token', async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');

    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            console.log(`Speechkey loaded for speech region ${speechRegion}. Getting token`)
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            res.send({ token: tokenResponse.data, region: speechRegion, endpoint_id: endpoint_id });
        } catch (err) {
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    // limits: {
    //   fileSize: 4 * 1024 * 1024 // 4 MB
    // }
  }).single("audio");
  
  app.post("/upload", async (req, res) => {
    // Call the `upload` middleware to handle the file upload
     upload(req, res, async function (err) {
      if (err) {
          console.log("cs " + err);
        return
      }
  
      const language = req.body.language; // Language value from the select element
      console.log(language);
      
        const connectionKey = `${language.toUpperCase()}_CONNECTION_STRING`;
        // console.log(connectionKey);
        const connectionString = process.env[connectionKey];

         if (!connectionString) {
            console.log('Invalid language or connection string not found.');
             return res.status(400).json({ error: 'Invalid language or connection string not found.' });
         }

      
      console.log('Transcription under progress..')
  
      // Get a reference to the container you want to upload the file to
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  
      const containerName = "audio-input";
      const containerClient = blobServiceClient.getContainerClient(containerName);
  
      // Create a BlockBlobClient object for the uploaded file
      const blobName = req.file.originalname;
      const blobClient = containerClient.getBlockBlobClient(blobName);
  
      // Upload the file
      const stream = require("stream").Readable.from(req.file.buffer);
  
      const uploadOptions = {
        bufferSize: 10 * 1024 * 1024, // 4 MB
        maxBuffers: 50 // 80 MB in total
      };
  
      blobClient.uploadStream(stream, uploadOptions.bufferSize, uploadOptions.maxBuffers);
  
      // await blobClient.setHTTPHeaders({ "cache-control": "max-age=2" });
  
      function wait(timeout) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, timeout);
        });
      }
  
      await wait(10000);                
      
       // Set a dummy metadata value
    const metadata = { "refresh": "true" };
    
    // Update the blob's metadata
    await blobClient.setMetadata(metadata);
  
      while (true) {
        // Check if the blob exists
        const existsResponse = await blobClient.exists();
        if (!existsResponse) {
          // console.log(`Blob ${blobName} has been deleted.`);
          break;
        }
        
        // Wait for 1 second before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      
      console.log(`File ${blobName} has been completely deleted from the container.`);
      console.log(`Transcription is done!`);
  
      //Return a success message
      // res.send("File uploaded successfully");
    
      const containerName2 = "json-result-output";
      // const blobName2 = 'postcall-analytics-azure.wav.json';
      const blobName2 =req.file.originalname + '.json';
      // console.log(blobName2);
  
      const containerClient2 = blobServiceClient.getContainerClient(containerName2); 
      const blobClient2 = containerClient2.getBlobClient(blobName2);
    
      const response = await blobClient2.download();
      const json = await streamToString(response.readableStreamBody);
      // console.log(json);
      console.log(res.statusCode);
      res.json(JSON.parse(json));
  
    })
    });
  
    async function streamToString(readableStream) {
      if (!readableStream) {
        return "";
      }
      else{
      return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
          chunks.push(data.toString());
        });
        readableStream.on("end", () => {
          resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
      });
    }
  }

app.listen(port, () => {
  console.log(`Express backend app listening on port ${port}`)
})