//garmin-fitsdk.d.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "@garmin/fitsdk" {
  export class Encoder {
    constructor();
    onMesg(mesgNum: any, data: any): void;
    close(): Uint8Array;
  }

  export class Profile {
    static readonly MesgNum: Record<string, any>;
  }

  export class Stream {
    static fromArrayBuffer(buffer: ArrayBuffer): Stream;
    static fromByteArray(byteArray: Uint8Array): Stream;
  }

  export interface RecordMesg {
    positionLat?: number; // semicircles
    positionLong?: number; // semicircles
    distance?: number; // meters
    altitude?: number; // meters
    speed?: number; // m/s
    heartRate?: number; // bpm
    cadence?: number; // rpm
    power?: number; // watts
    timestamp?: Date;
  }

  export interface CoursePointMesg {
    messageIndex?: number;
    timestamp?: Date;
    positionLat?: number; // semicircles
    positionLong?: number; // semicircles
    distance?: number; // meters along course
    type?: string;
    name?: string;
  }

  export interface CourseMesg {
    name?: string;
    sport?: string;
  }

  export interface LapMesg {
    timestamp?: Date;
    startTime?: Date;
    totalDistance?: number;
    startPositionLat?: number;
    startPositionLong?: number;
    endPositionLat?: number;
    endPositionLong?: number;
  }

  export interface FitMessages {
    recordMesgs: RecordMesg[];
    coursePointMesgs: CoursePointMesg[];
    courseMesgs: CourseMesg[];
    lapMesgs: LapMesg[];
  }

  export interface DecoderReadResult {
    messages: FitMessages;
    errors: any[];
  }

  export class Decoder {
    constructor(stream: Stream);
    isFIT(): boolean;
    checkIntegrity(): boolean;
    read(): DecoderReadResult;
  }
}
