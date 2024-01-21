type LedToolType = {
  newState: string;
};
export default class ChangeLedTool implements GPTFunctionTool<LedToolType> {
  url: string;

  constructor(url:string) {
    this.url = url;
  }

  async run({ newState }: LedToolType): Promise<string> {
    const response = await fetch(this.url, {
      method: 'POST',
      body: `${newState}`,
    });

    const { state } = await response.json() as { state?: boolean };

    if (state == null) throw new Error('Invalid response');

    return `Led state changed to ${state}`;
  }

  parameters = {};

  public name = 'changeLed';

  public description = 'Change led state';
}
