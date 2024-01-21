interface GPTFunctionTool<T extends object> {
  description: string;
  run(args: T): Promise<string>;
  parameters: object;
}
