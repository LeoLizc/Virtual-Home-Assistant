type GetCityWeatherType = {
  ubicacion: string,
};

export default class GetWeatherTool implements GPTFunctionTool<GetCityWeatherType> {
  readonly description: string = '';

  readonly parameters: object = {
    a: 1,
  };

  key: string = '';

  constructor(key: string) {
    this.key = key;
  }

  async run({ ubicacion: city }: GetCityWeatherType) {
    const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${this.key}&q=${city}&aqi=no`);
    if (response.status !== 200) {
      throw new Error('Fallo al consultar la api del clima');
    }
    const data = await response.json();

    const result = {
      temperatura: data.current.temp_c,
      condicion: data.current.condition.text,
    };

    return JSON.stringify(result);
  }
}
