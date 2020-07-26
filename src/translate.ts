import axios from 'axios';
import {TranslationServiceClient} from '@google-cloud/translate';
import { uploadFileToGS, randomFileName, downloadFileFromGs, getBucketName } from './gsHelpers';

export const translate = async function (url: string, lang = 'ja'): Promise<Buffer> {
    const {data: html} = await axios.get(url);

    const inputFileCode = randomFileName();
    const inputFile = inputFileCode+'.html';
    await uploadFileToGS('i18n_input', inputFile, html);

    await batchTranslateText(
      process.env.GOOGLE_CLOUD_PROJECT_ID!,
      `gs://${getBucketName('i18n_input')}/${inputFile}`,
      `gs://${getBucketName('i18n_output')}/${inputFileCode}`,
      lang
    );

    return await downloadFileFromGs(
      'i18n_output',
      `${inputFileCode}/${getBucketName('i18n_input')}_${inputFileCode}_${lang}_translations.html`
    );
};

async function batchTranslateText(projectId: string, inputUri: string, outputUri: string, lang: string) {
    // Instantiates a client
    const translationClient = new TranslationServiceClient();

    // Construct request
    const request = {
      parent: `projects/${projectId}/locations/us-central1`,
      sourceLanguageCode: 'en',
      targetLanguageCodes: [lang],
      inputConfigs: [
        {
          mimeType: 'text/html', // mime types: text/plain, text/html
          gcsSource: {
            inputUri: inputUri,
          },
        },
      ],
      outputConfig: {
        gcsDestination: {
          outputUriPrefix: outputUri.endsWith('/') ? outputUri : `${outputUri}/`,
        },
      },
    };

    try {
      // Batch translate text using a long-running operation
      const [operation] = await translationClient.batchTranslateText(request);

      // Wait for operation to complete.
      const [response] = await operation.promise(); 

      console.log(`Total Characters: ${response.totalCharacters}`);
      console.log(`Translated Characters: ${response.translatedCharacters}`);
      return response;
    } catch (error) {
        console.error(error);
        console.error(error.details);
        throw error;
    }
  }
