/// <reference types="vite/client" />

export interface ImportMetaEnv {
  readonly VITE_SERVER_URI: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}
