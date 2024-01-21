import OpenAI from 'openai';

const openai = {
  value: process.env.OPENAI_API_KEY == null ? null : new OpenAI(),
  assitantId: 'asst_aERphz776snZoOnLLFpy3kKC',
};
export default openai;
