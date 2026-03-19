declare module 'google-trends-api' {
  interface InterestOverTimeOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
    timezone?: number;
    granularTimeResolution?: boolean;
  }

  function interestOverTime(options: InterestOverTimeOptions): Promise<string>;

  export = { interestOverTime };
}
