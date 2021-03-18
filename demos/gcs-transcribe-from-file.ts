const fs = require('fs');
const speech = require('@google-cloud/speech');

// !!! DEVELOPER TODO !!!
// 1. Set up a project and authentication
//    https://cloud.google.com/speech-to-text/docs/quickstart-client-libraries#before-you-begin
// 2. Modify the object below as needed
const target = {
  path: `${__dirname}/sample.wav`,
  // For all config options, see
  // https://googleapis.dev/nodejs/speech/latest/google.cloud.speech.v1p1beta1.IStreamingRecognitionConfig.html
  config: {
    encoding: 'LINEAR16',
    languageCode: 'en-US',
    sampleRateHertz: 44100,
    // audioChannelCount: 2, // required for stereo files
  }
}

const config = {
  // For details on transcription model options, see
  // https://cloud.google.com/speech-to-text/docs/transcription-model
  // and https://cloud.google.com/speech-to-text/docs/enhanced-models
  model: 'default',
  ...target.config,
}

const main = async () => {
  const transcript = [];
  const startTime = Date.now();
  const elapsedTime = () => (Date.now() - startTime) / 1000;

  // https://googleapis.dev/nodejs/speech/latest/v1p1beta1.SpeechClient.html
  const client = new speech.SpeechClient();

  const transcriber = client
    // https://googleapis.dev/nodejs/speech/latest/google.cloud.speech.v1p1beta1.Speech.html#streamingRecognize2
    .streamingRecognize({config})
    .on('error', console.error)
    .on('data', data => {
      // For details on the `data` object, see
      // https://googleapis.dev/nodejs/speech/latest/google.cloud.speech.v1p1beta1.IStreamingRecognizeResponse.html
      
      console.log(`\nRESULT after ${elapsedTime()} secs\n`, JSON.stringify(data, null, 2));
      // even outside an `error` event, `data` may still report a
      // transcription failure
      if (!!data.error) {
        console.error("ERROR: \n", data.error);
      } else {
        console.log(`${elapsedTime()}`)
        transcript.push(
          // https://googleapis.dev/nodejs/speech/latest/google.cloud.speech.v1p1beta1.IStreamingRecognitionResult.html
          data.results[0].alternatives[0].transcript
        );
      }})
    .on('end', () => {
      console.log("\nFINAL TRANSCRIPT:");
      console.log('  ' + transcript.join('\n  '))});

  if (fs.existsSync(target.path)) {
    await fs.createReadStream(target.path).pipe(transcriber);
  } else {
    console.error(`ERROR: Could not find target file '${target.path}'`);
  }
}
main();