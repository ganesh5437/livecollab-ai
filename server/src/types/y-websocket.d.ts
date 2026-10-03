// y-websocket ships its server helper without type declarations.
declare module "y-websocket/bin/utils" {
  export const docs: Map<string, any>;
  export function setupWSConnection(conn: any, req: any, opts?: { docName?: string; gc?: boolean }): void;
}
