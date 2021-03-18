const axios = require('axios');
const {
  TranscribeClient,
  DeleteTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  StartTranscriptionJobCommand,
} = require("@aws-sdk/client-transcribe");


// !!!! DEVELOPER TODO !!!!
// 1. Be sure your ~/.aws/config and ~/.aws/credentials files are set up
//    https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-node-credentials-shared.html
// 2. Be sure you are configured to use an IAM user with Transcription privileges
// 3. Set these options as needed...
const region = "us-east-1";
// the media to transcribe - s3 and https URLs only!
const MediaFileUri = "s3://transcriptionfight/audio/sample.wav";
// if true, remove the transcription job after completion (transcript is printed to screen)
const deleteJob = true;

// For details and other examples of TranscribeClient, see
// https://docs.aws.amazon.com/transcribe/latest/dg/API_StartTranscriptionJob.html
//
// For all client params, see
// https://docs.aws.amazon.com/transcribe/latest/dg/API_StartTranscriptionJob.html#API_StartTranscriptionJob_RequestSyntax
const client = new TranscribeClient({ region });

// For all job (telling the client to actually transcribe something) params, see
// https://docs.aws.amazon.com/transcribe/latest/dg/API_StartTranscriptionJob.html
const params = {
  TranscriptionJobName: `test-${Date.now()}`,
  Media: { MediaFileUri },
  // MediaFormat: "wav",    // only needed if AWS can't figure it out
  LanguageCode: "en-US",    // Aids word identification
  Settings: {
    VocabularyName: 'customWords'
  }
};

const main = async () => {
  const startTime = Date.now();
  const elapsedSecs = () => (Date.now() - startTime) / 1000;
  try {
    const startJob = new StartTranscriptionJobCommand(params);
    var {$metadata, TranscriptionJob: transcriptionJob} = await client.send(startJob);
    console.log("STARTING METADATA\n", $metadata);
    // For details on the TranscriptionJob object, see
    // https://docs.aws.amazon.com/transcribe/latest/dg/API_StartTranscriptionJob.html#API_StartTranscriptionJob_ResponseSyntax
    console.log("STARTING JOBINFO\n", transcriptionJob);
    const jobName = transcriptionJob.TranscriptionJobName;
    let jobStatus;
    do {
      transcriptionJob = (await client.send(
        new GetTranscriptionJobCommand({TranscriptionJobName: jobName})
      )).TranscriptionJob;  // ignore $metadata
      jobStatus = transcriptionJob.TranscriptionJobStatus;
      console.log(`\n${jobStatus} after ${elapsedSecs()} seconds`, transcriptionJob);
      await new Promise(r => setTimeout(r, 2000)) // because `sleep(2)` would be too easy
    } while (jobStatus !== "COMPLETED");
  } catch (err) {
    console.log("ERROR", err);
  } finally {
    const res = (await axios.get(transcriptionJob.Transcript.TranscriptFileUri));
    console.log(`\nFULL FINAL RESULTS`, res.data.results);
    const transcript = res.data.results.transcripts[0].transcript;
    console.log(`\nFINAL TRANSCRIPT\n`, transcript);
    if (deleteJob) {
      await client.send(new DeleteTranscriptionJobCommand({TranscriptionJobName: transcriptionJob.TranscriptionJobName}));
      console.log(`\nDELETED job ${transcriptionJob.TranscriptionJobName}`);
    }
  }
};
main();

// For further usage examples, see
// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/transcribe-examples-section.html
//
// For streaming, see
// https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html
// https://docs.aws.amazon.com/transcribe/latest/dg/API_streaming_StartStreamTranscription.html
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-transcribe-streaming/index.html