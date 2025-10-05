import axios from 'axios';
import 'dotenv/config';

const API_BASE_URL = 'https://api.daydream.live';

async function createStream(pipelineId, apiKey) {
  if (!apiKey) {
    throw new Error('Daydream API key is not set. Please create a .env file with DAYDREAM_API_KEY.');
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/v1/streams`,
      { pipeline_id: pipelineId },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating Daydream stream:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function main() {
  const pipelineId = process.env.PIPELINE_ID || 'pip_SD-turbo';
  const apiKey = process.env.DAYDREAM_API_KEY;

  try {
    console.log(`Creating stream with pipeline ID: ${pipelineId}`);
    const streamData = await createStream(pipelineId, apiKey);
    console.log('Stream created successfully:');
    console.log(JSON.stringify(streamData, null, 2));
  } catch (error) {
    console.error('Failed to create stream.');
  }
}

main();