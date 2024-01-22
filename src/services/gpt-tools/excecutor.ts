import { RequiredActionFunctionToolCall } from 'openai/src/resources/beta/threads/index.js';
import GetWeatherTool from './weather.tool';
import ChangeLedTool from './led.tool';

export const enabledTools: Record<string, GPTFunctionTool<any>> = {
  getWeather: new GetWeatherTool(
    process.env.WEATHER_API_KEY ?? '',
  ),
  changeLedState: new ChangeLedTool(
    process.env.LED_API_URL ?? '',
  ),
};

type ToolCallAsyncResponse = {
  tool_call_id: string,
  output: string
};

type ToolResponse = ToolCallAsyncResponse;
type RequiredAction = RequiredActionFunctionToolCall;

/**
 * ds
 * @param toolCall ds
 * @returns sd
 */
async function execute(toolCall: RequiredAction): Promise<string> {
  const { name, arguments: strArgs } = toolCall.function;
  try {
    const func = enabledTools[name];
    const args = JSON.parse(strArgs);
    if (func != null) {
      console.log(`corriendo función "${name}" con parámetros ${strArgs}`);
      return await func.run(args);
    }
    throw new Error('No existe la función solicitada');
  } catch (err) {
    return `${err}`;
  }
}

export async function Executor(toolCalls: RequiredAction[]): Promise<ToolResponse[]> {
  const responses = await Promise.allSettled(toolCalls
    .map((toolCall) => execute(toolCall)
      .catch(
        (err) => `${err}`,
      )));

  return responses.map((res, idx) => {
    const { id } = toolCalls[idx];
    if (res.status === 'fulfilled') {
      return {
        tool_call_id: id,
        output: res.value,
      };
    }

    return {
      tool_call_id: id,
      output: `${res.reason}`,
    };
  });
}

export default Executor;
