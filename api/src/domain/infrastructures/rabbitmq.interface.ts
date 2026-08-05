export interface PublishQueue {
  key: string;
  exchange: string;
  delay?: number;
  payload: Record<string, any>;
}

export interface SubscribeQueue {
  key: string;
  exchange: string;
}

export interface PublishUniqueQueue extends PublishQueue {
  delay: number;
  keyTrust: string;
}

export interface SubscribeUniqueQueue extends SubscribeQueue {
  keyTrust: string;
  binding: string;
}

export interface DelayConsume {
  key: string;
  keyTrust: string;
  binding: string;
  cb: Function;
}

export interface DelayPublish {
  exchange: string;
  key: string;
  keyTrust: string;
  delay: number;
  data: string;
}
